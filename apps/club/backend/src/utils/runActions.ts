// @ts-nocheck TODO
import type { Sequelize } from 'sequelize';
import type { Application } from '@feathersjs/feathers';
import dayjs from './dayjs';
import logger from '@rival-tennis-ladder/logger';
import _uniqBy from 'lodash/uniqBy';
import { getSeasonName } from '../services/seasons/helpers';
import { getJoinDoublesLink } from '../services/players/helpers';
import tournamentReminderTemplate from '../emailTemplates/tournamentReminder';
import lastDayTournamentReminderTemplate from '../emailTemplates/lastDayTournamentReminder';
import firstDayReminderTemplate from '../emailTemplates/firstDayReminder';
import activityReminderTemplate from '../emailTemplates/activityReminder';
import noLadderChosenTemplate from '../emailTemplates/noLadderChosen';
import seasonIsOverTemplate from '../emailTemplates/seasonIsOver';
import joinNextSeasonTemplate from '../emailTemplates/joinNextSeason';
import claimRewardTemplate from '../emailTemplates/claimReward';
import finalMatchScheduleTemplate from '../emailTemplates/finalMatchSchedule';
import feedbackRequestTemplate from '../emailTemplates/feedbackRequest';
import percentReferralTemplate from '../emailTemplates/percentReferral';
import getCustomEmail from '../emailTemplates/getCustomEmail';
import compareFields from './compareFields';
import renderImage from './renderImage';
import { projectedTlrMultipliers } from '../config';
import invokeLambda from './invokeLambda';
import { getStatsMatches } from './sqlConditions';
import getCombinedConfig from './getCombinedConfig';
import { getEstablishedEloAllUsers, getEmailContact } from '../services/users/helpers';
import { getSeasonTournaments } from '../services/seasons/helpers';
import getSeasonSvg from './getSeasonSvg';
import md5 from 'md5';

const getSeasonLevels = async (sequelize: Sequelize, seasonId: number) => {
    const [levels] = await sequelize.query(
        `
        SELECT l.id, l.slug, l.name, l.type, l.baseTlr, l.minTlr, l.maxTlr
          FROM tournaments AS t, levels AS l
         WHERE t.levelId=l.id AND t.seasonId=:seasonId
      ORDER BY l.position`,
        { replacements: { seasonId } }
    );

    return levels;
};
const isActionDone = async (sequelize: Sequelize, name: string, tableId: number) => {
    const [actions] = await sequelize.query(`SELECT * FROM actions WHERE tableId=:tableId AND name=:name`, {
        replacements: { tableId, name },
    });

    return actions.length > 0;
};
const getSeasonUsers = async (sequelize: Sequelize, seasonId: number) => {
    const [nextSeasonUserIds] = await sequelize.query(
        `
        SELECT p.userId
          FROM players AS p, tournaments AS t
         WHERE p.tournamentId=t.id AND t.seasonId=:seasonId`,
        { replacements: { seasonId } }
    );
    return new Set(nextSeasonUserIds.map((item) => item.userId));
};
const getSeasonRegistrations = async (sequelize: Sequelize, seasonId: number) => {
    const [[row]] = await sequelize.query(
        `
        SELECT count(*) AS cnt
          FROM players AS p, tournaments AS t
         WHERE p.tournamentId=t.id AND t.seasonId=:seasonId`,
        { replacements: { seasonId } }
    );
    return row.cnt;
};
const getCurrentSeasons = async (sequelize: Sequelize) => {
    const dateMonthAgo = dayjs.tz().subtract(1, 'month');
    const [seasons] = await sequelize.query(
        `SELECT *
           FROM seasons
          WHERE endDate>:dateMonthAgo
       ORDER BY endDate`,
        { replacements: { dateMonthAgo: dateMonthAgo.format('YYYY-MM-DD HH:mm:ss') } }
    );

    return [seasons[0], seasons[1]];
};
const getImagesFromSvg = async (svgs) => {
    if (process.env.NODE_ENV === 'test') {
        return Object.keys(svgs).reduce((obj, key) => {
            obj[key] =
                'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/images/45087d640879140d68b00207371d05ad028a805dcff3411897fd8394ad28d74f.png';
            return obj;
        }, {});
    }

    const result = {};
    const hashes = {};

    for (const [key, svg] of Object.entries(svgs)) {
        const hash = md5(svg);
        result[key] = hash;

        if (!hashes[hash]) {
            hashes[hash] = svg;
        }
    }

    function getObjectChunkes(obj, size) {
        const entries = Object.entries(obj);
        const chunks = [];

        for (let i = 0; i < entries.length; i += size) {
            chunks.push(Object.fromEntries(entries.slice(i, i + size)));
        }

        return chunks;
    }

    const imageChunks = await Promise.all(
        getObjectChunkes(hashes, 50).map(async (chunk) => {
            const response = await invokeLambda('svgToPng:1', {
                bucket: process.env.AWS_S3_BUCKET,
                payload: chunk,
            });
            return response.data;
        })
    );
    const images = Object.assign({}, ...imageChunks);

    for (const [key, hash] of Object.entries(result)) {
        result[key] = images[hash];
    }

    return result;
};

