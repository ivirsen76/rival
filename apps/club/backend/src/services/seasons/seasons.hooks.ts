// @ts-nocheck
import type { HookContext } from '@feathersjs/feathers';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { NotFound, Unprocessable } from '@feathersjs/errors';
import hydrate from 'feathers-sequelize/hooks/hydrate';
import _isEmpty from 'lodash/isEmpty';
import { hasAnyRole, purgeSeasonCache } from '../commonHooks';
import { unless, isProvider } from 'feathers-hooks-common';
import commonValidate from './commonValidate';
import dayjs from '../../utils/dayjs';
import { getAge } from '../../utils/helpers';
import { getSeasonName, getSeasonTournaments } from './helpers';
import { getSchemaErrors, throwValidationErrors } from '../../helpers';
import yup from '../../packages/yup';
import { getStatsMatches } from '../../utils/sqlConditions';
import { POOL_PARTNER_ID } from '../../constants';
import { getEmailsFromList } from '../settings/helpers';
import getCustomEmail from '../../emailTemplates/getCustomEmail';

const validateCreate = () => async (context: HookContext) => {
    const errors = commonValidate(context.data);

    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    const sequelize = context.app.get('sequelizeClient');
    const [seasons] = await sequelize.query(
        `SELECT *
           FROM seasons
       ORDER BY startDate DESC
          LIMIT 0, 1`
    );
    if (seasons.length === 1 && dayjs.tz(seasons[0].endDate).isSameOrAfter(dayjs.tz(context.data.startDate))) {
        throwValidationErrors({ startDate: 'The season should start after all other seasons.' });
    }

    if (dayjs.tz(context.data.startDate).isBefore(dayjs.tz())) {
        throwValidationErrors({ startDate: 'Start date should be in the future.' });
    }

    const [duplicates] = await sequelize.query(
        `SELECT id
           FROM seasons
          WHERE year=:year AND season=:season`,
        { replacements: { year: context.data.year, season: context.data.season } }
    );
    if (duplicates.length > 0) {
        throwValidationErrors({ season: 'There is the season with the same name.' });
    }

    return context;
};

const populateDates = () => async (context: HookContext) => {
    const { data } = context;

    data.startDate = dayjs.tz(data.startDate).hour(0).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss+00:00');
    data.endDate = dayjs.tz(data.startDate).add(data.weeks, 'week').format('YYYY-MM-DD HH:mm:ss+00:00');

    return context;
};

const populateIsFree = () => async (context: HookContext) => {
    const { data } = context;
    const sequelize = context.app.get('sequelizeClient');

    const [[lastSeason]] = await sequelize.query('SELECT * FROM seasons ORDER BY endDate DESC LIMIT 0, 1');
    data.isFree = lastSeason ? lastSeason.isFree : true;

    return context;
};

