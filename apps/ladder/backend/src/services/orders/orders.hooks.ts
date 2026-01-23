import type { HookContext } from '@feathersjs/feathers';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { disallow } from 'feathers-hooks-common';
import { calculateNextOrder } from './helpers';
import { getPlayerName, getEmailContact, getEstablishedElo } from '../users/helpers';
import Stripe from 'stripe';
import dayjs from '../../utils/dayjs';
import { NotFound, Unprocessable } from '@feathersjs/errors';
import { purgeTournamentCache, sendWelcomeEmail } from '../commonHooks';
import referralFirstPaymentTemplate from '../../emailTemplates/referralFirstPayment';
import specialReasonNotificationTemplate from '../../emailTemplates/specialReasonNotification';
import { getEmailsFromList } from '../settings/helpers';
import { sendDoublesTeamInvitation, formatTeamName } from '../players/helpers';
import { POOL_PARTNER_ID } from '../../constants';

const getProcessedOrders = () => async (context: HookContext) => {
    const userId = context.params.user!.id;

    const sequelize = context.app.get('sequelizeClient');
    const [rows] = await sequelize.query(
        `
        SELECT *
          FROM orders
         WHERE userId=:userId AND
               processedAt IS NOT NULL
      ORDER BY processedAt DESC`,
        { replacements: { userId } }
    );

    context.result = {
        data: rows,
    };

    return context;
};