export const remindForTournament = async (app: Application) => {
    const sequelize = app.get('sequelizeClient');

    const config = await getCombinedConfig();
    const { tournamentReminderWeeks } = config;

    // Check if we close to the tournament
    const currentDate = dayjs.tz();
    const [[currentSeason]] = await sequelize.query(`SELECT * FROM seasons WHERE startDate<:date AND endDate>:date`, {
        replacements: { date: currentDate.format('YYYY-MM-DD HH:mm:ss') },
    });
    if (!currentSeason) {
        return;
    }
    const diff = dayjs.tz(currentSeason.endDate).diff(currentDate, 'week', true);
    if (diff > tournamentReminderWeeks || diff < tournamentReminderWeeks - 1) {
        return;
    }

    // Check if already sent the reminder
    const ACTION_NAME = 'sendTournamentReminder';
    if (await isActionDone(sequelize, ACTION_NAME, currentSeason.id)) {
        return;
    }

    // Get all levels
    const levels = await getSeasonLevels(sequelize, currentSeason.id);

    let count = 0;
    for (const level of levels) {
        // Get tournament info
        const tournamentInfo = await app
            .service('api/tournaments')
            .get(1, { query: { year: currentSeason.year, season: currentSeason.season, level: level.slug } });

        // Check if tournament is canceled
        if (tournamentInfo.data.cancelFinalTournament) {
            continue;
        }

        const isDoublesTeam = tournamentInfo.data.levelType === 'doubles-team';

        let getSuitableUsers = () => true;
        if (isDoublesTeam) {
            const captainIds = new Set(
                Object.values(tournamentInfo.data.players)
                    .filter((item) => item.isDoublesTeamCaptain && item.partnerIds.length > 1)
                    .map((item) => item.userId)
            );
            getSuitableUsers = (user) => captainIds.has(user.id);
        }

        // Get all users
        const [users] = await sequelize.query(
            `
            SELECT u.id, u.firstName, u.lastName, u.email
              FROM users AS u,
                   players AS p,
                   tournaments AS t
             WHERE u.id=p.userId AND
                   u.subscribeForReminders=1 AND
                   p.tournamentId=t.id AND
                   p.isActive=1 AND
                   p.readyForFinal=0 AND
                   t.levelId=:levelId AND
                   t.seasonId=:seasonId`,
            { replacements: { levelId: level.id, seasonId: currentSeason.id } }
        );

        const seasonName = getSeasonName(currentSeason);
        const link = `${process.env.TL_URL}/season/${currentSeason.year}/${currentSeason.season}/${level.slug}`;
        const emails = users.filter(getSuitableUsers).map(getEmailContact);
        count += emails.length;

        if (emails.length > 0) {
            // We don't have to wait for the email sent
            app.service('api/emails').create({
                to: emails,
                subject: `Upcoming Final Tournament for the ${seasonName} Ladder`,
                html: tournamentReminderTemplate({
                    config,
                    seasonName,
                    link,
                    levelName: level.name,
                    totalPlayers: tournamentInfo.data.playersBeforeDeadline,
                    entity: isDoublesTeam ? 'team' : 'player',
                }),
                priority: 2,
            });
        }
    }

    await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:seasonId, :name)`, {
        replacements: { seasonId: currentSeason.id, name: ACTION_NAME },
    });

    logger.info(`Tournament reminder sent to ${count} users`);
};

export const lastDayRemindForTournament = async (app: Application) => {
    const sequelize = app.get('sequelizeClient');

    const config = await getCombinedConfig();
    const REMINDER_DAYS = 1;

    // Check if we 1 day close to the tournament
    const currentDate = dayjs.tz();
    const [[currentSeason]] = await sequelize.query(`SELECT * FROM seasons WHERE startDate<:date AND endDate>:date`, {
        replacements: { date: currentDate.format('YYYY-MM-DD HH:mm:ss') },
    });
    if (!currentSeason) {
        return;
    }
    const diff = dayjs.tz(currentSeason.endDate).diff(currentDate, 'day', true);
    if (diff > REMINDER_DAYS || diff < REMINDER_DAYS - 1) {
        return;
    }

    // Check if already sent the reminder
    const ACTION_NAME = 'sendLastDayTournamentReminder';
    if (await isActionDone(sequelize, ACTION_NAME, currentSeason.id)) {
        return;
    }

    // Get all levels
    const levels = await getSeasonLevels(sequelize, currentSeason.id);

    let count = 0;
    for (const level of levels) {
        // Do not remind for doubles team
        if (level.type === 'doubles-team') {
            continue;
        }

        // Get tournament info
        const tournamentInfo = await app
            .service('api/tournaments')
            .get(1, { query: { year: currentSeason.year, season: currentSeason.season, level: level.slug } });

        // Check if tournament is canceled
        if (tournamentInfo.data.cancelFinalTournament) {
            continue;
        }

        const { totalFinalPlayers } = tournamentInfo.data;

        const players = Object.values(tournamentInfo.data.players)
            .sort(
                compareFields(
                    'stats.live.rank',
                    'stats.live.matches-desc',
                    'stats.live.matchesWon-desc',
                    'firstName',
                    'lastName'
                )
            )
            .slice(0, totalFinalPlayers * 2);

        const EXTRA_PLAYERS_TO_NOTIFY = (() => {
            if (totalFinalPlayers >= 16) {
                return 4;
            }
            if (totalFinalPlayers >= 12) {
                return 3;
            }
            return 2;
        })();

        const users = [];
        let readyPlayers = 0;
        let extraPlayers = 0;
        for (const player of players) {
            const isReady = player.readyForFinal === 1;
            const notDecided = player.readyForFinal === 0 && !tournamentInfo.data.playingAnotherFinal[player.userId];
            const isTournamentFull = readyPlayers >= totalFinalPlayers;

            if (isReady || notDecided) {
                users.push(player);

                if (isTournamentFull) {
                    extraPlayers++;
                }
            }

            if (isReady) {
                readyPlayers++;
            }

            if (extraPlayers >= EXTRA_PLAYERS_TO_NOTIFY) {
                break;
            }
        }

        const seasonName = getSeasonName(currentSeason);
        const link = `${process.env.TL_URL}/season/${currentSeason.year}/${currentSeason.season}/${level.slug}`;
        count += users.length;

        const sendEmails = async ({ recipients, isRegistered }) => {
            const emails = recipients.map(getEmailContact);

            if (emails.length > 0) {
                await app.service('api/emails').create({
                    to: emails,
                    subject: isRegistered
                        ? `Confirming Your Availability for the ${seasonName} Ladder Tournament`
                        : `Last Chance to Sign Up for the ${seasonName} Ladder Tournament`,
                    html: lastDayTournamentReminderTemplate({
                        config,
                        seasonName,
                        link,
                        levelName: level.name,
                        isRegistered,
                    }),
                    priority: 2,
                });

                // wait a bit just to not overwhelm email server
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        };

        await sendEmails({
            recipients: users.filter((user) => user.readyForFinal === 1),
            isRegistered: true,
        });
        await sendEmails({
            recipients: users.filter((user) => user.readyForFinal !== 1),
            isRegistered: false,
        });
    }

    await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:seasonId, :name)`, {
        replacements: { seasonId: currentSeason.id, name: ACTION_NAME },
    });

    logger.info(`Last day tournament reminder sent to ${count} users`);
};

export const remindForFirstDay = async (app: Application) => {
    const sequelize = app.get('sequelizeClient');

    const config = await getCombinedConfig();

    // Check the current season
    const currentDate = dayjs.tz();
    const [seasons] = await sequelize.query(`SELECT * FROM seasons WHERE startDate<:date AND endDate>:date`, {
        replacements: { date: currentDate.format('YYYY-MM-DD HH:mm:ss') },
    });
    const currentSeason = seasons[0];
    if (!currentSeason) {
        return;
    }
    const diff = currentDate.diff(dayjs.tz(currentSeason.startDate), 'day', true);
    if (diff > 1) {
        return;
    }

    // Check if already sent the reminder
    const ACTION_NAME = 'sendFirstDayReminder';
    if (await isActionDone(sequelize, ACTION_NAME, currentSeason.id)) {
        return;
    }

    // Get all players for the current season
    // TODO: don't sent this message for players who registered this day so far
    let [users] = await sequelize.query(
        `
        SELECT u.firstName, u.lastName, u.email
          FROM users AS u,
               players AS p,
               tournaments AS t
         WHERE u.id=p.userId AND
               u.subscribeForReminders=1 AND
               p.tournamentId=t.id AND
               t.seasonId=:seasonId`,
        { replacements: { seasonId: currentSeason.id } }
    );
    users = _uniqBy(users, 'email');

    const emails = users.map(getEmailContact);
    if (emails.length === 0) {
        return;
    }

    const seasonName = getSeasonName(currentSeason);

    // We don't have to wait for the email sent
    app.service('api/emails').create({
        to: emails,
        subject: `The ${config.city} ${seasonName} Ladder Begins Today!`,
        html: firstDayReminderTemplate({ config, currentSeason }),
        priority: 2,
    });

    await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:seasonId, :name)`, {
        replacements: { seasonId: currentSeason.id, name: ACTION_NAME },
    });

    logger.info(`Season first day reminder sent to ${emails.length} users`);
};

export const requestFeedbackForNoJoin = async (app: Application) => {
    const sequelize = app.get('sequelizeClient');

    const config = await getCombinedConfig();
    if (config.isRaleigh) {
        return;
    }

    const [prevSeason, currentSeason] = await getCurrentSeasons(sequelize);
    if (!prevSeason || !currentSeason) {
        return;
    }

    const currentDate = dayjs.tz();
    const targetDate = dayjs.tz(currentSeason.startDate).add(2, 'week');
    const diff = currentDate.diff(targetDate, 'day', true);
    if (diff < 0 || diff > 1) {
        return;
    }

    // get all players who already got a feedback request
    const ACTION_NAME = 'sendNoPlayFeedbackRequest';
    const withFeedbackUserIds = new Set();
    {
        const [rows] = await sequelize.query(`SELECT tableId FROM actions WHERE name=:actionName`, {
            replacements: { actionName: ACTION_NAME },
        });
        for (const row of rows) {
            withFeedbackUserIds.add(row.tableId);
        }
    }

    // Get all players for the current season
    const currentSeasonUserIds = new Set();
    {
        const [rows] = await sequelize.query(
            `
            SELECT p.userId
            FROM players AS p, tournaments AS t
            WHERE p.tournamentId=t.id AND t.seasonId=:seasonId`,
            { replacements: { seasonId: currentSeason.id } }
        );
        for (const row of rows) {
            currentSeasonUserIds.add(row.userId);
        }
    }

    // Get emails
    const users = {};
    {
        const [matches] = await sequelize.query(
            `
            SELECT uc.id AS challengerUserId,
                   uc.email AS challengerEmail,
                   uc.firstName AS challengerFirstName,
                   uc.lastName AS challengerLastName,
                   ua.id AS acceptorUserId,
                   ua.email AS acceptorEmail,
                   ua.firstName AS acceptorFirstName,
                   ua.lastName AS acceptorLastName
               FROM players AS p,
                    tournaments AS t,
                    matches AS m
               JOIN players AS pc ON m.challengerId=pc.id
               JOIN players AS pa ON m.acceptorId=pa.id
               JOIN users AS uc ON pc.userId=uc.id
               JOIN users AS ua ON pa.userId=ua.id
              WHERE m.challengerId=p.id AND
                    p.tournamentId=t.id AND
                    t.seasonId=:seasonId AND
                    ${getStatsMatches('m')} AND
                    m.challenger2Id IS NULL`,
            { replacements: { seasonId: prevSeason.id } }
        );

        const addEmailForUserId = (user) => {
            if (withFeedbackUserIds.has(user.id)) {
                return;
            }
            if (currentSeasonUserIds.has(user.id)) {
                return;
            }
            users[user.id] = user;
        };

        for (const match of matches) {
            addEmailForUserId({
                id: match.challengerUserId,
                email: match.challengerEmail,
                firstName: match.challengerFirstName,
                lastName: match.challengerLastName,
            });
            addEmailForUserId({
                id: match.acceptorUserId,
                email: match.acceptorEmail,
                firstName: match.acceptorFirstName,
                lastName: match.acceptorLastName,
            });
        }
    }

    const emails = Object.values(users).map(getEmailContact);
    if (emails.length === 0) {
        return;
    }

    // We don't have to wait for the email sent
    app.service('api/emails').create({
        to: emails,
        from: { name: 'Andrew Cole', email: 'andrew.cole@tennis-ladder.com' },
        subject: 'How Can We Improve? Share Your Thoughts!',
        html: feedbackRequestTemplate({ config, prevSeason, currentSeason }),
        priority: 2,
    });

    for (const user of Object.values(users)) {
        await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:userId, :name)`, {
            replacements: { userId: user.id, name: ACTION_NAME },
        });
    }

    logger.info(`Feedback request sent to ${emails.length} users`);
};

