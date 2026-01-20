import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { keep, disallow } from 'feathers-hooks-common';
import yup from '../../packages/yup';
import { throwValidationErrors, getSchemaErrors } from '../../helpers';
import _isEmpty from 'lodash/isEmpty';
import { Unprocessable } from '@feathersjs/errors';
import dayjs from '../../utils/dayjs';
import newMessageTemplate from '../../emailTemplates/newMessage';
import { getStatsMatches } from '../../utils/sqlConditions';
import { getEmailContact, getPlayerName } from '../users/helpers';

const validateCreate = (options) => async (context) => {
    // Validate data
    {
        const schema = yup.object().shape({
            recipientId: yup.number().required(),
            message: yup.string().required('Message is required.').max(1000),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const currentUser = context.params.user;
    context.data.senderId = currentUser.id;

    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;
    const { config } = context.params;

    if (context.data.recipientId === currentUser.id) {
        throw new Unprocessable('The users are the same.');
    }

    const recipient = await users.findByPk(context.data.recipientId);
    if (!recipient) {
        throw new Unprocessable('The user does not exist.');
    }

    // get current tournaments
    {
        // Get current season
        const currentDate = dayjs.tz();
        const [[currentSeason]] = await sequelize.query(
            `SELECT * FROM seasons WHERE startDate<:date ORDER BY startDate DESC LIMIT 0, 1`,
            { replacements: { date: currentDate.format('YYYY-MM-DD HH:mm:ss') } }
        );
        if (!currentSeason) {
            throw new Unprocessable('The season is not started yet.');
        }

        const [tournaments] = await sequelize.query(
            `SELECT p.tournamentId,
                    count(*) AS cnt
               FROM players AS p,
                    tournaments AS t
              WHERE p.tournamentId=t.id AND
                    p.isActive=1 AND
                    t.seasonId=:seasonId AND
                    (p.userId=:userId OR p.userId=:currentUserId)
           GROUP BY p.tournamentId`,
            { replacements: { currentUserId: currentUser.id, userId: recipient.id, seasonId: currentSeason.id } }
        );

        const hasTheSameTournament = tournaments.some((item) => item.cnt === 2);
        if (!hasTheSameTournament) {
            throw new Unprocessable('You can only send messages to players on your current ladders.');
        }
    }

    // get total number of matches
    {
        const [[row]] = await sequelize.query(
            `SELECT count(*) AS cnt
               FROM matches AS m,
                    players AS p
              WHERE (m.challengerId=p.id OR m.acceptorId=p.id OR m.challenger2Id=p.id OR m.acceptor2Id=p.id) AND
                    p.userId=:userId AND
                    ${getStatsMatches('m')}`,
            { replacements: { userId: currentUser.id } }
        );

        if (row.cnt < config.minMatchesToSendMessages) {
            throw new Unprocessable(
                `You are allowed to send messages only after playing at least ${config.minMatchesToSendMessages} matches.`
            );
        }
    }

    // Get total messages this week
    {
        const monday = dayjs.tz().isoWeekday(1).hour(0).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss');

        const [[row]] = await sequelize.query(
            `SELECT count(*) AS cnt
               FROM messages
              WHERE senderId=:userId AND
                    createdAt>:date`,
            { replacements: { userId: currentUser.id, date: monday } }
        );

        if (row.cnt >= config.maxMessagesPerWeek) {
            throw new Unprocessable(`You are allowed to send only ${config.maxMessagesPerWeek} messages per week.`);
        }
    }

    return context;
};

const sendMessage = (options) => async (context) => {
    const currentUser = context.params.user;
    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;
    const recipient = await users.findByPk(context.data.recipientId);
    const { config } = context.params;

    context.app.service('api/emails').create({
        to: [getEmailContact(recipient)],
        replyTo: getEmailContact(currentUser),
        subject: `${getPlayerName(currentUser)} Sent You a Message!`,
        html: newMessageTemplate(config, { message: context.data.message, currentUser }),
        priority: 2,
    });

    return context;
};

export default {
    before: {
        all: [authenticate('jwt')],
        find: [disallow()],
        get: [disallow()],
        create: [validateCreate(), keep('senderId', 'recipientId', 'message')],
        update: [disallow()],
        patch: [disallow()],
        remove: [disallow()],
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [sendMessage()],
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
