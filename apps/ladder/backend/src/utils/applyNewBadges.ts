import { createStore } from '../services/users/badgeStore';
import dayjs from './dayjs';
import { getEmailContact, getWeekNumber, getDateByWeekNumber } from '../services/users/helpers';
import { badges as allBadges } from './badges';
import renderImage from './renderImage';
import _capitalize from 'lodash/capitalize';
import newBadgeTemplate from '../emailTemplates/newBadge';
import logger from '@rival-tennis-ladder/logger';
import { BRACKET_BOT_ID } from '../constants';
import getCombinedConfig from './getCombinedConfig';
import { limitedPromiseAll } from '../helpers';

const ACTION_NAME = 'generateBadges';

const getBadgeCode = badge => {
    const parts = badge.code.split(':');

    if (!/^level/.test(badge.code)) {
        return { code: parts[0], amount: parts[1] };
    }

    return {
        code: parts[1],
        levelId: Number(parts[0].slice(5)),
        amount: parts[2],
    };
};

export const getUsersStats = async ({
    sequelize,
    userId = null,
    startDate,
    endDate = dayjs.tz().format('YYYY-MM-DD HH:mm:ss'),
}) => {
    const store = createStore();

    // Set config to the store
    const config = await getCombinedConfig();
    store.dispatch({
        type: 'SET_CONFIG',
        payload: config,
    });

    if (!startDate) {
        const [[action]] = await sequelize.query(
            `SELECT * FROM actions WHERE name=:name ORDER BY tableId DESC LIMIT 0, 1`,
            { replacements: { name: ACTION_NAME } }
        );

        startDate = action ? getDateByWeekNumber(action.tableId) : '2000-01-01 00:00:00';
    }

    const badges = {};
    const unverifiedBadges = {};
    {
        const [rows] = await sequelize.query(
            `SELECT id, userId, code, achievedAt FROM badges` + (userId ? ` WHERE userId=${userId}` : '')
        );
        for (const row of rows) {
            if (row.achievedAt < startDate) {
                badges[row.userId] = badges[row.userId] || new Set();
                badges[row.userId].add(row.code);
            } else {
                unverifiedBadges[row.userId] = unverifiedBadges[row.userId] || {};
                unverifiedBadges[row.userId][row.code] = row;
            }
        }
    }

    const [users] = await sequelize.query(
        `SELECT id,
                createdAt,
                badgesStats AS stats
           FROM users` + (userId ? ` WHERE id=${userId}` : '')
    );

    store.dispatch({
        type: 'LOAD_USERS',
        payload: users.map(user => ({
            ...user,
            stats: user.stats ? JSON.parse(user.stats) : null,
            badges: badges[user.id] || new Set(),
            unverifiedBadges: unverifiedBadges[user.id] || {},
        })),
    });

    const actions = [];

    // Avatar created
    {
        const [rows] = await sequelize.query(
            `
            SELECT id AS userId,
            avatarCreatedAt,
            avatarCreatedAt AS sortDate
            FROM users
            WHERE avatarCreatedAt IS NOT NULL AND
            avatarCreatedAt>:startDate AND
            avatarCreatedAt<=:endDate`,
            { replacements: { startDate, endDate } }
        );
        actions.push(
            ...rows.map(item => ({
                type: 'ADD_AVATAR',
                payload: item,
            }))
        );
    }

    // Profile completed
    {
        const [rows] = await sequelize.query(
            `
            SELECT id AS userId,
            profileCompletedAt,
            profileCompletedAt AS sortDate
            FROM users
            WHERE profileCompletedAt IS NOT NULL AND
            profileCompletedAt>:startDate AND
            profileCompletedAt<=:endDate`,
            { replacements: { startDate, endDate } }
        );
        actions.push(
            ...rows.map(item => ({
                type: 'PROFILE_COMPLETE',
                payload: item,
            }))
        );
    }

    // Matches
    {
        const [rows] = await sequelize.query(
            `
            SELECT m.id,
                   m.challengerId,
                   m.acceptorId,
                   m.challengerElo,
                   m.acceptorElo,
                   m.challenger2Elo,
                   m.acceptor2Elo,
                   m.challengerEloChange,
                   m.acceptorEloChange,
                   m.challengerPoints,
                   m.acceptorPoints,
                   m.challenger2Points,
                   m.acceptor2Points,
                   m.challengerMatches,
                   m.acceptorMatches,
                   m.winner,
                   m.playedAt AS sortDate,
                   m.playedAt,
                   m.score,
                   m.type,
                   m.finalSpot,
                   m.battleId,
                   m.wonByDefault,
                   m.wonByInjury,
                   m.initial,
                   m.stat,
                   m.statAddedBy,
                   pc.tournamentId,
                   pc.userId AS challengerUserId,
                   pa.userId AS acceptorUserId,
                   pc2.userId AS challenger2UserId,
                   pa2.userId AS acceptor2UserId,
                   t.seasonId,
                   t.levelId,
                   s.year,
                   s.season,
                   l.type AS levelType,
                   l.baseTlr AS levelBaseTlr
              FROM matches AS m
              JOIN players AS pc ON m.challengerId=pc.id
              JOIN players AS pa ON m.acceptorId=pa.id
              LEFT JOIN players AS pc2 ON m.challenger2Id=pc2.id
              LEFT JOIN players AS pa2 ON m.acceptor2Id=pa2.id
              JOIN tournaments AS t ON t.id=pc.tournamentId
              JOIN seasons AS s ON s.id=t.seasonId
              JOIN levels AS l ON l.id=t.levelId
             WHERE m.score IS NOT NULL AND
                   m.sameAs IS NULL AND
                   m.unavailable=0 AND
                   m.playedAt IS NOT NULL AND
                   m.playedAt>:startDate AND
                   m.playedAt<=:endDate`,
            { replacements: { startDate, endDate } }
        );
        actions.push(...rows.map(item => ({ type: 'ADD_MATCH', payload: item })));
    }

    // Proposals created
    {
        const [rows] = await sequelize.query(
            `
            SELECT m.id,
                   m.initial,
                   m.createdAt AS sortDate,
                   m.createdAt,
                   m.playedAt,
                   m.place,
                   m.practiceType,
                   pc.userId AS challengerUserId
              FROM matches AS m
              JOIN players AS pc ON m.challengerId=pc.id
             WHERE m.initial=1 AND
                   m.sameAs IS NULL AND
                   m.createdAt>:startDate AND
                   m.createdAt<=:endDate`,
            { replacements: { startDate, endDate } }
        );
        actions.push(
            ...rows.map(item => ({
                type: 'ADD_PROPOSAL',
                payload: item,
            }))
        );
    }

    // Proposals accepted
    {
        const [rows] = await sequelize.query(
            `
            SELECT m.id,
                   m.initial,
                   m.acceptedAt AS sortDate,
                   m.acceptedAt,
                   m.playedAt,
                   pa.userId AS acceptorUserId,
                   pc.userId AS challengerUserId
              FROM matches AS m
              JOIN players AS pa ON m.acceptorId=pa.id
              JOIN players AS pc ON m.challengerId=pc.id
             WHERE m.initial=1 AND
                   m.sameAs IS NULL AND
                   m.acceptedAt IS NOT NULL AND
                   m.acceptorId IS NOT NULL AND
                   m.acceptedAt>:startDate AND
                   m.acceptedAt<=:endDate`,
            { replacements: { startDate, endDate } }
        );
        actions.push(
            ...rows.map(item => ({
                type: 'ACCEPT_PROPOSAL',
                payload: item,
            }))
        );
    }

    // Feedbacks
    {
        const [rows] = await sequelize.query(
            `
            SELECT id,
                   userId,
                   createdAt,
                   createdAt AS sortDate
              FROM feedbacks
             WHERE createdAt>:startDate AND
                   createdAt<=:endDate`,
            { replacements: { startDate, endDate } }
        );
        actions.push(
            ...rows.map(item => ({
                type: 'ADD_FEEDBACK',
                payload: item,
            }))
        );
    }

    // Photos
    {
        const [rows] = await sequelize.query(
            `
            SELECT id,
                   userId,
                   createdAt,
                   createdAt AS sortDate
              FROM photos
             WHERE createdAt>:startDate AND
                   createdAt<=:endDate
          ORDER BY id`,
            { replacements: { startDate, endDate } }
        );
        const processed = new Set();
        actions.push(
            ...rows
                .filter(item => {
                    if (processed.has(item.userId)) {
                        return false;
                    }
                    processed.add(item.userId);
                    return true;
                })
                .map(item => ({
                    type: 'ADD_PHOTO',
                    payload: item,
                }))
        );
    }

    // Register users with referrals
    {
        const [rows] = await sequelize.query(
            `
            SELECT id,
                   referrerUserId,
                   createdAt,
                   createdAt AS sortDate
              FROM users
             WHERE referrerUserId>0 AND
                   createdAt>:startDate AND
                   createdAt<=:endDate`,
            { replacements: { startDate, endDate } }
        );
        actions.push(
            ...rows.map(item => ({
                type: 'REGISTER_USER',
                payload: item,
            }))
        );
    }

    // Prediction winners
    {
        const [rows] = await sequelize.query(
            `
            SELECT p.userId,
                   t.predictionWonAt AS sortDate,
                   t.predictionWonAt,
                   t.seasonId,
                   t.levelId
              FROM tournaments AS t,
                   players AS p
             WHERE t.predictionWinner=p.id AND
                   t.predictionWinner!=:bracketBotId AND
                   t.predictionWinner IS NOT NULL AND
                   t.predictionWonAt>:startDate AND
                   t.predictionWonAt<=:endDate`,
            { replacements: { startDate, endDate, bracketBotId: BRACKET_BOT_ID } }
        );
        actions.push(
            ...rows.map(item => ({
                type: 'ADD_PREDICTION_WINNER',
                payload: item,
            }))
        );
    }

    actions.sort((a, b) => a.payload.sortDate.localeCompare(b.payload.sortDate));
    for (const action of actions) {
        store.dispatch(action);
    }

    if (userId) {
        return Object.values(store.getState().users)[0];
    }

    return Object.values(store.getState().users);
};