export const switchToPercentReferral = async (app: Application) => {
    const sequelize = app.get('sequelizeClient');

    const config = await getCombinedConfig();
    if (!['richmond', 'sanantonio'].includes(config.url)) {
        return;
    }

    // check that we don't have any paid season
    {
        const [rows] = await sequelize.query(`SELECT id FROM seasons WHERE isFree=0`);
        if (rows.length > 0) {
            return;
        }
    }

    const currentDate = dayjs.tz();

    // check that we have current on next season
    {
        const [rows] = await sequelize.query(`SELECT id FROM seasons WHERE endDate>:date`, {
            replacements: { date: currentDate.format('YYYY-MM-DD HH:mm:ss') },
        });
        if (rows.length === 0) {
            return;
        }
    }

    // get all players who already got a percent referral email
    const ACTION_NAME = 'sendPercentReferralInfo';
    const alreadySentIds = new Set();
    {
        const [rows] = await sequelize.query(`SELECT tableId FROM actions WHERE name=:actionName`, {
            replacements: { actionName: ACTION_NAME },
        });
        for (const row of rows) {
            alreadySentIds.add(row.tableId);
        }
    }

    // Get users
    const dateDayAgo = currentDate.subtract(1, 'day');
    const [users] = await sequelize.query(
        `
        SELECT id,
               email,
               firstName,
               lastName
          FROM users
         WHERE refPercent IS NULL AND
               roles="player" AND
               isVerified=1 AND
               subscribeForNews=1 AND
               createdAt<:date`,
        { replacements: { date: dateDayAgo.format('YYYY-MM-DD HH:mm:ss') } }
    );

    const filteredUsers = users.filter((user) => !alreadySentIds.has(user.id));

    const emails = filteredUsers.map(getEmailContact);
    if (emails.length === 0) {
        return;
    }

    // We don't have to wait for the email sent
    app.service('api/emails').create({
        to: emails,
        subject: `Get Paid to Grow the ${config.city} Rival Tennis Ladder 🎾💸`,
        html: percentReferralTemplate(config),
        priority: 2,
    });

    for (const user of filteredUsers) {
        await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:userId, :name)`, {
            replacements: { userId: user.id, name: ACTION_NAME },
        });
        await sequelize.query(`UPDATE users SET refPercent=30, refYears=3, refStartedAt=createdAt WHERE id=:userId`, {
            replacements: { userId: user.id },
        });
    }

    logger.info(`Percent referral offer sent to ${emails.length} users`);
};

export const remindForActivity = async (app: Application) => {
    const sequelize = app.get('sequelizeClient');
    const { users } = sequelize.models;
    const ACTION_NAME = 'activityReminder';

    const config = await getCombinedConfig();
    if (config.isRaleigh) {
        return;
    }

    // users with matches
    const usersIgnored = new Set();
    {
        const [rows] = await sequelize.query(
            `
            SELECT pc.userId AS challengerUserId,
                   pa.userId AS acceptorUserId
              FROM matches AS m
              JOIN players AS pc ON m.challengerId=pc.id
              JOIN players AS pa ON m.acceptorId=pa.id
             WHERE ${getStatsMatches('m')}`
        );

        for (const row of rows) {
            usersIgnored.add(row.challengerUserId);
            usersIgnored.add(row.acceptorUserId);
        }
    }

    // users who already got reminder
    {
        const [rows] = await sequelize.query(`SELECT tableId FROM actions WHERE name=:name`, {
            replacements: { name: ACTION_NAME },
        });
        for (const row of rows) {
            usersIgnored.add(row.tableId);
        }
    }

    // Send reminder to the users who need it
    {
        const currentDate = dayjs.tz().format('YYYY-MM-DD HH:mm:ss');
        const dateTwoWeeksAgo = dayjs.tz().subtract(2, 'week').format('YYYY-MM-DD HH:mm:ss');
        const dateFiveWeeksAgo = dayjs.tz().subtract(5, 'week').format('YYYY-MM-DD HH:mm:ss');

        const [rows] = await sequelize.query(
            `
            SELECT DISTINCT p.userId
              FROM players AS p,
                   users AS u,
                   tournaments AS t,
                   seasons AS s
             WHERE p.userId=u.id AND
                   p.tournamentId=t.id AND
                   t.seasonId=s.id AND
                   p.isActive=1 AND
                   u.subscribeForReminders=1 AND
                   p.createdAt>:dateFiveWeeksAgo AND
                   p.createdAt<:dateTwoWeeksAgo AND
                   s.startDate<:dateTwoWeeksAgo AND
                   s.endDate>:currentDate`,
            {
                replacements: { currentDate, dateTwoWeeksAgo, dateFiveWeeksAgo },
            }
        );

        const userIds = rows.map((row) => row.userId).filter((id) => !usersIgnored.has(id));

        for (const userId of userIds) {
            const user = await users.findByPk(userId);
            const emails = [getEmailContact(user)];

            await app.service('api/emails').create({
                to: emails,
                subject: 'Play Your First Match on the Rival Tennis Ladder',
                html: activityReminderTemplate(config),
                priority: 2,
            });

            await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:userId, :name)`, {
                replacements: { userId, name: ACTION_NAME },
            });
        }

        if (userIds.length > 0) {
            logger.info(`Activity reminder sent to ${userIds.length} users`);
        }
    }
};