const validatePatch = () => async (context: HookContext) => {
    const seasonId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { seasons } = sequelize.models;
    const season = await seasons.findByPk(seasonId);

    if (!season) {
        throw new Unprocessable('The season does not exist.');
    }

    const currentTz = dayjs.tz();
    if (dayjs.tz(season.endDate).isBefore(currentTz)) {
        throw new Unprocessable('You cannot change finished season.');
    }

    const errors = commonValidate(context.data);
    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    const [playingLevels] = await sequelize.query(
        `SELECT DISTINCT l.id, l.name
           FROM players AS p,
                tournaments AS t,
                levels AS l
          WHERE p.tournamentId=t.id AND
                t.seasonId=:seasonId AND
                t.levelId=l.id`,
        { replacements: { seasonId } }
    );
    const deletedLevels = playingLevels.filter((level) => !context.data.levels.includes(level.id));
    if (deletedLevels.length > 0) {
        throwValidationErrors({
            levels: `You cannot delete these levels as players are already playing: ${deletedLevels
                .map((level) => level.name)
                .join(', ')}`,
        });
    }

    context.data.startDate = dayjs.tz(context.data.startDate).format('YYYY-MM-DD HH:mm:ss');
    context.data.endDate = dayjs
        .tz(context.data.startDate)
        .add(context.data.weeks, 'week')
        .format('YYYY-MM-DD HH:mm:ss');

    // current season
    if (dayjs.tz(season.startDate).isBefore(currentTz)) {
        if (season.year !== context.data.year) {
            throwValidationErrors({ year: 'You cannot change year.' });
        }

        if (season.season !== context.data.season) {
            throwValidationErrors({ season: 'You cannot change season.' });
        }

        if (season.startDate !== context.data.startDate.slice(0, 19)) {
            throwValidationErrors({ startDate: 'You cannot change start date for already started season.' });
        }

        if (dayjs.tz(context.data.endDate).isBefore(currentTz)) {
            throwValidationErrors({ weeks: 'End season date should be in the future.' });
        }

        const [nextSeasons] = await sequelize.query(
            `SELECT *
               FROM seasons
              WHERE id!=:id AND
                    startDate<=:endDate AND
                    endDate>=:endDate`,
            { replacements: { id: seasonId, endDate: context.data.endDate } }
        );
        if (nextSeasons.length > 0) {
            throwValidationErrors({ weeks: 'The season dates are overlapping with upcoming seasons.' });
        }
    } else {
        // future season
        if (dayjs.tz(context.data.startDate).isBefore(currentTz)) {
            throwValidationErrors({ startDate: 'Start date should be in the future.' });
        }

        const [lastSeasons] = await sequelize.query(
            `SELECT *
               FROM seasons
              WHERE id!=:id
           ORDER BY startDate DESC
              LIMIT 0, 1`,
            { replacements: { id: seasonId } }
        );
        if (lastSeasons.length === 1 && lastSeasons[0].endDate >= context.data.startDate) {
            throwValidationErrors({ startDate: 'The season should start after all other seasons.' });
        }

        const [duplicates] = await sequelize.query(
            `SELECT id
               FROM seasons
              WHERE year=:year AND season=:season AND id!=:id`,
            { replacements: { id: seasonId, year: context.data.year, season: context.data.season } }
        );
        if (duplicates.length > 0) {
            throwValidationErrors({ season: 'There is the season with the same name.' });
        }
    }

    await purgeSeasonCache({ seasonId })(context);

    return context;
};

const getLevels = () => (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const { levels } = sequelize.models;
    context.params.sequelize = {
        include: [{ model: levels, attributes: ['id', 'name', 'slug'] }],
        order: [
            ['startDate', 'DESC'],
            [levels, 'position', 'ASC'],
        ],
        raw: false,
    };
    return context;
};