export const updateCurrentWeekUserBadges = async (app, userId) => {
    const sequelize = app.get('sequelizeClient');
    const { users, payments } = sequelize.models;
    const config = await getCombinedConfig();

    const userStat = await getUsersStats({ sequelize, userId });
    const newBadges = [];
    for (const badge of userStat.badgesHistory) {
        const unverifiedBadge = userStat.unverifiedBadges[badge.code];
        if (unverifiedBadge) {
            if (badge.achievedAt !== unverifiedBadge.achievedAt) {
                await sequelize.query('UPDATE badges SET achievedAt=:achievedAt WHERE id=:id', {
                    replacements: { achievedAt: badge.achievedAt, id: unverifiedBadge.id },
                });
            }
        } else {
            newBadges.push(badge);

            const [newBadgeId] = await sequelize.query(
                `INSERT INTO badges (userId, code, achievedAt) VALUES (:userId, :code, :achievedAt)`,
                { replacements: { userId, code: badge.code, achievedAt: badge.achievedAt } }
            );

            const { code, amount } = getBadgeCode(badge);
            const badgeInfo = allBadges[code];

            await payments.create({
                userId,
                type: 'discount',
                description: `Badge Credit (${badgeInfo.title}${amount ? `: ${_capitalize(amount)}` : ''})`,
                amount: 100,
                badgeId: newBadgeId,
            });
        }
    }

    if (newBadges.length > 0) {
        const sendNewBadgeMessage = async () => {
            const user = await users.findByPk(userId);
            if (!user.subscribeForBadges) {
                return;
            }

            const badges = [];
            for (const badge of newBadges) {
                const { code, levelId, amount } = getBadgeCode(badge);
                const badgeInfo = allBadges[code];
                const stats = levelId ? userStat.stats.levels[levelId] : userStat.stats;
                const state = badgeInfo.getState({
                    stats: {
                        ...stats,
                        // This is a hack to get correct tournament stage.
                        // Otherwise it will get the last stage (like champion).
                        // Which will cause badge duplication if final and champion badges are achieved at the same time.
                        ...(code === 'tournament' ? { tournamentResult: amount } : {}),
                    },
                });

                const props = encodeURIComponent(
                    JSON.stringify({
                        ...state.props,
                        percent: null,
                        disabled: false,
                        completed: false,
                    })
                );
                const img = await renderImage(`${process.env.TL_URL}/image/badge?props=${props}`);

                badges.push({
                    title: badgeInfo.title,
                    description: badgeInfo.description,
                    image: img.src,
                });
            }

            app.service('api/emails').create({
                // add 1 minute delay just this email to be the last in the sequence (after match result email for example)
                to: [{ ...getEmailContact(user), delay: 60 }],
                subject: `New Badge Earned!`,
                html: newBadgeTemplate(config, { badges }),
                priority: 2,
            });
        };

        // don't wait for it
        sendNewBadgeMessage();
    }
};