export const remindForChoosingLadder = async (app: Application) => {
    const sequelize = app.get('sequelizeClient');
    const ACTION_NAME = 'chooseLadderReminder';

    const config = await getCombinedConfig();
    if (config.isRaleigh) {
        return;
    }

    // send reminder only if the current season is in progress and not coming to the end
    const currentDate = dayjs.tz();
    const startDateBefore = currentDate.subtract(3, 'day');
    const endDateAfter = currentDate.add(15, 'day');

    const [seasons] = await sequelize.query(
        `SELECT * FROM seasons WHERE startDate<:startDateBefore AND endDate>:endDateAfter`,
        {
            replacements: {
                startDateBefore: startDateBefore.format('YYYY-MM-DD HH:mm:ss'),
                endDateAfter: endDateAfter.format('YYYY-MM-DD HH:mm:ss'),
            },
        }
    );
    if (!seasons[0]) {
        return;
    }

    // users who already got the reminder
    const usersIgnored = new Set();
    {
        const [rows] = await sequelize.query(`SELECT tableId FROM actions WHERE name=:name`, {
            replacements: { name: ACTION_NAME },
        });
        for (const row of rows) {
            usersIgnored.add(row.tableId);
        }
    }

    const minCreatedAt = currentDate.subtract(5, 'week');
    const maxCreatedAt = currentDate.subtract(3, 'day');
    const [users] = await sequelize.query(
        `
        SELECT id, firstName, lastName, email, roles
          FROM users
         WHERE id NOT IN (SELECT DISTINCT userId FROM players) AND
               isVerified=1 AND
               createdAt>:minCreatedAt AND
               createdAt<:maxCreatedAt`,
        {
            replacements: {
                minCreatedAt: minCreatedAt.format('YYYY-MM-DD HH:mm:ss'),
                maxCreatedAt: maxCreatedAt.format('YYYY-MM-DD HH:mm:ss'),
            },
        }
    );

    const filteredUsers = users.filter((user) => !usersIgnored.has(user.id) && user.roles.includes('player'));
    for (const user of filteredUsers) {
        const emails = [getEmailContact(user)];

        await app.service('api/emails').create({
            to: emails,
            subject: 'Pick a Ladder to Start Playing Tennis Today!',
            html: noLadderChosenTemplate(config),
            priority: 2,
        });

        await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:userId, :name)`, {
            replacements: { userId: user.id, name: ACTION_NAME },
        });
    }

    if (filteredUsers.length > 0) {
        logger.info(`Choose ladder reminder sent to ${filteredUsers.length} users`);
    }
};

export const seasonIsOver = async (app: Application) => {
    const { TL_URL } = process.env;
    const sequelize = app.get('sequelizeClient');
    const MIN_MATCHES_PLAYED = process.env.NODE_ENV === 'test' ? 5 : 25;

    const config = await getCombinedConfig();
    const currentDate = dayjs.tz();

    const [prevSeason, nextSeason] = await getCurrentSeasons(sequelize);
    if (!prevSeason || !nextSeason) {
        return;
    }

    const targetDate = dayjs.tz(prevSeason.endDate);
    const diff = currentDate.diff(targetDate, 'day', true);
    // two days window to send the reminder
    if (diff < 0 || diff > 2) {
        return;
    }

    const startDate = dayjs.tz(prevSeason.startDate).format('YYYY-MM-DD HH:mm:ss');

    // check if we already send a summary
    const ACTION_NAME = 'seasonIsOver';
    if (await isActionDone(sequelize, ACTION_NAME, prevSeason.id)) {
        return;
    }

    // populate stats
    const stats = {};
    {
        const [result] = await sequelize.query(
            `
            SELECT COUNT(*) AS cnt
              FROM matches AS m,
                   players AS p,
                   tournaments AS t
             WHERE m.challengerId=p.id AND
                   p.tournamentId=t.id AND
                   t.seasonId=:seasonId AND
                   ${getStatsMatches('m')} AND
                   m.type="regular"`,
            { replacements: { seasonId: prevSeason.id } }
        );
        stats.matchesPlayed = result[0].cnt;
        if (stats.matchesPlayed < MIN_MATCHES_PLAYED) {
            return;
        }
    }
    {
        const [result] = await sequelize.query(
            `
            SELECT COUNT(*) AS cnt
              FROM players AS p,
                   tournaments AS t
             WHERE p.tournamentId=t.id AND
                   t.seasonId=:seasonId`,
            { replacements: { seasonId: prevSeason.id } }
        );
        stats.registrations = result[0].cnt;
    }
    {
        const [result] = await sequelize.query(
            `
            SELECT COUNT(*) AS cnt
              FROM matches AS m,
                   players AS p,
                   tournaments AS t
             WHERE m.challengerId=p.id AND
                   p.tournamentId=t.id AND
                   t.seasonId=:seasonId AND
                   m.initial=1 AND
                   m.place IS NOT NULL AND
                   m.type="regular"`,
            { replacements: { seasonId: prevSeason.id } }
        );
        stats.proposals = result[0].cnt;
    }
    {
        const [result] = await sequelize.query(
            `
            SELECT pc.userId AS challengerUserId,
                   pa.userId AS acceptorUserid,
                   m.challengerId,
                   m.acceptorId,
                   m.challengerEloChange,
                   m.acceptorEloChange,
                   m.playedAt
              FROM matches AS m
              JOIN players AS pc ON m.challengerId=pc.id
              JOIN players AS pa ON m.challengerId=pa.id
             WHERE ${getStatsMatches('m')} AND
                   m.type="regular"
          ORDER BY m.playedAt`
        );
        stats.rivalries = 0;
        const pairs = new Set();
        const tlrPoints = {};
        for (const row of result) {
            const playedThisSeason = row.playedAt > startDate;
            const code = [row.challengerUserId, row.acceptorUserId].sort((a, b) => a - b).join('-');
            if (!pairs.has(code) && playedThisSeason) {
                stats.rivalries++;
            }
            pairs.add(code);

            if (playedThisSeason) {
                tlrPoints[row.challengerId] = tlrPoints[row.challengerId] || 0;
                tlrPoints[row.challengerId] += row.challengerEloChange;

                tlrPoints[row.acceptorId] = tlrPoints[row.acceptorId] || 0;
                tlrPoints[row.acceptorId] += row.acceptorEloChange;
            }
        }

        stats.tlrPointsGained = Object.values(tlrPoints).reduce((sum, num) => sum + (num > 0 ? num : 0), 0);
    }
    {
        const [result] = await sequelize.query(
            `
            SELECT SUM(m.challengerPoints) AS totalChallengerPoints,
                   SUM(m.acceptorPoints) AS totalAcceptorPoints
              FROM matches AS m,
                   players AS p,
                   tournaments AS t
             WHERE m.challengerId=p.id AND
                   p.tournamentId=t.id AND
                   t.seasonId=:seasonId AND
                   m.score IS NOT NULL AND
                   m.unavailable=0 AND
                   m.type="regular"`,
            { replacements: { seasonId: prevSeason.id } }
        );
        stats.pointsGained = +result[0].totalChallengerPoints + +result[0].totalAcceptorPoints;
    }

    // populate achievers
    const players = {};
    {
        const [result] = await sequelize.query(
            `
            SELECT pc.userId AS challengerUserId,
                   pa.userId AS acceptorUserId
              FROM matches AS m,
                   tournaments AS t,
                   players AS pc,
                   players AS pa
             WHERE m.challengerId=pc.id AND
                   m.acceptorId=pa.id AND
                   pc.tournamentId=t.id AND
                   t.seasonId=:seasonId AND
                   ${getStatsMatches('m')} AND
                   m.type="regular"`,
            { replacements: { seasonId: prevSeason.id } }
        );
        const totalMatches = result.reduce((obj, item) => {
            obj[item.challengerUserId] = obj[item.challengerUserId] || { userId: item.challengerUserId, number: 0 };
            obj[item.challengerUserId].number++;

            obj[item.acceptorUserId] = obj[item.acceptorUserId] || { userId: item.acceptorUserId, number: 0 };
            obj[item.acceptorUserId].number++;

            return obj;
        }, {});
        players.grinder = Object.values(totalMatches).reduce((res, obj) => {
            return obj.number > res.number ? obj : res;
        });
    }
    {
        const [result] = await sequelize.query(
            `
            SELECT pc.userId AS challengerUserId,
                   pa.userId AS acceptorUserId,
                   m.challengerPoints,
                   m.acceptorPoints
              FROM matches AS m,
                   tournaments AS t,
                   players AS pc,
                   players AS pa
             WHERE m.challengerId=pc.id AND
                   m.acceptorId=pa.id AND
                   pc.tournamentId=t.id AND
                   t.seasonId=:seasonId AND
                   m.score IS NOT NULL AND
                   m.unavailable=0 AND
                   m.type="regular"`,
            { replacements: { seasonId: prevSeason.id } }
        );
        const totalPoints = result.reduce((obj, item) => {
            obj[item.challengerUserId] = obj[item.challengerUserId] || { userId: item.challengerUserId, number: 0 };
            obj[item.challengerUserId].number += item.challengerPoints;

            obj[item.acceptorUserId] = obj[item.acceptorUserId] || { userId: item.acceptorUserId, number: 0 };
            obj[item.acceptorUserId].number += item.acceptorPoints;

            return obj;
        }, {});
        players.highAchiever = Object.values(totalPoints).reduce((res, obj) => {
            return obj.number > res.number ? obj : res;
        });
    }
    {
        const [result] = await sequelize.query(
            `
            SELECT pc.userId AS challengerUserId,
                   pa.userId AS acceptorUserId,
                   m.challengerId,
                   m.acceptorId,
                   m.challengerEloChange,
                   m.acceptorEloChange,
                   m.playedAt
              FROM matches AS m,
                   tournaments AS t,
                   players AS pc,
                   players AS pa
             WHERE m.challengerId=pc.id AND
                   m.acceptorId=pa.id AND
                   pc.tournamentId=t.id AND
                   t.seasonId=:seasonId AND
                   ${getStatsMatches('m')} AND
                   m.type="regular"`,
            { replacements: { seasonId: prevSeason.id } }
        );
        const tlrPoints = result.reduce((obj, item) => {
            obj[item.challengerUserId] = obj[item.challengerUserId] || { userId: item.challengerUserId, number: 0 };
            obj[item.challengerUserId].number += item.challengerEloChange;

            obj[item.acceptorUserId] = obj[item.acceptorUserId] || { userId: item.acceptorUserId, number: 0 };
            obj[item.acceptorUserId].number += item.acceptorEloChange;

            return obj;
        }, {});
        players.mostImproved = Object.values(tlrPoints).reduce((res, obj) => {
            return obj.number > res.number ? obj : res;
        });
    }
    {
        const [result] = await sequelize.query(
            `
            SELECT COUNT(*) AS number,
                   p.userId
              FROM matches AS m,
                   players AS p,
                   tournaments AS t
             WHERE m.challengerId=p.id AND
                   p.tournamentId=t.id AND
                   t.seasonId=:seasonId AND
                   m.initial=1 AND
                   m.place IS NOT NULL AND
                   m.type="regular"
          GROUP BY p.userId`,
            { replacements: { seasonId: prevSeason.id } }
        );
        players.planner = result.reduce((res, obj) => {
            return obj.number > res.number ? obj : res;
        });
    }
    {
        const [result] = await sequelize.query(
            `
            SELECT pc.userId AS challengerUserId,
                   pa.userId AS acceptorUserId,
                   m.challengerElo,
                   m.acceptorElo
              FROM matches AS m,
                   tournaments AS t,
                   players AS pc,
                   players AS pa
             WHERE m.challengerId=pc.id AND
                   m.acceptorId=pa.id AND
                   pc.tournamentId=t.id AND
                   t.seasonId=:seasonId AND
                   ${getStatsMatches('m')} AND
                   m.type="regular"`,
            { replacements: { seasonId: prevSeason.id } }
        );
        const tlrPoints = result.reduce((obj, item) => {
            obj[item.challengerUserId] = obj[item.challengerUserId] || { userId: item.challengerUserId, number: 0 };
            obj[item.challengerUserId].number = Math.max(obj[item.challengerUserId].number, item.challengerElo);

            obj[item.acceptorUserId] = obj[item.acceptorUserId] || { userId: item.acceptorUserId, number: 0 };
            obj[item.acceptorUserId].number = Math.max(obj[item.acceptorUserId].number, item.acceptorElo);

            return obj;
        }, {});
        players.expert = Object.values(tlrPoints).reduce((res, obj) => {
            return obj.number > res.number ? obj : res;
        });
    }

    // get all season players
    let [allPlayers] = await sequelize.query(
        `
        SELECT u.id,
               u.firstName,
               u.lastName,
               u.avatarObject
          FROM users AS u,
               players AS p,
               tournaments AS t
         WHERE u.id=p.userId AND
               p.tournamentId=t.id AND
               t.seasonId=:seasonId`,
        { replacements: { seasonId: prevSeason.id } }
    );
    allPlayers = allPlayers.reduce((obj, item) => {
        obj[item.id] = item;
        return obj;
    }, {});

    const playersArray = Object.values(players);
    const avatars = await Promise.all(
        playersArray.map((player) => {
            const avatarObject = allPlayers[player.userId].avatarObject;
            if (!avatarObject) {
                return renderImage(`${TL_URL}/image/avatar`);
            }

            const params = Object.entries(JSON.parse(avatarObject))
                .map(([key, value]) => `${key}=${value}`)
                .join('&');
            return renderImage(`${TL_URL}/image/avatar?${params}`);
        })
    );

    for (let i = 0; i < playersArray.length; i++) {
        const player = playersArray[i];
        player.firstName = allPlayers[player.userId].firstName;
        player.lastName = allPlayers[player.userId].lastName;
        player.avatar = avatars[i];
    }

    const [users] = await sequelize.query(
        `
        SELECT DISTINCT u.id, u.firstName, u.lastName, u.email
          FROM users AS u
          JOIN players AS p ON u.id=p.userId AND p.isActive=1
          JOIN tournaments AS t ON p.tournamentId=t.id AND t.seasonId=:seasonId
         WHERE u.subscribeForNews=1`,
        { replacements: { seasonId: prevSeason.id } }
    );

    const emails = users.map(getEmailContact);

    await app.service('api/emails').create({
        to: emails,
        subject: `End of ${getSeasonName(prevSeason)} Ladder Stats and Friendly Proposals`,
        html: seasonIsOverTemplate({ config, prevSeason, nextSeason, stats, players }),
        priority: 2,
    });

    await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:seasonId, :name)`, {
        replacements: { seasonId: prevSeason.id, name: ACTION_NAME },
    });

    if (emails.length > 0) {
        logger.info(`The season is over summary sent to ${emails.length} users`);
    }
};