const getCurrentSeason = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const currentDate = dayjs.tz();
    const nowTz = currentDate.format('YYYY-MM-DD HH:mm:ss');

    // get latest tournament
    let latestTournament;
    await (async () => {
        const [seasons] = await sequelize.query(
            `SELECT *
               FROM seasons
              WHERE startDate<"${nowTz}"
           ORDER BY startDate DESC
              LIMIT 0, 1`
        );
        if (seasons.length !== 1) {
            return;
        }

        const season = seasons[0];
        season.name = getSeasonName(season);
        season.usersCanRegister = true;
        const endDate = dayjs.tz(season.endDate);
        if (currentDate.isAfter(endDate)) {
            season.isFinished = true;
        }
        if (season.isFinished) {
            season.usersCanRegister = false;
        }

        const [levels] = await sequelize.query(
            `SELECT t.id AS tournamentId,
                    l.id AS levelId,
                    l.slug AS levelSlug,
                    l.name AS levelName,
                    l.type AS levelType,
                    COUNT(DISTINCT p.id) AS totalPlayers,
                    COUNT(m.id) AS totalMatches
               FROM tournaments AS t
               JOIN levels AS l ON l.id=t.levelId
          LEFT JOIN players AS p ON p.tournamentId=t.id
          LEFT JOIN matches AS m ON m.challengerId=p.id AND m.score IS NOT NULL AND m.unavailable=0
              WHERE t.seasonId=${season.id}
           GROUP BY t.id, t.levelId
           ORDER BY l.position`
        );

        const [result] = await sequelize.query(
            `SELECT m.id,
               m.challengerId,
               m.acceptorId,
               m.winner,
               pc.levelId,
               pc.userId AS challengerUserId,
               pc.firstName AS challengerFirstName,
               pc.lastName AS challengerLastName,
               pc.avatar AS challengerAvatar,
               pa.userId AS acceptorUserId,
               pa.firstName AS acceptorFirstName,
               pa.lastName AS acceptorLastName,
               pa.avatar AS acceptorAvatar
          FROM matches AS m
          JOIN (SELECT p.id, p.userId, p.tournamentId, u.firstName, u.lastName, u.avatar, t.levelId
                  FROM players AS p
                  JOIN tournaments AS t ON p.tournamentId=t.id AND t.seasonId=${season.id}
                  JOIN users AS u ON p.userId=u.id
               ) AS pc
            ON m.challengerId=pc.id
          JOIN (SELECT p.id, p.userId, p.tournamentId, u.firstName, u.lastName, u.avatar
                  FROM players AS p
                  JOIN tournaments AS t ON p.tournamentId=t.id AND t.seasonId=${season.id}
                  JOIN users AS u ON p.userId=u.id
               ) AS pa
            ON m.acceptorId=pa.id
         WHERE m.score IS NOT NULL AND m.type="final" AND m.finalSpot=1`
        );

        const winners = result.reduce((obj, row) => {
            obj[row.levelId] = row;
            return obj;
        }, {});

        levels.forEach((level) => {
            const winnerInfo = winners[level.levelId];
            if (!winnerInfo) {
                return;
            }
            const challenger = {
                firstName: winnerInfo.challengerFirstName,
                lastName: winnerInfo.challengerLastName,
                userId: winnerInfo.challengerUserId,
                avatar: winnerInfo.challengerAvatar,
            };
            const acceptor = {
                firstName: winnerInfo.acceptorFirstName,
                lastName: winnerInfo.acceptorLastName,
                userId: winnerInfo.acceptorUserId,
                avatar: winnerInfo.acceptorAvatar,
            };

            level.winner = winnerInfo.winner === winnerInfo.challengerId ? challenger : acceptor;
            level.runnerUp = winnerInfo.winner === winnerInfo.challengerId ? acceptor : challenger;
        });

        latestTournament = {
            season,
            levels,
        };
    })();

    let nextTournament;
    if (!latestTournament || latestTournament.season.isFinished) {
        const [seasons] = await sequelize.query(
            `SELECT *
               FROM seasons
              WHERE startDate>"${nowTz}"
           ORDER BY startDate ASC
              LIMIT 0, 1`
        );
        if (seasons.length === 1) {
            nextTournament = {
                season: seasons[0],
            };

            nextTournament.season.name = getSeasonName(nextTournament.season);
            nextTournament.season.usersCanRegister = true;

            const [levels] = await sequelize.query(
                `SELECT t.id AS tournamentId,
                        l.id AS levelId,
                        l.slug AS levelSlug,
                        l.name AS levelName,
                        l.type AS levelType,
                        COUNT(DISTINCT p.id) AS totalPlayers
                   FROM tournaments AS t
                   JOIN levels AS l ON l.id=t.levelId
              LEFT JOIN players AS p ON p.tournamentId=t.id
                  WHERE t.seasonId=${nextTournament.season.id}
               GROUP BY t.id, t.levelId
               ORDER BY l.position`
            );
            nextTournament.levels = levels;
        }
    }

    context.result = {
        data: {
            latestTournament,
            nextTournament,
        },
    };

    return context;
};

