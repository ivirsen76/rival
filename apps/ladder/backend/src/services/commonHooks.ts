import type { HookContext } from '@feathersjs/feathers';
import { Forbidden } from '@feathersjs/errors';
import { getSlug } from '../helpers';
import _intersection from 'lodash/intersection';
import { Unprocessable } from '@feathersjs/errors';
import logger from '@rival-tennis-ladder/logger';
import newRegistrationTemplate from '../emailTemplates/newRegistration';
import dayjs from '../utils/dayjs';
import { getSeasonName } from './seasons/helpers';
import { updateCurrentWeekUserBadges } from '../utils/applyNewBadges';
import { encrypt } from '../utils/crypt';
import { getPlayerName, getEmailContact } from './users/helpers';
import { authenticate } from '@feathersjs/authentication/lib/hooks';

const { TL_ENABLE_REDIS } = process.env;

export const hasAnyRole = (roles) => (context: HookContext) => {
    roles = typeof roles === 'string' ? [roles] : roles;

    const userRoles = context.params.user.roles.split(',');
    if (_intersection(roles, userRoles).length === 0) {
        throw new Forbidden();
    }

    return context;
};

export const populateSlug =
    (fieldName, slugName = 'slug') =>
    (context: HookContext) => {
        if (context.data[fieldName]) {
            context.data[slugName] = getSlug(context.data[fieldName]);
        }

        return context;
    };

export const trim =
    (...fields) =>
    (context: HookContext) => {
        for (const field of fields) {
            if (context.data[field] && typeof context.data[field] === 'string') {
                context.data[field] = context.data[field].trim();
            }
        }

        return context;
    };

export const logEvent =
    (message, type = 'info') =>
    (context: HookContext) => {
        const { user } = context.params;
        if (user) {
            message += ` (${getPlayerName(user)} [${user.id}])`;
        }

        logger.info(message);

        return context;
    };

export const purgeTournamentCache =
    (options = {}) =>
    async (context: HookContext) => {
        if (!TL_ENABLE_REDIS) {
            return context;
        }

        const tournamentId = options.tournamentId || context.params.tournamentId;
        const client = context.app.get('redisClient');
        const sequelize = context.app.get('sequelizeClient');

        if (!client || !tournamentId) {
            throw new Unprocessable('Invalid request');
        }

        const [result] = await sequelize.query(
            'SELECT s.year, s.season, l.slug FROM tournaments AS t, seasons AS s, levels AS l WHERE t.seasonId=s.id AND t.levelId=l.id AND t.id=:id',
            { replacements: { id: tournamentId } }
        );
        const { year, season, slug } = result[0];

        const key = `api/tournaments/1?year=${year}&season=${season}&level=${slug}`;
        client.del(key);

        return context;
    };

export const purgeUserCache = () => async (context: HookContext) => {
    if (!TL_ENABLE_REDIS) {
        return context;
    }

    const { userId } = context.params;
    const client = context.app.get('redisClient');
    const sequelize = context.app.get('sequelizeClient');

    if (!client || !userId) {
        throw new Unprocessable('Invalid request');
    }

    // Purge tournament cache as it contains user information
    const [result] = await sequelize.query(
        `SELECT s.year, s.season, l.slug
           FROM tournaments AS t, seasons AS s, levels AS l, players AS p
          WHERE p.tournamentId=t.id AND t.seasonId=s.id AND t.levelId=l.id AND p.userId=:id`,
        { replacements: { id: userId } }
    );
    for (const row of result) {
        const { year, season, slug } = row;
        const key = `api/tournaments/1?year=${year}&season=${season}&level=${slug}`;
        client.del(key);
    }

    return context;
};