export const joinNextSeason = async (app: Application) => {
    const sequelize = app.get('sequelizeClient');

    const [prevSeason, nextSeason] = await getCurrentSeasons(sequelize);
    if (!prevSeason || !nextSeason) {
        return;
    }

    const config = await getCombinedConfig();
    const currentDate = dayjs.tz();

    const REMINDERS = [
        {
            ACTION_NAME: 'joinNextSeasonFirst',
            daysToNextSeason: 20,
            getSubject: (isFree) => {
                return isFree
                    ? `Rejoin the ${config.city} Tennis Ladder for Free!`
                    : `Sign Up Today for the ${getSeasonName(nextSeason)} Season!`;
            },
        },
        {
            ACTION_NAME: 'joinNextSeasonBetween',
            daysToNextSeason: 10,
            getSubject: (isFree) => {
                return isFree
                    ? `Reminder: You Can Rejoin the Ladder for Free!`
                    : `Don't Forget to Register Today for $${config.earlyRegistrationDiscount / 100} Off!`;
            },
        },
        {
            ACTION_NAME: 'joinNextSeasonLast',
            daysToNextSeason: 3,
            getSubject: (isFree) => {
                return isFree
                    ? `You Can Rejoin the Ladder for Free!`
                    : `Register Today for $${config.earlyRegistrationDiscount / 100} Off!`;
            },
        },
    ];

    const daysToNextSeason = dayjs.tz(nextSeason.startDate).diff(currentDate, 'day', true);
    const reminder = REMINDERS.find(
        (item) => daysToNextSeason < item.daysToNextSeason && daysToNextSeason > item.daysToNextSeason - 2
    );

    if (!reminder) {
        return;
    }

    if (await isActionDone(sequelize, reminder.ACTION_NAME, nextSeason.id)) {
        return;
    }

    const levels = await getSeasonTournaments({ seasonId: nextSeason.id, sequelize, config });
    const nextSeasonUserIds = await getSeasonUsers(sequelize, nextSeason.id);
    const nextSeasonRegistrations = await getSeasonRegistrations(sequelize, nextSeason.id);

    // get all users who played matches
    const [usersIds] = await sequelize.query(
        `
        SELECT pc.userId AS challengerUserId,
               pc2.userId AS challenger2UserId,
               pa.userId AS acceptorUserId,
               pa2.userId AS acceptor2UserId
          FROM matches AS m
     LEFT JOIN players AS pc ON m.challengerId=pc.id
     LEFT JOIN players AS pc2 ON m.challenger2Id=pc2.id
     LEFT JOIN players AS pa ON m.acceptorId=pa.id
     LEFT JOIN players AS pa2 ON m.acceptor2Id=pa2.id
         WHERE ${getStatsMatches('m')}`
    );
    const matches = usersIds.reduce((obj, row) => {
        [row.challengerUserId, row.challenger2UserId, row.acceptorUserId, row.acceptor2UserId].forEach((id) => {
            if (id) {
                obj[id] = (obj[id] || 0) + 1;
            }
        });

        return obj;
    }, {});

    // all users, who have been active since Rival arrived
    const [allUsers] = await sequelize.query(
        `
        SELECT id, firstName, lastName, email, gender
          FROM users
         WHERE createdAt<:threeDaysAgo AND
               roles="player" AND
               subscribeForReminders=1 AND
               loggedAt>:rivalFoundedDate`,
        {
            replacements: {
                threeDaysAgo: currentDate.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
                rivalFoundedDate: '2022-01-01',
            },
        }
    );

    const affectedUsers = allUsers.filter((user) => !nextSeasonUserIds.has(user.id));

    // get TLR
    const establishedEloAllUsers = await getEstablishedEloAllUsers({ config, sequelize });

    // get credit
    const [rows] = await sequelize.query(`SELECT userId, sum(amount) AS sum FROM payments GROUP BY userId`);
    const availableCredit = rows.reduce((obj, item) => {
        obj[item.userId] = item.sum;
        return obj;
    }, {});

    const commonParams = {
        season: {
            ...nextSeason,
            name: getSeasonName(nextSeason),
            dates: [
                dayjs.tz(nextSeason.startDate).add(12, 'hour').format('MMM D'),
                dayjs.tz(nextSeason.endDate).subtract(12, 'hour').format('MMM D'),
            ].join(' - '),
            weeks: Math.round(dayjs(nextSeason.endDate).diff(dayjs(nextSeason.startDate), 'week', true)),
        },
        levels,
        config,
        currentDate: currentDate.format('YYYY-MM-DD HH:mm:ss'),
        scale: 1.5,
        totalPlayers: nextSeasonRegistrations,
    };

    const svgs = affectedUsers.reduce((obj, user) => {
        const params = {
            ...commonParams,
            creditAmount: availableCredit[user.id] || 0,
            elo: establishedEloAllUsers[user.id] || null,
            matchesPlayed: matches[user.id] || 0,
            gender: user.gender,
        };

        obj[user.id] = getSeasonSvg(params);
        return obj;
    }, {});

    const images = await getImagesFromSvg(svgs);

    const usersFree = affectedUsers.filter(
        (user) => nextSeason.isFree || !matches[user.id] || matches[user.id] < config.minMatchesToPay
    );
    const usersPaid = affectedUsers.filter(
        (user) => !nextSeason.isFree && matches[user.id] && matches[user.id] >= config.minMatchesToPay
    );

    const sendReminder = async (list, isFree) => {
        const emails = list.map((user) => ({
            ...getEmailContact(user),
            variables: {
                '#seasonImageSrc#': images[user.id],
            },
            delay: 60, // to make sure that images are available online
        }));

        await app.service('api/emails').create({
            to: emails,
            subject: reminder.getSubject(isFree),
            html: joinNextSeasonTemplate({ config, season: nextSeason }),
            priority: 2,
        });
    };

    await sendReminder(usersFree, true);
    await sendReminder(usersPaid, false);

    logger.info(`The reminder to join next season sent to ${affectedUsers.length} users`);

    await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:seasonId, :name)`, {
        replacements: { seasonId: nextSeason.id, name: reminder.ACTION_NAME },
    });
};

export const remindForClaimingReward = async (app: Application) => {
    const sequelize = app.get('sequelizeClient');

    const config = await getCombinedConfig();
    if (config.isRaleigh) {
        return;
    }

    const dateMonthAgo = dayjs.tz().subtract(1, 'month');
    const [matches] = await sequelize.query(
        `
        SELECT uc.firstName AS challengerFirstName,
               uc.lastName AS challengerLastName,
               uc.email AS challengerEmail,
               pc.address AS challengerAddress,
               pc.partnerId AS challengerPartnerId,
               ua.firstName AS acceptorFirstName,
               ua.lastName AS acceptorLastName,
               ua.email AS acceptorEmail,
               pa.address AS acceptorAddress,
               pa.partnerId AS acceptorPartnerId,
               l.name AS levelName,
               l.slug AS levelSlug,
               l.type AS levelType,
               s.year AS seasonYear,
               s.season AS seasonSeason,
               s.isFree AS seasonIsFree,
               m.winner,
               m.challengerId,
               m.acceptorId,
               m.wonByDefault
          FROM matches AS m
          JOIN players AS pc ON m.challengerId=pc.id
          JOIN players AS pa ON m.acceptorId=pa.id
          JOIN users AS uc ON pc.userId=uc.id
          JOIN users AS ua ON pa.userId=ua.id
          JOIN tournaments AS t ON pc.tournamentId=t.id
          JOIN levels AS l ON t.levelId=l.id
          JOIN seasons AS s ON t.seasonId=s.id
         WHERE m.type="final" AND
               m.finalSpot=1 AND
               m.score IS NOT NULL AND
               m.battleId IS NULL AND
               m.createdAt>:date`,
        { replacements: { date: dateMonthAgo.format('YYYY-MM-DD HH:mm:ss') } }
    );

    const users = [];
    let isFree = false;
    for (const match of matches) {
        isFree = match.seasonIsFree === 1;

        if (match.levelType === 'doubles-team') {
            const winnerCaptainId =
                match.winner === match.challengerId
                    ? match.challengerPartnerId || match.challengerId
                    : match.acceptorPartnerId || match.acceptorId;
            const [[captain]] = await sequelize.query(
                `SELECT u.firstName,
                        u.lastName,
                        u.email,
                        p.address
                   FROM players AS p,
                        users AS u
                  WHERE p.userId=u.id AND
                        p.id=:playerId`,
                { replacements: { playerId: winnerCaptainId } }
            );

            if (!captain.address) {
                users.push({
                    playerId: winnerCaptainId,
                    firstName: captain.firstName,
                    lastName: captain.lastName,
                    email: captain.email,
                    levelType: match.levelType,
                    levelName: match.levelName,
                    levelLink: `${process.env.TL_URL}/season/${match.seasonYear}/${match.seasonSeason}/${match.levelSlug}`,
                    isWinner: true,
                });
            }

            continue;
        }

        if (!match.challengerAddress) {
            // Do not send reminder for runner-up who lost by default
            if (!match.wonByDefault || match.challengerId === match.winner) {
                users.push({
                    playerId: match.challengerId,
                    firstName: match.challengerFirstName,
                    lastName: match.challengerLastName,
                    email: match.challengerEmail,
                    levelName: match.levelName,
                    levelLink: `${process.env.TL_URL}/season/${match.seasonYear}/${match.seasonSeason}/${match.levelSlug}`,
                    isWinner: match.challengerId === match.winner,
                });
            }
        }
        if (!match.acceptorAddress) {
            // Do not send reminder for runner-up who lost by default
            if (!match.wonByDefault || match.acceptorId === match.winner) {
                users.push({
                    playerId: match.acceptorId,
                    firstName: match.acceptorFirstName,
                    lastName: match.acceptorLastName,
                    email: match.acceptorEmail,
                    levelName: match.levelName,
                    levelLink: `${process.env.TL_URL}/season/${match.seasonYear}/${match.seasonSeason}/${match.levelSlug}`,
                    isWinner: match.acceptorId === match.winner,
                });
            }
        }
    }

    const ACTION_NAME = 'claimReward';
    let counter = 0;
    for (const user of users) {
        if (await isActionDone(sequelize, ACTION_NAME, user.playerId)) {
            continue;
        }

        await app.service('api/emails').create({
            to: [user].map(getEmailContact),
            subject: `Claim your reward!`,
            html: claimRewardTemplate({
                config,
                levelName: user.levelName,
                levelLink: user.levelLink,
                levelType: user.levelType,
                isWinner: user.isWinner,
                isFree,
            }),
            priority: 2,
        });

        await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:tableId, :name)`, {
            replacements: { tableId: user.playerId, name: ACTION_NAME },
        });

        counter++;
    }

    if (counter > 0) {
        logger.info(`The reminder to claim the reward sent to ${counter} users`);
    }
};