const getSeasonsToRegister = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const { config } = context.params;
    const currentDate = dayjs.tz();
    const currentDateStr = currentDate.format('YYYY-MM-DD HH:mm:ss');

    const seasons = [];

    const [[currentSeason]] = await sequelize.query('SELECT * FROM seasons WHERE startDate<:date AND endDate>:date', {
        replacements: { date: currentDateStr },
    });

    let checkNextSeason = true;
    if (currentSeason) {
        const endDate = dayjs.tz(currentSeason.endDate);
        const timeToTheEnd = endDate.diff(currentDate, 'week', true);

        seasons.push(currentSeason);

        if (timeToTheEnd > config.registrationAheadWeeks) {
            checkNextSeason = false;
        }
    }

    if (checkNextSeason) {
        // check next season
        const [[nextSeason]] = await sequelize.query(
            'SELECT * FROM seasons WHERE startDate>:date ORDER BY startDate LIMIT 0, 1',
            { replacements: { date: currentDateStr } }
        );

        if (nextSeason) {
            seasons.push(nextSeason);
        }
    }

    for (const season of seasons) {
        season.name = getSeasonName(season);
        season.tournaments = await getSeasonTournaments({ seasonId: season.id, sequelize, config });

        for (const tournament of season.tournaments) {
            if (tournament.levelType !== 'doubles-team') {
                continue;
            }

            const [poolPlayers] = await sequelize.query(
                `
                SELECT u.firstName,
                       u.lastName,
                       u.slug,
                       p.id,
                       p.userId,
                       p.partnerInfo
                  FROM users AS u,
                       players AS p
                 WHERE u.id=p.userId AND
                       p.tournamentId=:tournamentId AND
                       p.isActive=1 AND
                       p.partnerId=:poolPartnerId
              ORDER BY u.firstName, u.lastName`,
                { replacements: { tournamentId: tournament.tournamentId, poolPartnerId: POOL_PARTNER_ID } }
            );

            tournament.poolPlayers = poolPlayers;
        }
    }

    context.result = { data: seasons };

    return context;
};

const populateLevelsBasedOnPrevSeason = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const { tournaments } = sequelize.models;

    const levels = context.data.levels;
    const season = context.result;

    const [[prevSeason]] = await sequelize.query(`SELECT * FROM seasons WHERE endDate<:date ORDER BY endDate DESC`, {
        replacements: { date: season.startDate },
    });
    if (!prevSeason) {
        // just add levels with default values
        season.setLevels(levels);
    } else {
        // add levels and preserve isFree status
        const [rows] = await sequelize.query(`SELECT * FROM tournaments WHERE seasonId=:seasonId`, {
            replacements: { seasonId: prevSeason.id },
        });
        const freeState = rows.reduce((obj, item) => {
            obj[item.levelId] = item.isFree;
            return obj;
        }, {});

        for (const id of levels) {
            await tournaments.create({
                seasonId: season.id,
                levelId: id,
                isFree: id in freeState ? freeState[id] : 0,
            });
        }
    }

    return context;
};

const sendNewSeasonNotification = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const { config } = context.params;
    const season = context.result;

    // send notification just once for all cities
    if (config.url !== 'cary') {
        return context;
    }

    const [[settings]] = await sequelize.query(`SELECT signUpNotification FROM settings WHERE id=1`);
    const emails = getEmailsFromList(settings.signUpNotification).map((item) => ({ email: item }));
    const seasonName = getSeasonName(season);

    await context.app.service('api/emails').create({
        to: emails,
        subject: `${seasonName} season has been generated`,
        html: getCustomEmail({
            config,
            compose: () => `<mj-text>${seasonName} has been generated. You can adjust ladders now.</mj-text>`,
        }),
    });

    return context;
};

const updateLevels = () => async (context: HookContext) => {
    const levels = context.data.levels;
    const season = context.result;
    season.setLevels(levels);

    return context;
};

const getLevelsInfo = () => async (context: HookContext) => {
    const seasonId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');

    const [rows] = await sequelize.query(
        `
        SELECT l.id, l.name, count(*) AS count
          FROM players AS p,
               tournaments AS t,
               levels AS l
         WHERE p.tournamentId=t.id AND
               t.levelId=l.id AND
               t.seasonId=:seasonId
      GROUP BY l.id`,
        { replacements: { seasonId } }
    );
    context.result = {
        data: rows.reduce((obj, row) => {
            obj[row.id] = row;
            return obj;
        }, {}),
    };

    return context;
};