const issueReferralCredit = async (context: HookContext, user) => {
    const sequelize = context.app.get('sequelizeClient');
    const { config } = context.params;
    const { users, payments } = sequelize.models;

    if (!user.referrerUserId) {
        return;
    }

    const referrerUser = await users.findByPk(user.referrerUserId);
    // TODO: check refYears and refStartedAt as well
    if (referrerUser.refPercent) {
        // TODO: issue referral percent
        return;
    }

    const ACTION_NAME = `firstPaymentCreditForUser${user.id}`;

    const [actions] = await sequelize.query(`SELECT * FROM actions WHERE tableId=:tableId AND name=:name`, {
        replacements: { tableId: referrerUser.id, name: ACTION_NAME },
    });
    if (actions.length > 0) {
        return;
    }

    const userFullName = getPlayerName(user);

    await payments.create({
        userId: referrerUser.id,
        type: 'discount',
        description: `Referral credit for ${userFullName} (first payment)`,
        amount: config.referralFirstPaymentCredit,
    });

    await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:tableId, :name)`, {
        replacements: { tableId: referrerUser.id, name: ACTION_NAME },
    });

    // don't wait for email sent
    context.app.service('api/emails').create({
        to: [getEmailContact(referrerUser)],
        subject: `You Just Earned $${config.referralFirstPaymentCredit / 100} in Rival Credit!`,
        html: referralFirstPaymentTemplate({ config, referralName: userFullName }),
    });
};

// This is just a helper, not a hook
const processOrder = async (order, context) => {
    const { TL_URL } = process.env;
    const { players, payments, orders, users } = context.app.get('sequelizeClient').models;
    const sequelize = context.app.get('sequelizeClient');
    const { config } = context.params;

    if (!order) {
        throw new Unprocessable('Order is not found');
    }

    if (order.processedAt) {
        throw new Unprocessable('This order is already processed');
    }

    const result = {};
    let isWelcomeEmail = false;
    const { transactions, partners } = JSON.parse(order.payload);

    const user = await users.findByPk(order.userId);
    if (!user) {
        throw new Unprocessable('Wrong user');
    }

    await sequelize.transaction(async (t) => {
        for (const item of transactions) {
            if (['balance', 'info'].includes(item.type)) {
                continue;
            }

            if (item.type === 'product') {
                if (item.tournamentId) {
                    const partnerInfo = partners?.[`partner-${item.tournamentId}`];
                    const joinedToPool = partnerInfo?.decision === 'pool';
                    const existingPlayer = await players.findOne({
                        where: { userId: user.id, tournamentId: item.tournamentId },
                        transaction: t,
                    });

                    const params = {
                        ...(item.joinReason ? { joinReason: item.joinReason } : {}),
                        ...(partnerInfo?.teamName ? { teamName: formatTeamName(partnerInfo.teamName) } : {}),
                        ...(joinedToPool ? { partnerId: POOL_PARTNER_ID, partnerInfo: partnerInfo.partnerInfo } : {}),
                    };

                    if (!existingPlayer) {
                        await players.create(
                            {
                                userId: user.id,
                                tournamentId: item.tournamentId,
                                joinForFree: item.cost === 0,
                                ...params,
                            },
                            { transaction: t }
                        );
                        isWelcomeEmail = true;
                    } else if (!existingPlayer.isActive) {
                        await players.update(
                            {
                                isActive: true,
                                joinForFree: item.cost === 0,
                                ...params,
                            },
                            { where: { id: existingPlayer.id }, transaction: t }
                        );
                    }

                    if (item.joinReason) {
                        const [[settings]] = await sequelize.query(`SELECT * FROM settings WHERE id=1`);
                        const elo = await getEstablishedElo({ userId: user.id, config, sequelize });
                        const emails = getEmailsFromList(settings.newFeedbackNotification);

                        const [[level]] = await sequelize.query(
                            `
                            SELECT l.*
                              FROM tournaments AS t,
                                   levels AS l
                             WHERE t.levelId=l.id AND t.id=:tournamentId`,
                            { replacements: { tournamentId: item.tournamentId } }
                        );

                        context.app.service('api/emails').create({
                            to: emails.map((email) => ({ email })),
                            subject: `The player joined wrong ladder because of special reason`,
                            html: specialReasonNotificationTemplate({
                                config,
                                userName: getPlayerName(user),
                                profileLink: `${TL_URL}/player/${user.slug}`,
                                joinReason: item.joinReason,
                                elo,
                                level: level.name,
                            }),
                        });
                    }

                    purgeTournamentCache({ tournamentId: item.tournamentId })(context);
                }
            }

            if (item.cost !== 0) {
                await payments.create(
                    {
                        userId: user.id,
                        type: item.type,
                        description: item.description,
                        amount: item.cost,
                        tournamentId: item.type === 'product' && item.tournamentId ? item.tournamentId : null,
                    },
                    { transaction: t }
                );
            }
        }

        if (order.amount !== 0) {
            await payments.create(
                { userId: user.id, type: 'payment', description: 'Payment', amount: order.amount, orderId: order.id },
                { transaction: t }
            );

            await issueReferralCredit(context, user);
        }

        // mark order as processed
        await orders.update(
            { processedAt: dayjs.tz().format('YYYY-MM-DD HH:mm:ss+00:00') },
            { where: { id: order.id }, transaction: t }
        );

        const firstTournament = transactions.find((item) => item.type === 'product' && item.tournamentId);
        if (firstTournament) {
            const [[item]] = await sequelize.query(
                `
                SELECT s.year,
                       s.season,
                       s.startDate,
                       l.name AS levelName,
                       l.slug AS levelSlug
                  FROM tournaments AS t,
                       seasons AS s,
                       levels AS l
                 WHERE t.seasonId=s.id AND
                       t.levelId=l.id AND
                       t.id=:tournamentId`,
                {
                    replacements: { tournamentId: firstTournament.tournamentId },
                }
            );

            result.url = `/season/${item.year}/${item.season}/${item.levelSlug}`;
            result.title = 'Go to the Ladder';
            result.season = item;
        }

        result.processed = true;
    });

    // Run it out of the transaction block
    if (isWelcomeEmail) {
        await sendWelcomeEmail({ userId: user.id })(context);
    }

    const tournamentIds = transactions.filter((item) => item.type === 'product').map((item) => item.tournamentId);
    await sendDoublesTeamInvitation(context, tournamentIds, partners);

    return result;
};

const populateOrder = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const { seasons } = sequelize.models;
    const { config, user } = context.params;
    const { seasonId, tournaments, preview, joinReason, joinForFree = [], partners } = context.data;

    const season = await seasons.findByPk(seasonId);
    if (!season) {
        throw new Unprocessable('There is no season to order');
    }

    if (dayjs.tz().isAfter(dayjs.tz(season.endDate))) {
        throw new Unprocessable('The season is over');
    }

    let [seasonTournaments] = await sequelize.query('SELECT id FROM tournaments WHERE seasonId=:seasonId', {
        replacements: { seasonId: season.id },
    });
    seasonTournaments = seasonTournaments.map((t) => t.id);
    if (!tournaments.every((id) => seasonTournaments.includes(id))) {
        throw new Unprocessable('Some tournaments are not from the current season');
    }

    let [userTournaments] = await sequelize.query(
        `
        SELECT tournamentId AS id
          FROM players
         WHERE isActive=1 AND
               userId=:userId`,
        { replacements: { userId: user.id } }
    );
    userTournaments = userTournaments.map((t) => t.id);
    if (tournaments.some((id) => userTournaments.includes(id))) {
        throw new Unprocessable('You are already registered for this ladder');
    }

    const [payments] = await sequelize.query('SELECT * FROM payments WHERE userId=:userId', {
        replacements: { userId: user.id },
    });

    const [allTournaments] = await sequelize.query(
        `
        SELECT t.id,
               l.id AS levelId,
               l.name AS levelName,
               l.type AS levelType,
               l.slug AS levelSlug,
               l.maxTlr AS levelMaxTlr,
               s.year AS seasonYear,
               s.season AS seasonSeason
          FROM tournaments AS t,
               levels AS l,
               seasons AS s
         WHERE t.levelId=l.id AND
               t.seasonId=s.id AND
               t.seasonId=:seasonId
      ORDER BY l.position`,
        { replacements: { seasonId: season.id } }
    );

    const establishedElo = await getEstablishedElo({ userId: user.id, config, sequelize });

    const isEarlyRegistration = dayjs.tz().isBefore(dayjs.tz(season.startDate));
    const nextOrder = calculateNextOrder({
        payments,
        allTournaments,
        tournaments: allTournaments.filter((t) => tournaments.includes(t.id)),
        joinReason,
        joinForFree,
        singlesCost: config.singlesCost,
        doublesCost: config.doublesCost,
        earlyRegistrationDiscount: config.earlyRegistrationDiscount,
        additionalLadderDiscount: config.additionalLadderDiscount,
        tooHighTlrDiscount: config.tooHighTlrDiscount,
        isEarlyRegistration,
        partners,
        establishedElo,
    });

    context.result = nextOrder;

    // We don't want to create a Stripe session for every try
    if (!preview) {
        if (nextOrder.total === 0) {
            const order = await sequelize.models.orders.create({
                userId: user.id,
                amount: nextOrder.total,
                payload: JSON.stringify(nextOrder.payload),
            });

            context.result = await processOrder(order, context);
        } else {
            await sequelize.transaction(async (t) => {
                const order = await sequelize.models.orders.create(
                    { userId: user.id, amount: nextOrder.total, payload: JSON.stringify(nextOrder.payload) },
                    { transaction: t }
                );

                const { TL_URL, TL_STRIPE_KEY } = process.env;
                const stripe = Stripe(TL_STRIPE_KEY);

                const session = await stripe.checkout.sessions.create({
                    customer_email: user.email,
                    line_items: [
                        {
                            price_data: {
                                currency: 'usd',
                                product_data: {
                                    name:
                                        nextOrder.payload.transactions
                                            .filter((item) => item.type === 'product')
                                            .map((item) => item.description)
                                            .join(', ') || 'Registration fee',
                                },
                                unit_amount: nextOrder.total,
                            },
                            quantity: 1,
                        },
                    ],
                    mode: 'payment',
                    success_url: `${TL_URL}/register/success/{CHECKOUT_SESSION_ID}`,
                    cancel_url: `${TL_URL}/register`,
                    metadata: { orderId: order.id, city: config.city, url: TL_URL },
                });

                await sequelize.models.orders.update(
                    { sessionId: session.id },
                    { where: { id: order.id }, transaction: t }
                );

                context.result.paymentUrl = session.url;
            });
        }
    }

    return context;
};

const processStripeSession = () => async (context: HookContext) => {
    const { orders } = context.app.get('sequelizeClient').models;
    const { sessionId } = context.data;

    const { TL_STRIPE_KEY } = process.env;
    const stripe = Stripe(TL_STRIPE_KEY);

    let session;
    try {
        session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (e) {
        throw new Unprocessable('Payment session is not found');
    }

    if (session.status !== 'complete' || session.payment_status !== 'paid') {
        throw new Unprocessable('Session is not complete');
    }

    const orderId = Number(session.metadata.orderId);
    const order = await orders.findByPk(orderId);

    if (!order) {
        throw new Unprocessable('Order is not found');
    }

    if (order.sessionId !== sessionId) {
        throw new Unprocessable('Wrong session');
    }

    if (order.amount !== session.amount_total) {
        throw new Unprocessable('Wrong amount');
    }

    context.result = await processOrder(order, context);

    return context;
};

const runCustomAction = () => async (context: HookContext) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'processStripeSession') {
        await processStripeSession()(context);
    } else {
        throw new NotFound();
    }

    if (!context.result) {
        context.result = { status: 'success' };
    }
};

export default {
    before: {
        all: [],
        find: [authenticate('jwt'), getProcessedOrders()],
        get: [disallow()],
        create: [authenticate('jwt'), populateOrder()],
        update: [runCustomAction()],
        patch: [disallow()],
        remove: [disallow()],
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },

    error: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },
};