export const applyNewBadges = async (sequelize, forceRecalculation) => {
    const { payments } = sequelize.models;
    let startDate = '2000-01-01 00:00:00';

    if (forceRecalculation) {
        await sequelize.query('UPDATE users SET badgesStats=NULL');
    } else {
        const [[action]] = await sequelize.query(
            `SELECT * FROM actions WHERE name=:name ORDER BY tableId DESC LIMIT 0, 1`,
            { replacements: { name: ACTION_NAME } }
        );
        if (action) {
            startDate = getDateByWeekNumber(action.tableId);
        }
    }

    const currentWeekNumber = getWeekNumber(dayjs.tz().format('YYYY-MM-DD HH:mm:ss'));
    const endDate = getDateByWeekNumber(currentWeekNumber);

    if (startDate >= endDate) {
        return;
    }

    const updatedUsers = (await getUsersStats({ sequelize, startDate, endDate })).filter(user => user.updatedAt);

    await limitedPromiseAll(
        updatedUsers,
        async user => {
            await sequelize.query('UPDATE users SET badgesStats=:badgesStats WHERE id=:userId', {
                replacements: { userId: user.id, badgesStats: JSON.stringify(user.stats) },
            });

            for (const badge of user.badgesHistory) {
                if (user.unverifiedBadges[badge.code]) {
                    delete user.unverifiedBadges[badge.code];
                } else {
                    const [newBadgeId] = await sequelize.query(
                        `INSERT INTO badges (userId, code, achievedAt) VALUES (:userId, :code, :achievedAt)`,
                        { replacements: { userId: user.id, code: badge.code, achievedAt: badge.achievedAt } }
                    );

                    const { code, amount } = getBadgeCode(badge);
                    const badgeInfo = allBadges[code];

                    await payments.create({
                        userId: user.id,
                        type: 'discount',
                        description: `Badge Credit (${badgeInfo.title}${amount ? `: ${_capitalize(amount)}` : ''})`,
                        amount: 100,
                        badgeId: newBadgeId,
                    });
                }
            }

            if (!forceRecalculation) {
                for (const badge of Object.values(user.unverifiedBadges)) {
                    if (badge.achievedAt < endDate) {
                        await sequelize.query(`DELETE FROM payments WHERE badgeId=:id`, {
                            replacements: { id: badge.id },
                        });
                        await sequelize.query(`DELETE FROM badges WHERE id=:id`, { replacements: { id: badge.id } });
                    }
                }
            }
        },
        4
    );

    logger.info(`Applied new badges for ${updatedUsers.length} players`);

    await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:weekNumber, :name)`, {
        replacements: { weekNumber: currentWeekNumber, name: ACTION_NAME },
    });
};
