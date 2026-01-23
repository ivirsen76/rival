import type { HookContext } from '@feathersjs/feathers';
import ical from 'ical-generator';
import { disallow } from 'feathers-hooks-common';
import { Unprocessable } from '@feathersjs/errors';
import dayjs from '../../utils/dayjs';
import md5 from 'md5';

const getCalendar = () => async (context: HookContext) => {
    const referralCode = context.id;

    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;
    const { config } = context.params;

    const foundUser = await users.findOne({ where: { referralCode } });
    if (!foundUser) {
        throw new Unprocessable('The calendar is not found');
    }

    const currentDate = dayjs.tz().format('YYYY-MM-DD HH:mm:ss');

    let currentSeason;
    {
        const [result] = await sequelize.query(
            `
                SELECT id, startDate
                  FROM seasons
                 WHERE startDate<:currentDate
              ORDER BY startDate DESC
                 LIMIT 1
            `,
            { replacements: { currentDate } }
        );
        currentSeason = result[0];
    }
    if (!currentSeason) {
        throw new Unprocessable('There is no season yet');
    }

    const startDate = dayjs.tz(currentSeason.startDate).format('YYYY-MM-DD HH:mm:ss');
    const userId = foundUser.id;
    const [matches] = await sequelize.query(
        `
        SELECT m.id,
               m.playedAt,
               m.acceptedAt,
               m.place,
               m.comment,
               m.practiceType,
               m.same,
               uc.id AS challengerId,
               uc.firstName AS challengerFirstName,
               uc.lastName AS challengerLastName,
               ua.id AS acceptorId,
               ua.firstName AS acceptorFirstName,
               ua.lastName AS acceptorLastName,
               uc2.id AS challenger2Id,
               uc2.firstName AS challenger2FirstName,
               uc2.lastName AS challenger2LastName,
               ua2.id AS acceptor2Id,
               ua2.firstName AS acceptor2FirstName,
               ua2.lastName AS acceptor2LastName
          FROM matches AS m
          JOIN players AS pc ON m.challengerId=pc.id
          JOIN users AS uc ON pc.userId=uc.id
     LEFT JOIN players AS pa ON m.acceptorId=pa.id
     LEFT JOIN users AS ua ON pa.userId=ua.id
     LEFT JOIN players AS pc2 ON m.challenger2Id=pc2.id
     LEFT JOIN users AS uc2 ON pc2.userId=uc2.id
     LEFT JOIN players AS pa2 ON m.acceptor2Id=pa2.id
     LEFT JOIN users AS ua2 ON pa2.userId=ua2.id
         WHERE m.isActive=1 AND
               m.playedAt IS NOT NULL AND
               m.playedAt>:startDate AND
               m.sameAs IS NULL AND
               (m.playedAt>:currentDate OR m.score IS NOT NULL) AND
               (pc.userId=:userId OR pa.userId=:userId OR pc2.userId=:userId OR pa2.userId=:userId)`,
        { replacements: { userId, startDate, currentDate } }
    );

    const removeDuplicates = (match) => {
        if (match.acceptedAt || match.same === '') {
            return true;
        }

        return match.same.startsWith(`${match.id},`);
    };

    const getEventFromMatch = (match) => {
        const start = dayjs.tz(match.playedAt);
        const players = [
            { id: match.challengerId, name: `${match.challengerFirstName} ${match.challengerLastName}` },
            { id: match.acceptorId, name: `${match.acceptorFirstName} ${match.acceptorLastName}` },
            { id: match.challenger2Id, name: `${match.challenger2FirstName} ${match.challenger2LastName}` },
            { id: match.acceptor2Id, name: `${match.acceptor2FirstName} ${match.acceptor2LastName}` },
        ];

        const summary = (() => {
            // TODO: show doubles team name instead of individual players for Doubles match

            const opponents = players
                .filter((player) => player.id && player.id !== userId)
                .map((player) => player.name)
                .join(', ');

            const entity = match.practiceType ? 'Practice' : 'Match';

            if (!match.acceptedAt) {
                return opponents ? `${entity} proposal vs ${opponents}` : `${entity} proposal`;
            }

            return `${entity} vs ${opponents}`;
        })();

        return {
            id: md5(`${config.city}-${match.id}-${userId}`).slice(0, 20),
            start,
            end: start.add(2, 'hour'),
            summary,
            ...(match.place ? { location: match.place } : {}),
            ...(match.comment ? { description: match.comment } : {}),
        };
    };

    const cal = ical({
        prodId: `//${process.env.TL_URL}//ical-generator//EN`,
        events: matches.filter(removeDuplicates).map(getEventFromMatch),
    });

    context.result = cal.toString();

    return context;
};

export default {
    before: {
        all: [],
        find: [disallow()],
        get: [getCalendar()],
        create: [disallow()],
        update: [disallow()],
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