export const sendFinalScheduleReminder = async (app: Application) => {
    const sequelize = app.get('sequelizeClient');

    const config = await getCombinedConfig();

    // Check the current season
    const currentDate = dayjs.tz();
    const [[currentSeason]] = await sequelize.query(
        `SELECT * FROM seasons WHERE endDate<:date ORDER BY endDate DESC LIMIT 0, 1`,
        { replacements: { date: currentDate.format('YYYY-MM-DD HH:mm:ss') } }
    );
    const diff = currentDate.diff(dayjs.tz(currentSeason.endDate), 'day', true);
    if (diff < 1 || diff > 14) {
        return;
    }

    const dateTwoDaysAgo = currentDate.subtract(2, 'day');
    const [matches] = await sequelize.query(
        `
        SELECT uc.firstName AS challengerFirstName,
               uc.lastName AS challengerLastName,
               uc.email AS challengerEmail,
               uc.phone AS challengerPhone,
               pc.address AS challengerAddress,
               ua.firstName AS acceptorFirstName,
               ua.lastName AS acceptorLastName,
               ua.email AS acceptorEmail,
               ua.phone AS acceptorPhone,
               l.name AS levelName,
               l.slug AS levelSlug,
               s.year AS seasonYear,
               s.season AS seasonSeason,
               t.id AS tournamentId,
               m.id,
               m.challengerId,
               m.acceptorId,
               m.finalSpot
          FROM matches AS m
          JOIN players AS pc ON m.challengerId=pc.id
          JOIN players AS pa ON m.acceptorId=pa.id
          JOIN users AS uc ON pc.userId=uc.id
          JOIN users AS ua ON pa.userId=ua.id
          JOIN tournaments AS t ON pc.tournamentId=t.id
          JOIN levels AS l ON t.levelId=l.id
          JOIN seasons AS s ON t.seasonId=s.id
         WHERE m.type="final" AND
               m.score IS NULL AND
               m.battleId IS NULL AND
               m.playedAt IS NULL AND
               s.id=:seasonId AND
               m.updatedAt<:date`,
        { replacements: { seasonId: currentSeason.id, date: dateTwoDaysAgo.format('YYYY-MM-DD HH:mm:ss') } }
    );

    let count = 0;

    const sendEmail = (params) => {
        const { emails, finalSpot, opponentName, opponentEmail, opponentPhone, subject, roundsTotal } = params;

        const html = finalMatchScheduleTemplate(config, {
            seasonEndDate: currentSeason.endDate,
            finalSpot,
            opponentName,
            opponentEmail,
            opponentPhone,
            roundsTotal,
        });

        // the final match reminder is not suitable (too late etc.)
        if (!html) {
            return;
        }

        app.service('api/emails').create({
            to: emails,
            subject,
            html,
            priority: 2,
        });

        count++;
    };

    for (const match of matches) {
        // Check if already sent the reminder
        const ACTION_NAME = 'sendFinalScheduleReminder';
        if (await isActionDone(sequelize, ACTION_NAME, match.id)) {
            continue;
        }

        const [[firstMatch]] = await sequelize.query(
            `
            SELECT m.finalSpot
              FROM matches AS m,
                   players AS p
             WHERE (m.challengerId=p.id || m.acceptorId=p.id) AND
                   m.type="final" AND
                   m.battleId IS NULL AND
                   p.tournamentId=:tournamentId
          ORDER BY m.finalSpot DESC
             LIMIT 0, 1`,
            { replacements: { tournamentId: match.tournamentId } }
        );
        const roundsTotal = firstMatch.finalSpot > 7 ? 4 : 3;

        const challengerName = `${match.challengerFirstName} ${match.challengerLastName}`;
        const acceptorName = `${match.acceptorFirstName} ${match.acceptorLastName}`;

        const isRoundOf16 = match.finalSpot > 7;
        const isQuarterFinal = match.finalSpot <= 7 && match.finalSpot > 3;
        const isSemiFinal = match.finalSpot <= 3 && match.finalSpot > 1;
        const stage = isRoundOf16
            ? 'Round of 16'
            : isQuarterFinal
              ? 'Quarterfinal'
              : isSemiFinal
                ? 'Semifinal'
                : 'Final';

        const subject = `Have You Scheduled Your ${stage} Match?`;

        // sending to challenger
        sendEmail({
            emails: [{ name: challengerName, email: match.challengerEmail }],
            finalSpot: match.finalSpot,
            opponentName: acceptorName,
            opponentEmail: match.acceptorEmail,
            opponentPhone: match.acceptorPhone,
            subject,
            roundsTotal,
        });

        // sending to acceptor
        sendEmail({
            emails: [{ name: acceptorName, email: match.acceptorEmail }],
            finalSpot: match.finalSpot,
            opponentName: challengerName,
            opponentEmail: match.challengerEmail,
            opponentPhone: match.challengerPhone,
            subject,
            roundsTotal,
        });

        await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:matchId, :name)`, {
            replacements: { matchId: match.id, name: ACTION_NAME },
        });
    }

    if (count > 0) {
        logger.info(`Schedule final match reminder sent to ${count} users`);
    }
};

export const generateWordCloud = async (app: Application) => {
    const sequelize = app.get('sequelizeClient');

    const [[settings]] = await sequelize.query(`SELECT wordcloudUrl FROM settings`);
    if (settings.wordcloudUrl) {
        const isMonday = dayjs.tz().isoWeekday() === 1;
        if (!isMonday) {
            return;
        }
    }

    const [users] = await sequelize.query(`SELECT id, firstName FROM users`);
    const usersObj = users.reduce((obj, item) => {
        obj[item.id] = item;
        return obj;
    }, {});

    const dateYearAgo = dayjs.tz().subtract(1, 'year').format('YYYY-MM-DD HH:mm:ss');
    const [matches] = await sequelize.query(`SELECT pc.userId AS challengerUserId,
           pa.userId AS acceptorUserId,
           pc2.userId AS challenger2UserId,
           pa2.userId AS acceptor2UserId
      FROM matches AS m
      JOIN players AS pc ON m.challengerId=pc.id
      JOIN players AS pa ON m.acceptorId=pa.id
      LEFT JOIN players AS pc2 ON m.challenger2Id=pc2.id
      LEFT JOIN players AS pa2 ON m.acceptor2Id=pa2.id
     WHERE ${getStatsMatches('m')} AND
           m.playedAt>"${dateYearAgo}"`);

    const result = {};
    const addUser = (id) => {
        if (!id || !usersObj[id]) {
            return;
        }

        if (result[id]) {
            result[id].size++;
        } else {
            result[id] = {
                id,
                text: usersObj[id].firstName,
                size: 1,
            };
        }
    };
    for (const match of matches) {
        addUser(match.challengerUserId);
        addUser(match.challenger2UserId);
        addUser(match.acceptorUserId);
        addUser(match.acceptor2UserId);
    }

    const list = Object.values(result)
        .sort((a, b) => b.size - a.size)
        .slice(0, 1000);
    if (list.length < 150) {
        // not enough players
        return;
    }

    const words = {};
    list.forEach((item) => {
        let key = item.text;
        let counter = 1;
        while (words[key]) {
            key = item.text + ' '.repeat(counter++);
        }

        words[key] = item.size;
    });

    const response = await invokeLambda('generateWordcloud', {
        useTempFolder: process.env.TL_ENV !== 'production',
        words,
    });

    const url = response.data.src;

    await sequelize.query('UPDATE settings SET wordcloudUrl=:url, wordcloudCreatedAt=:date', {
        replacements: { url, date: dayjs.tz().format('YYYY-MM-DD HH:mm:ss') },
    });

    logger.info(`Wordcloud generated with ${list.length} players`);
};

export const sendMissingTeammateReminder = async (app: Application) => {
    const sequelize = app.get('sequelizeClient');
    const config = await getCombinedConfig();

    const ACTION_NAME = 'sendNoTeammateReminder';

    const currentDate = dayjs.tz();
    const dateThreeDaysAgo = currentDate.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss');
    const dateTwoWeeksAgo = currentDate.subtract(2, 'week').format('YYYY-MM-DD HH:mm:ss');

    // Get the season
    const [[seasonToRegister]] = await sequelize.query(`SELECT * FROM seasons WHERE endDate>:date ORDER BY createdAt`, {
        replacements: { date: currentDate.add(1, 'week').format('YYYY-MM-DD HH:mm:ss') },
    });
    if (!seasonToRegister) {
        return;
    }

    // Get already reminders sent
    const [rows] = await sequelize.query(`SELECT tableId FROM actions WHERE name=:name`, {
        replacements: { name: ACTION_NAME },
    });
    const captainsWithReminders = new Set(rows.map((item) => item.tableId));

    const [players] = await sequelize.query(
        `
        SELECT p.id AS playerId,
               p.partnerId,
               p.createdAt,
               u.firstName,
               u.lastName,
               u.email
          FROM players AS p,
               users AS u,
               tournaments AS t,
               levels AS l
         WHERE p.userId=u.id AND
               p.tournamentId=t.id AND
               t.levelId=l.id AND
               l.type="doubles-team" AND
               t.seasonId=:seasonId AND
               p.isActive=1`,
        { replacements: { seasonId: seasonToRegister.id } }
    );
    const captainsWithTeammate = new Set(players.map((item) => item.partnerId));
    const captainsWithoutTeammate = players.filter((item) => {
        if (item.partnerId) {
            return false;
        }
        if (captainsWithReminders.has(item.playerId)) {
            return false;
        }
        if (captainsWithTeammate.has(item.playerId)) {
            return false;
        }
        if (item.createdAt < dateTwoWeeksAgo || item.createdAt > dateThreeDaysAgo) {
            return false;
        }

        return true;
    });

    for (const captain of captainsWithoutTeammate) {
        const joinDoublesLink = await getJoinDoublesLink(captain.playerId, app);

        await app.service('api/emails').create({
            to: [getEmailContact(captain)],
            subject: `Captain! Your Doubles Team Still Needs Players!`,
            html: getCustomEmail({
                config,
                compose: ({ h2, signature }) => `
${h2('Good day, #firstName#!', 'padding-top="10px"')}
<mj-text>Your Doubles Team still needs more players to complete your team's setup. Remember, every captain needs their crew! Here are three options you can take right now:</mj-text>
<mj-text>
    <ol style="margin: 0 !important; padding-top: 0px; padding-bottom: 0px;">
        <li style="margin-bottom: 10px;"><b>Invite people you know.</b> You can invite up to 2 teammates to your team by having them join through this link:<br><a href="${joinDoublesLink}">${joinDoublesLink}</a></li>
        <li style="margin-bottom: 10px;"><b>Add teammates from the Player Pool.</b> The Player Pool contains players who are actively looking to join or create a new team. Review their information and add them to your team from the <b>Overview</b> page of your Doubles ladder.</li>
        <li style="margin-bottom: 0px;"><b>Join the Player Pool yourself.</b> Did the person you initially invited not sign up? No problem! Join the Player Pool, and other Team Captains can add you to their team.</li>
    </ol>
</mj-text>

${h2('Thanks for Joining Doubles!')}
<mj-text>Thanks for playing Doubles with us this season! Feel free to reach out if you have any other questions or need help coordinating your team!</mj-text>
${signature({ config })}
`,
            }),
        });

        await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:playerId, :name)`, {
            replacements: { playerId: captain.playerId, name: ACTION_NAME },
        });
    }

    logger.info(`Reminder for captains without teammates sent to ${captainsWithoutTeammate.length} players`);
};