const getPlayersFromLastSeasons = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['admin', 'manager'])(context);

    const sequelize = context.app.get('sequelizeClient');

    const currentDate = dayjs.tz().format('YYYY-MM-DD HH:mm:ss');
    const [seasons] = await sequelize.query(
        `
        SELECT id
          FROM seasons
         WHERE startDate<=:currentDate
      ORDER BY startDate DESC
       LIMIT 0, 1`,
        { replacements: { currentDate } }
    );

    if (seasons.length === 0) {
        context.result = { data: [] };
        return context;
    }

    const [rows] = await sequelize.query(
        `
        SELECT u.id,
               u.email,
               s.year AS seasonYear,
               s.season AS seasonSeason,
               s.id AS seasonId,
               s.startDate AS seasonStartDate,
               l.id AS levelId,
               l.name AS levelName,
               l.position AS levelPosition
          FROM users AS u,
               players AS p,
               tournaments AS t,
               seasons AS s,
               levels AS l
         WHERE u.id=p.userId AND
               p.tournamentId=t.id AND
               t.seasonId=s.id AND
               t.levelId=l.id AND
               s.id IN (:seasonList)
      ORDER BY s.startDate DESC`,
        { replacements: { seasonList: seasons.map((season) => season.id) } }
    );

    const data = rows.reduce((obj, row) => {
        const { seasonId, levelId } = row;
        obj[seasonId] ||= {
            id: seasonId,
            name: `${row.seasonYear} ${row.seasonSeason}`,
            startDate: row.seasonStartDate,
            levels: {},
        };
        obj[seasonId].levels[levelId] ||= {
            id: levelId,
            name: row.levelName,
            position: row.levelPosition,
            emails: new Set(),
        };
        obj[seasonId].levels[levelId].emails.add(row.email);

        return obj;
    }, {});

    // Get players from the final tournament
    for (const season of seasons) {
        const [result] = await sequelize.query(
            `SELECT pc.email AS challengerEmail,
                    pa.email AS acceptorEmail,
                    l.id AS levelId,
                    l.name AS levelName,
                    l.position AS levelPosition
               FROM matches AS m
               JOIN players AS p ON m.challengerId=p.id OR m.acceptorId=p.id
               JOIN tournaments AS t ON p.tournamentId=t.id AND t.seasonId=${season.id}
               JOIN levels AS l ON t.levelId=l.id
          LEFT JOIN (SELECT p.id, u.email
                       FROM players AS p
                       JOIN tournaments AS t ON p.tournamentId=t.id AND t.seasonId=${season.id}
                       JOIN users AS u ON p.userId=u.id
                    ) AS pc
                 ON m.challengerId=pc.id
          LEFT JOIN (SELECT p.id, u.email
                       FROM players AS p
                       JOIN tournaments AS t ON p.tournamentId=t.id AND t.seasonId=${season.id}
                       JOIN users AS u ON p.userId=u.id
                    ) AS pa
                 ON m.acceptorId=pa.id
              WHERE m.type="final"`
        );
        for (const row of result) {
            const key = 1000 + row.levelId;
            data[season.id].levels[key] ||= {
                id: key,
                name: `${row.levelName} tournament`,
                position: 1000 + row.levelPosition,
                emails: [],
            };
            const emails = data[season.id].levels[key].emails;

            [row.challengerEmail, row.acceptorEmail].filter(Boolean).forEach((email) => {
                if (!emails.includes(email)) {
                    emails.push(email);
                }
            });
        }
    }

    const seasonEmails = Object.values(data)
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
        .map((season) => ({
            ...season,
            levels: Object.values(season.levels)
                .sort((a, b) => a.position - b.position)
                .map((level) => ({
                    ...level,
                    emails: [...level.emails],
                })),
        }));

    const [allUsers] = await sequelize.query(
        `SELECT email FROM users WHERE roles="player" AND subscribeForNews=1 AND loggedAt>"2022-01-01"`
    );

    context.result = { seasons: seasonEmails, all: allUsers.map((item) => item.email) };

    return context;
};