export const purgeSeasonCache = () => async (context: HookContext) => {
    if (!TL_ENABLE_REDIS) {
        return context;
    }

    const seasonId = options.seasonId || context.params.seasonId;
    const client = context.app.get('redisClient');
    const sequelize = context.app.get('sequelizeClient');

    if (!client || !seasonId) {
        throw new Unprocessable('Invalid request');
    }

    // Purge cache for all season tournaments
    const [rows] = await sequelize.query(
        `SELECT s.year, s.season, l.slug
           FROM tournaments AS t, seasons AS s, levels AS l
          WHERE t.seasonId=s.id AND t.levelId=l.id AND s.id=:seasonId`,
        { replacements: { seasonId } }
    );
    for (const row of rows) {
        const { year, season, slug } = row;
        const key = `api/tournaments/1?year=${year}&season=${season}&level=${slug}`;
        client.del(key);
    }

    return context;
};

export const purgeMatchCache = () => async (context: HookContext) => {
    if (!TL_ENABLE_REDIS) {
        return context;
    }

    const sequelize = context.app.get('sequelizeClient');
    const { matches } = sequelize.models;

    const matchId = options.matchId || context.params.matchId;
    const match = await matches.findByPk(matchId);

    if (!match) {
        return;
    }

    const otherMatchIds = match.same
        .split(',')
        .map(Number)
        .filter((id) => id !== matchId);
    for (const id of [matchId, ...otherMatchIds]) {
        const [result] = await sequelize.query(
            `SELECT p.tournamentId
               FROM matches AS m, players AS p
              WHERE m.challengerId=p.id AND
                    m.id=:matchId`,
            { replacements: { matchId: id } }
        );

        if (result.length === 1) {
            await purgeTournamentCache({ tournamentId: result[0].tournamentId })(context);
        }
    }

    return context;
};

export const sendWelcomeEmail =
    ({ userId }) =>
    async (context: HookContext) => {
        const sequelize = context.app.get('sequelizeClient');
        const { users } = sequelize.models;

        const user = await users.findByPk(userId);
        if (!user) {
            throw new Unprocessable('There is no user.');
        }

        const ACTION_NAME = 'welcomeMessage';
        const [actions] = await sequelize.query(`SELECT * FROM actions WHERE tableId=:userId AND name=:name`, {
            replacements: { userId, name: ACTION_NAME },
        });
        if (actions.length !== 0) {
            return;
        }

        let seasonName;
        let isBreak = false;
        let startDate = '';

        // check if the user just had the first tournament
        {
            const [players] = await sequelize.query(
                `
                    SELECT p.id,
                           p.createdAt,
                           s.year,
                           s.season,
                           s.startDate
                      FROM players AS p,
                           tournaments AS t,
                           seasons AS s
                     WHERE p.tournamentId=t.id AND
                           t.seasonId=s.id AND
                           p.userId=:userId
                  ORDER BY p.createdAt
                     LIMIT 0, 1`,
                { replacements: { userId } }
            );

            // no new tournaments yet
            if (players.length !== 1) {
                return;
            }

            // he was registered long ago
            if (dayjs.tz().diff(dayjs.tz(players[0].createdAt), 'day', true) > 1) {
                return;
            }

            seasonName = getSeasonName(players[0]);
            const startDateTz = dayjs.tz(players[0].startDate);
            if (dayjs.tz().isBefore(startDateTz)) {
                isBreak = true;
                startDate = startDateTz.format('MMMM D');
            }
        }

        const { city } = context.params.config;
        context.app.service('api/emails').create({
            to: [getEmailContact(user)],
            subject: `Welcome to the ${city} Rival Tennis Ladder!`,
            html: newRegistrationTemplate(context.params.config, {
                seasonName,
                isBreak,
                startDate,
                referralCode: user.referralCode,
            }),
        });

        await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:userId, :name)`, {
            replacements: { userId, name: ACTION_NAME },
        });

        return context;
    };

export const generateBadges = () => async (context: HookContext) => {
    const currentUser = context.params.user;

    await updateCurrentWeekUserBadges(context.app, currentUser.id);

    return context;
};

export const populateSalt = () => async (context: HookContext) => {
    const { data } = context;

    if (data.password) {
        data.salt = encrypt(data.password);
    }

    return context;
};

export const optionalAuthenticate = () => async (context: HookContext) => {
    try {
        await authenticate('jwt')(context);
    } catch (e) {
        // do nothing
    }

    return context;
};