export const sendHighProjectedTlrWarning = async (app: Application) => {
    const sequelize = app.get('sequelizeClient');
    const config = await getCombinedConfig();
    const { players } = sequelize.models;
    const { TL_URL } = process.env;

    // Get the season
    const currentDate = dayjs.tz();
    const dateInTwoWeeks = currentDate.add(2, 'week').format('YYYY-MM-DD HH:mm:ss');
    const [[currentSeason]] = await sequelize.query(
        `SELECT * FROM seasons WHERE startDate<:currentDate AND endDate>:dateInTwoWeeks`,
        { replacements: { currentDate: currentDate.format('YYYY-MM-DD HH:mm:ss'), dateInTwoWeeks } }
    );
    if (!currentSeason) {
        return;
    }

    // Get already reminders sent
    const ACTION_NAME = 'highProjectedTlrWarning';
    const [rows] = await sequelize.query(`SELECT tableId FROM actions WHERE name=:name`, {
        replacements: { name: ACTION_NAME },
    });
    const usersWithReminders = new Set(rows.map((item) => item.tableId));

    const [matches] = await sequelize.query(
        `
        SELECT uc.id AS challengerUserId,
               uc.email AS challengerEmail,
               uc.firstName AS challengerFirstName,
               uc.lastName AS challengerLastName,
               ua.id AS acceptorUserId,
               ua.email AS acceptorEmail,
               ua.firstName AS acceptorFirstName,
               ua.lastName AS acceptorLastName,
               m.challengerId,
               m.acceptorId,
               m.challengerElo,
               m.challengerMatches,
               m.acceptorElo,
               m.acceptorMatches,
               l.slug AS levelSlug,
               l.name AS levelName,
               l.baseTlr AS levelBaseTlr,
               l.maxTlr AS levelMaxTlr
          FROM players AS p,
               tournaments AS t,
               levels AS l,
               matches AS m
          JOIN players AS pc ON m.challengerId=pc.id
          JOIN players AS pa ON m.acceptorId=pa.id
          JOIN users AS uc ON pc.userId=uc.id
          JOIN users AS ua ON pa.userId=ua.id
         WHERE m.challengerId=p.id AND
               p.tournamentId=t.id AND
               t.seasonId=:seasonId AND
               t.levelId=l.id AND
               ${getStatsMatches('m')} AND
               m.challenger2Id IS NULL
      ORDER BY m.playedAt DESC`,
        { replacements: { seasonId: currentSeason.id } }
    );

    const [levels] = await sequelize.query(
        `
        SELECT l.id,
               l.name,
               l.slug,
               l.baseTlr,
               t.id AS tournamentId
          FROM tournaments AS t,
               levels AS l
         WHERE t.levelId=l.id AND
               l.type="single" AND
               l.baseTlr IS NOT NULL AND
               t.seasonId=:seasonId
      ORDER BY l.baseTlr`,
        { replacements: { seasonId: currentSeason.id } }
    );

    // populate level gender
    for (const level of levels) {
        level.gender = level.slug.includes('women') ? 'women' : 'men';
    }

    const nextLevels = levels.reduce((obj, item) => {
        const nextLevel = levels.find((level) => level.gender === item.gender && level.baseTlr > item.baseTlr);
        if (nextLevel) {
            obj[item.slug] = nextLevel;
        }
        return obj;
    }, {});

    const proccessedPlayers = new Set();
    let total = 0;
    const processPlayer = async ({ player, elo, totalMatches, levelSlug, levelName, levelBaseTlr, levelMaxTlr }) => {
        if (usersWithReminders.has(player.userId) || proccessedPlayers.has(player.userId)) {
            return;
        }
        proccessedPlayers.add(player.userId);

        if (totalMatches >= config.minMatchesToEstablishTlr) {
            return;
        }

        const multiplier = projectedTlrMultipliers[totalMatches];
        if (!multiplier) {
            return;
        }
        const projectedTlr = levelBaseTlr + (elo - levelBaseTlr) * multiplier;
        if (projectedTlr > levelMaxTlr) {
            total++;

            const nextLevel = nextLevels[levelSlug];
            let alreadyInNextLevel = false;
            let addedToNextLevel = false;
            if (nextLevel) {
                const nextLevelPlayer = await players.findOne({
                    where: { userId: player.userId, tournamentId: nextLevel.tournamentId },
                });
                if (nextLevelPlayer) {
                    alreadyInNextLevel = true;
                } else {
                    await players.create({ userId: player.userId, tournamentId: nextLevel.tournamentId });
                    addedToNextLevel = true;
                }
            }

            await app.service('api/emails').create({
                to: [getEmailContact(player)],
                subject: `You're Ready for a Stronger Ladder!`,
                html: getCustomEmail({
                    config,
                    compose: ({ h2, signature }) => `
            ${h2('Hello, #firstName#!', 'padding-top="10px"')}
            <mj-text>First of all, thank you so much for joining Rival Tennis Ladder! We really appreciate you!</mj-text>
            <mj-text>We're writing you today regarding your chosen level and where we think you should play.</mj-text>

            ${h2('Playing to a Stronger Ladder')}
            <mj-text>We've been watching your recent matches and using them to calculate your <a href="${TL_URL}/tlr">Tennis Ladder Rating (TLR)</a> behind the scenes. Based on these calculations and your current trajectory, we believe you're already <b>too strong for the ${levelName} ladder</b>.</mj-text>
            <mj-text>Here's what that means for you:</mj-text>
            <mj-text>
                <ul style="margin: 0 !important; padding-top: 0px; padding-bottom: 0px;">
                    ${
                        addedToNextLevel
                            ? `<li style="margin-bottom: 10px;"><b>We are adding you to the ${nextLevel.name} ladder.</b> Rather than having you move manually, we are automatically placing you on the higher ladder that's more in line with your level. Beginning immediately, you can start playing matches on that ladder.</li>`
                            : ''
                    }
                    ${
                        alreadyInNextLevel
                            ? `<li style="margin-bottom: 10px;"><b>We recommend that you play on the ${nextLevel.name} ladder.</b> Since you're already in the ${nextLevel.name} ladder, we suggest playing here primarily instead. Here, we believe you will find the best matches for your level.</li>`
                            : ''
                    }
                    <li style="margin-bottom: 0px;"><b>You may be restricted from the ${levelName} Final Tournament.</b> While you can still play matches on the ${levelName}, you may not be eligible for the Final Tournament at the end of the season on that ladder. We will base your eligibility on your projected rating at that time.</li>
                </ul>
            </mj-text>
            <mj-text>Overall, we are making this adjustment to ensure you're on the ladder that aligns you with the most players of an equivalent skill level. As you play, your rating will change, and each season you will have an opportunity to choose the ladder that best fits your current rating.</mj-text>

            ${h2('Thanks for Playing!')}
            <mj-text>Once again, thank you so much for joining Rival Tennis Ladder! If you have any questions about your level or the ladder in general, feel free to reach out to us! We're always happy to discuss the ladder, hear your feedback, and make changes that serve our community.</mj-text>

            ${signature({ config })}
            `,
                }),
            });

            await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:userId, :name)`, {
                replacements: { userId: player.userId, name: ACTION_NAME },
            });
        }
    };

    for (const match of matches) {
        await processPlayer({
            player: {
                userId: match.challengerUserId,
                email: match.challengerEmail,
                firstName: match.challengerFirstName,
                lastName: match.challengerLastName,
            },
            elo: match.challengerElo,
            totalMatches: match.challengerMatches,
            levelSlug: match.levelSlug,
            levelName: match.levelName,
            levelBaseTlr: match.levelBaseTlr,
            levelMaxTlr: match.levelMaxTlr,
        });
        await processPlayer({
            player: {
                userId: match.acceptorUserId,
                email: match.acceptorEmail,
                firstName: match.acceptorFirstName,
                lastName: match.acceptorLastName,
            },
            elo: match.acceptorElo,
            totalMatches: match.acceptorMatches,
            levelSlug: match.levelSlug,
            levelName: match.levelName,
            levelBaseTlr: match.levelBaseTlr,
            levelMaxTlr: match.levelMaxTlr,
        });
    }

    if (total > 0) {
        logger.info(`Warning for high projected TLR sent to ${total} players`);
    }
};

export default async (app: Application) => {
    const runAction = async (fn) => {
        try {
            await fn(app);
        } catch (e) {
            if (e.errors) {
                logger.info(`Action errors: ${JSON.stringify(e.errors)}`);
            }
        }
    };

    await runAction(remindForTournament);
    await runAction(lastDayRemindForTournament);
    await runAction(remindForFirstDay);
    await runAction(remindForActivity);
    await runAction(remindForChoosingLadder);
    await runAction(seasonIsOver);
    await runAction(joinNextSeason);
    await runAction(remindForClaimingReward);
    await runAction(generateWordCloud);
    await runAction(sendFinalScheduleReminder);
    await runAction(requestFeedbackForNoJoin);
    await runAction(switchToPercentReferral);
    await runAction(sendMissingTeammateReminder);
    await runAction(sendHighProjectedTlrWarning);
};