const closeSeason = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['admin', 'manager'])(context);

    // Validate
    {
        const schema = yup.object().shape({
            reason: yup.string().required('Reason is required').max(200),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const seasonId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const currentDate = dayjs.tz();

    // Check current season
    {
        const [rows] = await sequelize.query(
            `
            SELECT *
              FROM seasons
             WHERE id=:seasonId`,
            { replacements: { seasonId } }
        );

        if (rows.length !== 1) {
            throw new Unprocessable('The season does not exist.');
        }
        const season = rows[0];
        if (!currentDate.isBetween(dayjs.tz(season.startDate), dayjs.tz(season.endDate))) {
            throw new Unprocessable('The season is not in progress.');
        }
    }

    await sequelize.query(
        `
        UPDATE seasons
           SET hasFinalTournament=0, closeReason=:reason, endDate=:date
         WHERE id=:seasonId`,
        {
            replacements: {
                reason: context.data.reason,
                // Subtract 1 minute just for front-end to see updates
                date: currentDate.subtract(1, 'minute').format('YYYY-MM-DD HH:mm:ss'),
                seasonId,
            },
        }
    );

    await purgeSeasonCache({ seasonId })(context);

    return context;
};

const getSeasonStats = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['admin', 'manager'])(context);

    const sequelize = context.app.get('sequelizeClient');

    const [seasonStats] = await sequelize.query(
        `SELECT s.id,
                s.year,
                s.season,
                s.startDate,
                COUNT(DISTINCT p.id) AS players,
                COUNT(m.id) AS matches
           FROM tournaments AS t
           JOIN seasons AS s ON s.id=t.seasonId
      LEFT JOIN players AS p ON p.tournamentId=t.id
      LEFT JOIN matches AS m ON m.challengerId=p.id AND ${getStatsMatches('m')}
       GROUP BY s.id
       ORDER BY s.startDate`
    );

    const seasonObject = seasonStats.reduce((obj, season) => {
        obj[season.year] = obj[season.year] || {
            year: season.year.toString(),
            springPlayers: null,
            summerPlayers: null,
            fallPlayers: null,
            winterPlayers: null,
            springMatches: null,
            summerMatches: null,
            fallMatches: null,
            winterMatches: null,
        };

        obj[season.year][`${season.season}Players`] = season.players;
        obj[season.year][`${season.season}Matches`] = season.matches;

        return obj;
    }, {});

    const [yearStats] = await sequelize.query(
        `SELECT s.year AS name,
                COUNT(DISTINCT p.id) AS players,
                COUNT(m.id) AS matches
           FROM tournaments AS t
           JOIN seasons AS s ON s.id=t.seasonId
      LEFT JOIN players AS p ON p.tournamentId=t.id
      LEFT JOIN matches AS m ON m.challengerId=p.id AND ${getStatsMatches('m')}
       GROUP BY s.year
       ORDER BY s.year`
    );
    yearStats.forEach((year) => {
        year.name = `${year.name}`;
    });

    const lastSeason = seasonStats[seasonStats.length - 1];
    const daysPast = Math.floor(dayjs.tz().diff(dayjs.tz(lastSeason.startDate), 'day', true));

    // get prediction for the end of the season
    const DAYS_TO_SHOW_PREDICTION = 5 * 7;
    if (daysPast >= -20 && daysPast < DAYS_TO_SHOW_PREDICTION) {
        const dateOneYearAgo = dayjs.tz().subtract(14, 'month').format('YYYY-MM-DD HH:mm:ss');
        const [players] = await sequelize.query(`
                SELECT p.id,
                       p.createdAt,
                       s.id AS seasonId,
                       s.startDate AS seasonStartDate,
                       s.year AS seasonYear,
                       s.season AS seasonSeason
                  FROM players AS p,
                       tournaments AS t,
                       seasons AS s
                 WHERE p.tournamentId=t.id AND
                       t.seasonId=s.id AND
                       s.id!=${lastSeason.id} AND
                       s.startDate>"${dateOneYearAgo}"`);

        const seasons = {};
        for (const player of players) {
            if (!seasons[player.seasonId]) {
                seasons[player.seasonId] = {
                    name: `${player.seasonYear} ${player.seasonSeason}`,
                    targetDate: dayjs.tz(player.seasonStartDate).add(daysPast, 'day').format('YYYY-MM-DD HH:mm:ss'),
                    targetTotal: 0,
                    total: 0,
                    percent: 0,
                };
            }

            const season = seasons[player.seasonId];
            season.targetTotal += player.createdAt < season.targetDate ? 1 : 0;
            season.total++;
            season.percent = season.targetTotal / season.total;
        }

        const seasonsArray = Object.values(seasons);
        const averagePercent = seasonsArray.reduce((sum, item) => sum + item.percent, 0) / seasonsArray.length;

        const targetDate = dayjs.tz(lastSeason.startDate).add(daysPast, 'day').format('YYYY-MM-DD HH:mm:ss');
        const [[currentSeasonStats]] = await sequelize.query(
            `SELECT COUNT(DISTINCT p.id) AS players
               FROM players AS p,
                    tournaments AS t
              WHERE p.tournamentId=t.id AND
                    t.seasonId=${lastSeason.id} AND
                    p.createdAt<"${targetDate}"`
        );

        seasonObject[lastSeason.year].predictedPlayers = Math.floor(currentSeasonStats.players / averagePercent);
    }

    const getAgeDistribution = (arr) => {
        const ranges = [
            { label: '< 30', value: 0, limit: 30 },
            { label: '30-39', value: 0, limit: 40 },
            { label: '40-49', value: 0, limit: 50 },
            { label: '50-59', value: 0, limit: 60 },
            { label: '60+', value: 0, limit: 1000 },
        ];
        let rangeIndex = 0;
        let currentRange = ranges[rangeIndex];
        for (const user of arr) {
            const age = Math.floor(getAge(user.birthday));
            while (currentRange && currentRange.limit <= age) {
                currentRange = ranges[++rangeIndex];
            }

            if (currentRange) {
                currentRange.value++;
            }
        }

        return ranges.map((item) => ({
            label: item.label,
            value: item.value,
            percent: Math.round((item.value * 100) / arr.length),
        }));
    };

    const getMedianAge = (arr) => {
        const medianIndex = Math.floor(arr.length / 2);
        return arr[medianIndex] ? Math.floor(getAge(arr[medianIndex].birthday)) : 0;
    };

    const dateSixMonthAgo = dayjs.tz().subtract(6, 'month').format('YYYY-MM-DD HH:mm:ss');
    const [users] = await sequelize.query(
        `SELECT u.birthday,
                u.gender
           FROM users AS u
          WHERE u.birthday IS NOT NULL AND
                u.roles="player" AND
                EXISTS (SELECT id FROM players AS p WHERE p.userId=u.id AND p.createdAt>"${dateSixMonthAgo}")                
       ORDER BY u.birthday DESC`
    );

    const allAgeDistribution = getAgeDistribution(users);
    const allMedianAge = getMedianAge(users);

    const males = users.filter((item) => item.gender === 'male');
    const malesAgeDistribution = getAgeDistribution(males);
    const malesMedianAge = getMedianAge(males);

    const females = users.filter((item) => item.gender === 'female');
    const femalesAgeDistribution = getAgeDistribution(females);
    const femalesMedianAge = getMedianAge(females);

    context.result = {
        data: {
            seasonStats: Object.values(seasonObject).sort((a, b) => a.year - b.year),
            yearStats,
            allAgeDistribution,
            malesAgeDistribution,
            femalesAgeDistribution,
            allMedianAge,
            malesMedianAge,
            femalesMedianAge,
        },
    };

    return context;
};

const runCustomAction = () => async (context: HookContext) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'getLevelsInfo') {
        await getLevelsInfo()(context);
    } else if (action === 'getPlayersFromLastSeasons') {
        await getPlayersFromLastSeasons()(context);
    } else if (action === 'closeSeason') {
        await closeSeason()(context);
    } else if (action === 'getSeasonStats') {
        await getSeasonStats()(context);
    } else if (action === 'getSeasonsToRegister') {
        await getSeasonsToRegister()(context);
    } else {
        throw new NotFound();
    }

    if (!context.result) {
        context.result = { status: 'success' };
    }
};

const restrictToManager = () => unless(isProvider('server'), authenticate('jwt'), hasAnyRole(['admin', 'manager']));

export default {
    before: {
        all: [],
        find: [getLevels()],
        get: [getCurrentSeason()],
        create: [restrictToManager(), validateCreate(), populateDates(), populateIsFree()],
        update: [runCustomAction()],
        patch: [restrictToManager(), validatePatch(), populateDates()],
        remove: [restrictToManager()],
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [hydrate(), populateLevelsBasedOnPrevSeason(), sendNewSeasonNotification()],
        update: [],
        patch: [hydrate(), updateLevels()],
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
