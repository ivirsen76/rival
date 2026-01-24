import type { HookContext } from '@feathersjs/feathers';
import { NotFound, Unprocessable } from '@feathersjs/errors';
import dayjs from '../../utils/dayjs';
import { revertScore } from '../matches/helpers';
import { keep } from 'feathers-hooks-common';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import validate from './validate';
import _isEmpty from 'lodash/isEmpty';
import { throwValidationErrors, isEmail } from '../../helpers';
import { hasAnyRole, purgeTournamentCache, sendWelcomeEmail, logEvent } from '../commonHooks';
import yup from '../../packages/yup';
import { getSchemaErrors } from '../../helpers';
import changeLevelNotificationTemplate from '../../emailTemplates/changeLevelNotification';
import arbitraryMessageTemplate from '../../emailTemplates/arbitraryMessage';
import firstDayReminderTemplate from '../../emailTemplates/firstDayReminder';
import { getEmailsFromList } from '../settings/helpers';
import { getSeasonName } from '../seasons/helpers';
import publishStats from '../../utils/publishStats';
import formatElo from '../../utils/formatElo';
import { getEmailContact, getPlayerName, getEstablishedElo, getEmailLink, getPhoneLink } from '../users/helpers';
import specialReasonNotificationTemplate from '../../emailTemplates/specialReasonNotification';
import getCustomEmail from '../../emailTemplates/getCustomEmail';
import { getStatsMatches } from '../../utils/sqlConditions';
import {
    teamNames,
    sendDoublesTeamInvitation,
    sendAcceptedTeammateMessage,
    sendNewPoolPlayerMessage,
    formatTeamName,
    getPlayersUpdates,
    splitAddress,
} from './helpers';
import { decodeAction } from '../../utils/action';
import { POOL_PARTNER_ID } from '../../constants';
import seedrandom from 'seedrandom';
import axios from 'axios';
import type { User } from '../../types';

const validatePatch = () => (context: HookContext) => {
    const errors = validate(context.data);

    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    return context;
};

const checkIfCurrentUser = () => async (context: HookContext) => {
    const currentUser = context.params.user as User;
    const playerId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { players } = sequelize.models;

    const player = await players.findByPk(playerId);
    if (!player) {
        throw new Unprocessable('There is no player.');
    }
    if (!player.isActive) {
        throw new Unprocessable('The player is no longer available for matches.');
    }
    if (player.userId !== currentUser.id) {
        throw new Unprocessable('Wrong user.');
    }

    // Check if tournament is open
    const [result] = await sequelize.query(
        `SELECT s.startDate,
                s.endDate,
                s.id AS seasonId,
                l.type AS levelType
           FROM tournaments AS t,
                seasons AS s,
                levels AS l
          WHERE t.seasonId=s.id AND
                t.levelId=l.id AND
                t.id=:id`,
        { replacements: { id: player.tournamentId } }
    );
    const { startDate, endDate, seasonId, levelType } = result[0];
    if (dayjs.tz().isBefore(dayjs.tz(startDate)) || dayjs.tz().isAfter(dayjs.tz(endDate))) {
        throw new Unprocessable('The season has already ended.');
    }

    // Check if the player is already in different tournament
    if (context.data.readyForFinal === 1) {
        const [counts] = await sequelize.query(
            `SELECT count(*) AS cnt
               FROM players AS p,
                    tournaments AS t,
                    levels AS l
              WHERE p.tournamentId=t.id AND
                    t.levelId=l.id AND
                    p.userId=:userId AND
                    p.readyForFinal=1 AND
                    t.seasonId=:seasonId AND
                    p.id!=:playerId AND
                    l.type=:levelType`,
            {
                replacements: { playerId, userId: player.userId, seasonId, levelType },
            }
        );
        if (counts[0].cnt > 0) {
            throw new Unprocessable('You are already participating in the different tournament');
        }
    }

    return context;
};

const populateEloHistory = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const userId = Number(context.params.query.userId);
    const { config } = context.params;

    const getBeatTooltip = ({ currentElo, currentEloChange, winner, looser, score, levelName }) => {
        const signed = (num) => (num >= 0 ? `+${formatElo(num)}` : `-${formatElo(-num)}`);

        return `
<p class="mb-2"><b>${formatElo(currentElo)}</b> (${signed(currentEloChange)})</p>
<p class="mb-2">${getPlayerName(winner)} (${winner.elo < 0 ? '?' : formatElo(winner.elo)}) beat<br>
${getPlayerName(looser)} (${looser.elo < 0 ? '?' : formatElo(looser.elo)})</p>
${score}
<div class="mt-2">${levelName}</div>
`;
    };

    let allUsers;
    {
        const [users] = await sequelize.query('SELECT id, firstName, lastName FROM users');
        allUsers = users.reduce((obj, item) => {
            obj[item.id] = item;
            return obj;
        }, {});
    }

    const query = `
        SELECT m.id,
               m.challengerId,
               m.acceptorId,
               m.challengerElo,
               m.acceptorElo,
               m.challengerEloChange,
               m.acceptorEloChange,
               m.challengerMatches,
               m.acceptorMatches,
               pc.userId AS challengerUserId,
               pa.userId AS acceptorUserId,
               m.winner,
               m.score,
               m.playedAt,
               t.seasonId,
               l.name AS levelName
          FROM matches AS m
          JOIN players AS pc ON m.challengerId=pc.id
          JOIN players AS pa ON m.acceptorId=pa.id
          JOIN tournaments AS t ON pc.tournamentId=t.id
          JOIN levels AS l ON t.levelId=l.id AND l.baseTlr IS NOT NULL AND l.type="single"
         WHERE ${getStatsMatches('m')} AND
               (pc.userId=${userId} OR pa.userId=${userId})
      ORDER BY m.playedAt, m.id
         LIMIT ${config.minMatchesToEstablishTlr - 1}, 1000000
    `;
    const [result] = await sequelize.query(query);

    const eloHistory = [];
    for (const match of result) {
        const prevChallengerElo =
            match.challengerMatches <= config.minMatchesToEstablishTlr
                ? -9999
                : match.challengerElo - match.challengerEloChange;
        const prevAcceptorElo =
            match.acceptorMatches <= config.minMatchesToEstablishTlr
                ? -9999
                : match.acceptorElo - match.acceptorEloChange;

        const currentElo = match.challengerUserId === userId ? match.challengerElo : match.acceptorElo;
        const currentEloChange =
            match.challengerUserId === userId ? match.challengerEloChange : match.acceptorEloChange;

        const tooltip =
            match.challengerId === match.winner
                ? getBeatTooltip({
                      currentElo,
                      currentEloChange,
                      winner: {
                          ...allUsers[match.challengerUserId],
                          elo: prevChallengerElo,
                      },
                      looser: {
                          ...allUsers[match.acceptorUserId],
                          elo: prevAcceptorElo,
                      },
                      score: match.score,
                      playedAt: match.playedAt,
                      levelName: match.levelName,
                  })
                : getBeatTooltip({
                      currentElo,
                      currentEloChange,
                      winner: {
                          ...allUsers[match.acceptorUserId],
                          elo: prevAcceptorElo,
                      },
                      looser: {
                          ...allUsers[match.challengerUserId],
                          elo: prevChallengerElo,
                      },
                      score: revertScore(match.score),
                      playedAt: match.playedAt,
                      levelName: match.levelName,
                  });

        eloHistory.push({
            fullDate: match.playedAt,
            date: dayjs.tz(match.playedAt).format('ll') + `(${match.id})`,
            value: currentElo,
            diff: currentEloChange,
            tooltip,
            isWin:
                match.challengerUserId === userId
                    ? match.challengerId === match.winner
                    : match.acceptorId === match.winner,
            seasonId: match.seasonId,
        });
    }

    if (eloHistory.length > 0) {
        eloHistory[0].tooltip = `<b>${formatElo(eloHistory[0].value)}</b> - Initial TLR`;
    }

    context.result = { eloHistory };

    return context;
};

const sendFirstDayEmail =
    ({ userIds }) =>
    async (context: HookContext) => {
        const sequelize = context.app.get('sequelizeClient');
        const { config } = context.params;

        // Get current season
        const currentDate = dayjs.tz();
        const [[currentSeason]] = await sequelize.query(
            `SELECT * FROM seasons WHERE startDate<:date AND endDate>:date`,
            { replacements: { date: currentDate.format('YYYY-MM-DD HH:mm:ss') } }
        );
        if (!currentSeason) {
            return;
        }

        const daysSinceSeasonStart = currentDate.diff(dayjs.tz(currentSeason.startDate), 'day', true);
        const isFirstDay = daysSinceSeasonStart < 1;

        // Get all users who already got the email
        const [multiLadderUsers] = await sequelize.query(
            `SELECT u.id,
                    count(*) AS cnt
               FROM users AS u,
                    players AS p,
                    tournaments AS t
              WHERE u.id=p.userId AND
                    p.tournamentId=t.id AND
                    t.seasonId=:seasonId
           GROUP BY u.id
             HAVING cnt>1`,
            { replacements: { seasonId: currentSeason.id } }
        );

        const multiLadderUserIds = multiLadderUsers.map((item) => item.id);
        const sendUserIds = userIds.filter((id) => !multiLadderUserIds.includes(id));

        if (sendUserIds.length === 0) {
            return;
        }

        const [users] = await sequelize.query(
            `SELECT firstName,
                    lastName,
                    email
               FROM users
              WHERE id IN (${sendUserIds.join(',')})`
        );
        const seasonName = getSeasonName(currentSeason);

        context.app.service('api/emails').create({
            to: users.map(getEmailContact),
            subject: isFirstDay
                ? `The ${config.city} ${seasonName} Ladder Begins Today!`
                : 'You Can Now Start Playing on the Ladder!',
            html: firstDayReminderTemplate({ config, currentSeason, isFirstDay }),
            priority: 2,
        });

        return context;
    };

const batchAddPlayers = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['admin', 'manager'])(context);

    // Validate data
    {
        const schema = yup.object().shape({
            tournamentId: yup.number().required().integer().min(1),
            users: yup
                .array(yup.number().required().integer().min(1))
                .required()
                .min(1, 'Must be at least one player.')
                .max(1000),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const { tournamentId, users } = context.data;
    const sequelize = context.app.get('sequelizeClient');
    const { players } = sequelize.models;

    // check if we have the tournament and it's not closed
    {
        const [rows] = await sequelize.query(
            `
            SELECT s.endDate
              FROM tournaments AS t,
                   seasons AS s
             WHERE t.seasonId=s.id AND
                   t.id=:tournamentId
        `,
            { replacements: { tournamentId } }
        );

        if (rows.length !== 1) {
            throw new Unprocessable('The ladder is not found');
        }
        if (dayjs.tz().isAfter(dayjs.tz(rows[0].endDate))) {
            throw new Unprocessable('The season has already ended.');
        }
    }

    // Check if we have all users
    {
        const [rows] = await sequelize.query(
            `
            SELECT id
              FROM users
             WHERE id IN (${users.join(',')})
        `
        );
        if (rows.length !== users.length) {
            throw new Unprocessable('The user list is incorrect');
        }
    }

    // Add players
    {
        const addedUserIds = [];
        for (const userId of users) {
            const [rows] = await sequelize.query(
                `
                SELECT id
                  FROM players
                 WHERE userId=:userId AND tournamentId=:tournamentId
            `,
                { replacements: { userId, tournamentId } }
            );

            if (rows.length !== 0) {
                continue;
            }

            addedUserIds.push(userId);

            await players.create({ userId, tournamentId });
            await sendWelcomeEmail({ userId })(context);
        }

        await sendFirstDayEmail({ userIds: addedUserIds })(context);

        logEvent(`Admin added these user ids to tournamentId=${tournamentId}: ${users.join(', ')}`)(context);
    }

    purgeTournamentCache({ tournamentId })(context);

    return context;
};

const registerForFree = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['player'])(context);

    // Validate data
    {
        const schema = yup.object().shape({
            tournaments: yup.array(yup.number().integer().min(1)).required().min(1),
            joinReason: yup.string().max(500),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const { TL_URL } = process.env;
    const { tournaments, joinReason, partners } = context.data;
    const sequelize = context.app.get('sequelizeClient');
    const { players } = sequelize.models;
    const currentUser = context.params.user as User;
    const { config } = context.params;

    // get all user tournaments
    const [userTournaments] = await sequelize.query(`SELECT tournamentId AS id FROM players WHERE userId=:userId`, {
        replacements: { userId: currentUser.id },
    });
    const userTournamentIds = userTournaments.map((item) => item.id);
    const newTournamentIds = tournaments.filter((id) => !userTournamentIds.includes(id));

    // get seasonId
    let season;
    {
        const [rows] = await sequelize.query(
            `
            SELECT s.id,
                   s.endDate,
                   s.isFree
              FROM tournaments AS t,
                   seasons AS s
             WHERE t.seasonId=s.id AND
                   t.id=:tournamentId
        `,
            { replacements: { tournamentId: tournaments[0] } }
        );

        if (rows.length !== 1) {
            throw new Unprocessable('The ladder is not found');
        }
        if (dayjs.tz().isAfter(dayjs.tz(rows[0].endDate))) {
            throw new Unprocessable('The season has already ended.');
        }

        season = rows[0];
    }

    // get season tournaments
    let newDoublesTeamTournamentIds = [];
    let seasonTournamentIds = [];
    {
        const [rows] = await sequelize.query(
            `
            SELECT t.id, l.type AS levelType
              FROM tournaments AS t,
                   levels AS l
             WHERE t.seasonId=:seasonId AND
                   t.levelId=l.id`,
            { replacements: { seasonId: season.id } }
        );
        newDoublesTeamTournamentIds = rows
            .filter((row) => newTournamentIds.includes(row.id) && row.levelType === 'doubles-team')
            .map((row) => row.id);
        seasonTournamentIds = rows.map((row) => row.id);
    }

    // check if all tournaments are from the season
    if (tournaments.some((id) => !seasonTournamentIds.includes(id))) {
        throw new Unprocessable('Ladders are not from the same season');
    }

    for (const tournamentId of newDoublesTeamTournamentIds) {
        const partnerInfo = partners[`partner-${tournamentId}`];

        if (partnerInfo.decision === 'email') {
            const { email1, email2 } = partnerInfo;

            if (!email1) {
                throw new Unprocessable('Partner email is required.');
            } else if (!isEmail(email1)) {
                throw new Unprocessable('Email is wrong.');
            } else if (currentUser.email === email1) {
                throw new Unprocessable('You cannot use your email.');
            }

            if (email2) {
                if (!isEmail(email2)) {
                    throw new Unprocessable('Email is wrong.');
                } else if (currentUser.email === email2) {
                    throw new Unprocessable('You cannot use your email.');
                } else if (email2 === email1) {
                    throw new Unprocessable('Emails are duplicated.');
                }
            }
        } else if (partnerInfo.decision === 'player') {
            const { partnerId } = partnerInfo;
            if (!partnerId || typeof partnerId !== 'number') {
                throw new Unprocessable('Partner is wrong.');
            }
            const partner = await players.findOne({
                where: { id: partnerId, tournamentId, partnerId: POOL_PARTNER_ID, isActive: 1 },
            });
            if (!partner) {
                throw new Unprocessable('The Pool Player is wrong.');
            }
        } else if (partnerInfo.decision !== 'pool') {
            throw new Unprocessable('Decision is wrong.');
        }

        if (['email', 'player'].includes(partnerInfo.decision)) {
            const teamName = partnerInfo.teamName.trim();
            if (!teamName) {
                throw new Unprocessable('Team name is required.');
            } else if (teamName.length < config.teamNameMinLength || teamName.length > config.teamNameMaxLength) {
                throw new Unprocessable(`From ${config.teamNameMinLength} to ${config.teamNameMaxLength} characters.`);
            } else if (!/^[a-zA-Z0-9& -]+$/.test(teamName)) {
                throw new Unprocessable('Only letters, digits, ampersand, dashes, and spaces are allowed.');
            }
        }
    }

    const isUserFirstSeason = userTournamentIds.every((id) => seasonTournamentIds.includes(id));
    if (!season.isFree && !isUserFirstSeason) {
        // checking if the user played matches before
        const [rows] = await sequelize.query(
            `SELECT m.id
               FROM matches AS m,
                    players AS p
              WHERE p.userId=:userId AND
                    p.id NOT IN (${seasonTournamentIds.join(',')}) AND
                    (m.challengerId=p.id OR m.acceptorId=p.id OR m.challenger2Id=p.id OR m.acceptor2Id=p.id) AND
                    m.type="regular" AND
                    ${getStatsMatches('m')}`,
            { replacements: { userId: currentUser.id } }
        );

        if (rows.length >= context.params.config.minMatchesToPay) {
            throw new Unprocessable('You cannot join ladder for free');
        }
    }

    // Add players
    for (const tournamentId of tournaments) {
        let currentPlayer = await players.findOne({ where: { userId: currentUser.id, tournamentId } });
        if (currentPlayer?.isActive) {
            continue;
        }

        const partnerInfo = partners[`partner-${tournamentId}`];
        const joinedToPool = partnerInfo?.decision === 'pool' && newDoublesTeamTournamentIds.includes(tournamentId);
        const params = {
            ...(joinReason ? { joinReason } : {}),
            ...(joinedToPool ? { partnerId: POOL_PARTNER_ID, partnerInfo: partnerInfo.partnerInfo } : {}),
            ...(partnerInfo?.teamName ? { teamName: formatTeamName(partnerInfo.teamName) } : {}),
        };

        if (!currentPlayer) {
            await players.create({
                userId: currentUser.id,
                tournamentId,
                ...params,
            });
            // we need next line as the players.created does not return id for some reason
            currentPlayer = await players.findOne({ where: { userId: currentUser.id, tournamentId } });
            await sendWelcomeEmail({ userId: currentUser.id })(context);
        } else {
            await players.update({ isActive: true, ...params }, { where: { id: currentPlayer.id } });
        }

        if (partnerInfo?.decision === 'player') {
            await players.update({ partnerId: currentPlayer.id }, { where: { id: partnerInfo.partnerId } });
        }

        if (joinReason) {
            const [[settings]] = await sequelize.query(`SELECT * FROM settings WHERE id=1`);
            const elo = await getEstablishedElo({ userId: currentUser.id, config, sequelize });
            const emails = getEmailsFromList(settings.newFeedbackNotification);

            const [[level]] = await sequelize.query(
                `
                SELECT l.*
                  FROM tournaments AS t, levels AS l
                 WHERE t.levelId=l.id AND t.id=:tournamentId`,
                { replacements: { tournamentId } }
            );

            context.app.service('api/emails').create({
                to: emails.map((email) => ({ email })),
                subject: `The player joined wrong ladder because of special reason`,
                html: specialReasonNotificationTemplate({
                    config,
                    userName: getPlayerName(currentUser),
                    profileLink: `${TL_URL}/player/${currentUser.slug}`,
                    joinReason,
                    elo,
                    level: level.name,
                }),
            });
        }

        purgeTournamentCache({ tournamentId })(context);
    }

    await sendDoublesTeamInvitation(context, newTournamentIds, partners);

    return context;
};

const getPossibleTournaments = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const { user, config } = context.params;
    const { seasonId } = context.data;
    const sequelize = context.app.get('sequelizeClient');

    // get active levels
    const activeLevels = new Set();
    {
        const [levels] = await sequelize.query(
            `SELECT l.id,
                    count(*) AS playersCount
                FROM players AS p,
                    tournaments AS t,
                    levels AS l
                WHERE p.tournamentId=t.id AND
                    t.levelId=l.id AND
                    t.seasonId=:seasonId AND
                    l.baseTlr IS NOT NULL AND
                    l.type="single"
            GROUP BY l.id`,
            { replacements: { seasonId } }
        );

        levels
            .filter((level) => level.playersCount >= config.minPlayersForActiveLadder)
            .forEach((level) => {
                activeLevels.add(level.id);
            });
    }

    const [rows] = await sequelize.query(
        `
        SELECT t.id,
               l.id AS levelId,
               l.name,
               l.slug,
               l.type,
               l.baseTlr,
               p.id AS playerId
          FROM levels AS l,
               tournaments AS t
     LEFT JOIN players AS p ON p.tournamentId=t.id AND p.userId=:userId
         WHERE l.id=t.levelId AND
               t.seasonId=:seasonId
      ORDER BY l.position`,
        { replacements: { userId: user.id, seasonId } }
    );

    const tournaments = rows.map((item) => ({
        ...item,
        isActivePlay: activeLevels.has(item.levelId),
        gender: /^Men/i.test(item.name) ? 'male' : /^Women/i.test(item.name) ? 'female' : 'mixed',
    }));

    context.result = { data: tournaments };

    return context;
};

const switchTournament = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    // Validate the data
    {
        const wrongMessage = 'New ladder is required';
        const schema = yup.object().shape({
            from: yup.number().required().integer().min(1),
            to: yup.number().required(wrongMessage).integer(wrongMessage).min(1, wrongMessage),
        });

        const errors = getSchemaErrors(schema, context.data);
        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const { TL_URL } = process.env;
    const { user } = context.params;
    const { from, to } = context.data;
    const sequelize = context.app.get('sequelizeClient');
    const { players, tournaments, levels } = sequelize.models;
    const SWITCH_LADDER_DEADLINE_WEEKS = 2;

    const currentPlayer = await players.findOne({ where: { userId: user.id, tournamentId: from } });
    if (!currentPlayer) {
        throw new Unprocessable("You're not in this ladder.");
    }
    if (!currentPlayer.isActive) {
        throw new Unprocessable("You're not active in this ladder.");
    }
    if (currentPlayer.changedCount > 0) {
        throw new Unprocessable("You've already switched ladder before");
    }

    const [seasons] = await sequelize.query(
        `SELECT s.id,
                s.startDate,
                s.endDate,
                l.name AS levelFrom,
                l.type AS levelType
           FROM tournaments AS t,
                seasons AS s,
                levels AS l
          WHERE t.seasonId=s.id AND
                t.levelId=l.id AND
                t.id=:id`,
        { replacements: { id: from } }
    );
    const { endDate, id: seasonId, levelFrom, levelType } = seasons[0];
    const currentDate = dayjs.tz();
    if (currentDate.isAfter(dayjs.tz(endDate))) {
        throw new Unprocessable('The season is already over.');
    }
    if (dayjs.tz(endDate).diff(currentDate, 'week', true) < SWITCH_LADDER_DEADLINE_WEEKS) {
        throw new Unprocessable('You cannot switch ladders during the last two weeks of the season.');
    }

    // Check if the season is the same
    {
        const nextTournament = await tournaments.findByPk(to, {
            include: [{ model: levels }],
        });

        if (!nextTournament) {
            throw new Unprocessable('There is no desired ladder.');
        }

        if (nextTournament.seasonId !== seasonId) {
            throw new Unprocessable('The season is not the same.');
        }

        if (nextTournament.level.type !== levelType) {
            // check if the player is playing for free
            const [result] = await sequelize.query(
                `SELECT count(*) AS cnt
                   FROM payments
                  WHERE userId=:userId AND
                        type="product"`,
                { replacements: { userId: user.id } }
            );
            const isPlayingForFree = result[0].cnt === 0;

            if (!isPlayingForFree) {
                throw new Unprocessable('You cannot switch from doubles to singles and vice versa.');
            }
        }
    }

    const nextPlayer = await players.findOne({ where: { userId: user.id, tournamentId: to } });
    if (nextPlayer) {
        throw new Unprocessable("You're already in this ladder.");
    }

    // Check if we have matches played for the old tournament
    const [matches] = await sequelize.query(
        `
            SELECT id
              FROM matches
             WHERE score IS NOT NULL AND
                   unavailable=0 AND
                   (challengerId=:playerId || acceptorId=:playerId)`,
        { replacements: { playerId: currentPlayer.id } }
    );
    if (matches.length === 0) {
        // remove old player and all proposals
        await sequelize.query(`DELETE FROM matches WHERE challengerId=:playerId || acceptorId=:playerId`, {
            replacements: { playerId: currentPlayer.id },
        });
        await sequelize.query(`DELETE FROM players WHERE id=:playerId`, {
            replacements: { playerId: currentPlayer.id },
        });
    } else {
        await sequelize.query(
            `
                UPDATE players
                   SET isActive=0,
                       readyForFinal=0
                 WHERE userId=:userId AND tournamentId=:tournamentId`,
            { replacements: { userId: user.id, tournamentId: from } }
        );
    }

    await sequelize.query(
        `
        INSERT INTO players (userId, tournamentId, changedCount)
             VALUES (:userId, :tournamentId, :count)`,
        { replacements: { userId: user.id, tournamentId: to, count: currentPlayer.changedCount + 1 } }
    );

    await purgeTournamentCache({ tournamentId: from })(context);
    await purgeTournamentCache({ tournamentId: to })(context);

    // Send notification
    {
        const [[settings]] = await sequelize.query(`SELECT changeLevelNotification FROM settings WHERE id=1`);

        const fullName = getPlayerName(user);
        const [rows] = await sequelize.query(
            `SELECT l.name AS levelTo
               FROM tournaments AS t,
                    levels AS l
              WHERE t.levelId=l.id AND
                    t.id=:id`,
            { replacements: { id: to } }
        );
        const { levelTo } = rows[0];

        logEvent(`User switched level from ${levelFrom} to ${levelTo}`)(context);

        const emails = getEmailsFromList(settings.changeLevelNotification);
        if (emails.length > 0) {
            context.app.service('api/emails').create({
                to: emails.map((item) => ({ email: item })),
                subject: `${fullName} switched level from ${levelFrom} to ${levelTo}`,
                html: changeLevelNotificationTemplate({
                    config: context.params.config,
                    userName: fullName,
                    userEmail: user.email,
                    profileLink: `${TL_URL}/player/${user.slug}`,
                    levelFrom,
                    levelTo,
                }),
            });
        }
    }

    return context;
};

const validateRemove = () => async (context: HookContext) => {
    const playerId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { players } = sequelize.models;

    const player = await players.findByPk(playerId);
    if (!player) {
        throw new Unprocessable('There is no player.');
    }

    // Check if tournament is open
    {
        const [rows] = await sequelize.query(
            `
            SELECT s.endDate
              FROM tournaments AS t,
                   seasons AS s
             WHERE t.seasonId=s.id AND
                   t.id=:tournamentId`,
            { replacements: { tournamentId: player.tournamentId } }
        );
        if (dayjs.tz().isAfter(dayjs.tz(rows[0].endDate))) {
            throw new Unprocessable('The season has already ended.');
        }
    }

    // Check if the player has some activity
    {
        const [rows] = await sequelize.query(
            `
            SELECT id
              FROM matches
             WHERE challengerId=:playerId OR
                   acceptorId=:playerId`,
            { replacements: { playerId } }
        );
        if (rows.length > 0) {
            throw new Unprocessable('You cannot remove an active player.');
        }
    }

    context.params.tournamentId = player.tournamentId;

    logEvent(`Admin removed userId ${player.userId} from the tournamentId ${player.tournamentId}`)(context);

    return context;
};

const claimReward = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['player'])(context);

    // Validate the data
    {
        const schema = yup.object().shape({
            address: yup.string().max(200),
            rewardType: yup.string().required().oneOf(['credit', 'gift']),
        });

        const errors = getSchemaErrors(schema, context.data);
        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const { config } = context.params;
    const playerId = Number(context.id);
    const { address, rewardType } = context.data;
    const currentUser = context.params.user as User;

    const sequelize = context.app.get('sequelizeClient');
    const { players, users, payments } = sequelize.models;

    const player = await players.findByPk(playerId);
    if (!player) {
        throw new Unprocessable('There is no player.');
    }
    if (player.userId !== currentUser.id) {
        throw new Unprocessable('You are not this player.');
    }
    if (player.address !== null) {
        throw new Unprocessable("You've already claimed your reward");
    }

    const { tournamentId } = player;
    let levelName;
    let levelType;
    let isFree;

    // check season
    {
        const [[row]] = await sequelize.query(
            `
            SELECT s.endDate,
                   s.isFree,
                   l.name AS levelName,
                   l.type AS levelType
              FROM players AS p, tournaments AS t, seasons AS s, levels AS l
             WHERE p.tournamentId=t.id AND
                   t.seasonId=s.id AND
                   t.levelId=l.id AND
                   p.id=:playerId`,
            { replacements: { playerId } }
        );
        levelName = row.levelName;
        levelType = row.levelType;
        isFree = Boolean(row.isFree);
        const diff = dayjs.tz().diff(dayjs.tz(row.endDate), 'day', true);

        if (diff < 0) {
            throw new Unprocessable('The season is not over');
        }
        if (diff > 10 * 7) {
            throw new Unprocessable('It is too late to get a reward');
        }
    }

    const [[finalMatch]] = await sequelize.query(
        `SELECT m.*
           FROM matches AS m
           JOIN players AS p ON m.challengerId=p.id AND p.tournamentId=:tournamentId
          WHERE m.type="final" AND
                m.finalSpot=1 AND
                m.battleId IS NULL AND
                m.score IS NOT NULL`,
        { replacements: { tournamentId } }
    );
    if (!finalMatch) {
        throw new Unprocessable('There is no final match');
    }

    const isDoublesTeam = levelType === 'doubles-team';
    const winnerPlayer = await players.findByPk(finalMatch.winner);
    if (isDoublesTeam) {
        if (playerId !== winnerPlayer.id && playerId !== winnerPlayer.partnerId) {
            throw new Unprocessable('You cannot claim a reward.');
        }
    } else if (playerId !== finalMatch.challengerId && playerId !== finalMatch.acceptorId) {
        throw new Unprocessable("You haven't played in the final match.");
    }

    const isChampion = isDoublesTeam || finalMatch.winner === playerId;

    await players.update({ address, rewardType }, { where: { id: playerId } });
    await purgeTournamentCache({ tournamentId })(context);

    // verify address and publish stats. Don't wait for that.
    (async () => {
        // don't try to verify incomplete addresses
        if (address.length >= 10) {
            try {
                const response = await axios.post(
                    'https://api.addresszen.com/v1/verify/addresses',
                    { query: address },
                    { params: { api_key: config.addressZenKey } }
                );

                let line1 = response.data.result.address_line_one;
                let line2 = response.data.result.address_line_two;
                if (!line2) {
                    const result = splitAddress(response.data.result.address_line_one);
                    line1 = result.line1;
                    line2 = result.line2;
                }

                const addressVerification = {
                    addressLine1: line1,
                    addressLine2: line2,
                    city: response.data.result.city,
                    state: response.data.result.state,
                    zip: response.data.result.zip_code,
                    confidence: response.data.result.confidence,
                    result: response.data.result.match_information,
                };

                await players.update(
                    { addressVerification: JSON.stringify(addressVerification) },
                    { where: { id: playerId } }
                );
            } catch (e) {
                logEvent(`Wrong address verification: ${address}`)(context);
            }
        }

        await publishStats(context.app);
    })();

    const user = await users.findByPk(player.userId);

    const amount = (() => {
        if (isDoublesTeam) {
            return config.doublesChampionReward;
        }

        if (isFree) {
            return isChampion ? config.singlesChampionReward / 2 : 0;
        }

        return isChampion ? config.singlesChampionReward : config.singlesRunnerUpReward;
    })();

    if (isDoublesTeam) {
        const captainPlayerId = winnerPlayer.partnerId || winnerPlayer.id;
        const [partners] = await sequelize.query(
            `SELECT p.id, p.userId, u.firstName, u.lastName, u.email
               FROM players AS p
               JOIN users AS u ON p.userId=u.id
              WHERE p.id=:captainPlayerId OR
                    p.partnerId=:captainPlayerId`,
            { replacements: { captainPlayerId } }
        );

        const [matches] = await sequelize.query(
            `SELECT m.*
               FROM matches AS m,
                    players AS p
              WHERE m.challengerId=p.id AND
                    p.tournamentId=:tournamentId AND ${getStatsMatches('m')}`,
            { replacements: { tournamentId } }
        );
        const playersWithMatches = matches.reduce((set, match) => {
            set.add(match.challengerId);
            set.add(match.challenger2Id);
            set.add(match.acceptorId);
            set.add(match.acceptor2Id);

            return set;
        }, new Set());

        for (const partner of partners) {
            if (!playersWithMatches.has(partner.id)) {
                continue;
            }

            await payments.create({
                userId: partner.userId,
                type: 'discount',
                description: `Champion award for ${levelName}`,
                amount,
            });
        }

        const captainName = getPlayerName(currentUser);
        const emails = partners
            .filter((partner) => partner.id !== playerId && playersWithMatches.has(partner.id))
            .map(getEmailContact);
        // Do not wait for it
        context.app.service('api/emails').create({
            to: emails,
            subject: `You Got $${config.doublesChampionReward / 100} in Credit for Winning the Tournament!`,
            html: getCustomEmail({
                config,
                compose: ({ h2 }) => `
${h2('Congratulations, #firstName#!', 'padding-top="10px"')}
<mj-text>Since your team won the ${levelName} ladder, your Team Captain (${captainName}) will be receiving an <b>engraved Championship trophy</b> with your name on it! You will get your trophy from them in 2-3 weeks when it arrives.</mj-text>
<mj-text>Also, we've awarded you <b>$${config.doublesChampionReward / 100} credit</b> to your Rival Wallet!</mj-text>
<mj-text>You can use this credit to pay for future Rival seasons!</mj-text>`,
            }),
        });
    } else if (rewardType === 'credit' && amount > 0) {
        await payments.create({
            userId: user.id,
            type: 'discount',
            description: `${isChampion ? 'Champion' : 'Runner-Up'} award for ${levelName}`,
            amount: amount + config.creditRewardBonus,
        });
    }

    // send notification
    {
        context.app.service('api/emails').create({
            to: [{ email: 'info@tennis-ladder.com' }, { email: 'ivirsen@gmail.com' }],
            subject: isChampion ? 'The champion claimed their reward' : 'The runner-up claimed their reward',
            html: arbitraryMessageTemplate({
                config,
                message: `<b>Name:</b> ${getPlayerName(user)}<br>
<b>City:</b> ${config.city}<br>
<b>Ladder:</b> ${levelName}<br>
<b>Status:</b> ${isChampion ? 'Champion' : 'Runner-Up'}<br>
<b>Email:</b> ${user.email}<br>
<b>Reward:</b> ${amount === 0 ? '-' : rewardType === 'credit' ? 'Credit' : 'Gift Card'}<br>
<b>Address:</b> ${address || '-'}`,
            }),
        });
    }

    return context;
};

const purgeRelatedTournaments = () => async (context: HookContext) => {
    const playerId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');

    const [rows] = await sequelize.query(
        `
        SELECT p.userId, t.seasonId
          FROM players AS p, tournaments AS t
         WHERE p.tournamentId=t.id AND p.id=:playerId`,
        { replacements: { playerId } }
    );
    const { userId, seasonId } = rows[0];

    const [tournaments] = await sequelize.query(
        `
        SELECT t.id
          FROM players AS p, tournaments AS t
         WHERE p.tournamentId=t.id AND p.userId=:userId AND t.seasonId=:seasonId`,
        { replacements: { userId, seasonId } }
    );

    for (const tournament of tournaments) {
        await purgeTournamentCache({ tournamentId: tournament.id })(context);
    }

    return context;
};

const activatePlayer = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['admin', 'manager'])(context);

    const playerId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { players } = sequelize.models;

    const player = await players.findByPk(playerId);
    if (!player) {
        throw new Unprocessable('There is no player.');
    }
    if (player.isActive) {
        throw new Unprocessable('Player is already activated.');
    }

    // Check if tournament is open
    {
        const [[row]] = await sequelize.query(
            `
            SELECT s.endDate
              FROM tournaments AS t,
                   seasons AS s
             WHERE t.seasonId=s.id AND
                   t.id=:tournamentId`,
            { replacements: { tournamentId: player.tournamentId } }
        );
        if (dayjs.tz().isAfter(dayjs.tz(row.endDate))) {
            throw new Unprocessable('The season has already ended.');
        }
    }

    await players.update({ isActive: true }, { where: { id: playerId } });

    await purgeTournamentCache({ tournamentId: player.tournamentId })(context);

    logEvent(`Admin activated userId ${player.userId} to the tournamentId ${player.tournamentId}`)(context);

    return context;
};

const deactivatePlayer = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['admin', 'manager'])(context);

    const playerId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { players } = sequelize.models;

    const player = await players.findByPk(playerId);
    if (!player) {
        throw new Unprocessable('There is no player.');
    }

    // Check if tournament is open
    {
        const [[row]] = await sequelize.query(
            `
            SELECT s.endDate
              FROM tournaments AS t,
                   seasons AS s
             WHERE t.seasonId=s.id AND
                   t.id=:tournamentId`,
            { replacements: { tournamentId: player.tournamentId } }
        );
        if (dayjs.tz().isAfter(dayjs.tz(row.endDate))) {
            throw new Unprocessable('The season has already ended.');
        }
    }

    await players.update({ isActive: false, readyForFinal: 0 }, { where: { id: playerId } });

    await purgeTournamentCache({ tournamentId: player.tournamentId })(context);

    logEvent(`Admin deactivated userId ${player.userId} from the tournamentId ${player.tournamentId}`)(context);

    return context;
};

const quitTournament = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['player'])(context);

    const playerId = Number(context.id);
    const currentUser = context.params.user as User;

    const sequelize = context.app.get('sequelizeClient');
    const { players } = sequelize.models;

    const player = await players.findByPk(playerId);
    if (!player) {
        throw new Unprocessable('There is no player.');
    }
    if (player.userId !== currentUser.id) {
        throw new Unprocessable('You are not this player.');
    }
    if (!player.isActive) {
        throw new Unprocessable("You're not active in this ladder.");
    }

    // check season
    {
        const [[row]] = await sequelize.query(
            `
            SELECT s.endDate, l.type AS levelType
              FROM players AS p, tournaments AS t, seasons AS s, levels AS l
             WHERE p.tournamentId=t.id AND
                   t.seasonId=s.id AND
                   t.levelId=l.id AND
                   p.id=:playerId`,
            { replacements: { playerId } }
        );

        const diff = dayjs.tz(row.endDate).diff(dayjs.tz(), 'day', true);
        if (diff < 0) {
            throw new Unprocessable('The season is over');
        }
    }

    // Check if we have matches played
    const [matches] = await sequelize.query(
        `SELECT id
           FROM matches
          WHERE score IS NOT NULL AND
                unavailable=0 AND
                (challengerId=:playerId || acceptorId=:playerId)`,
        { replacements: { playerId } }
    );
    if (matches.length === 0) {
        // remove old player and all proposals
        await sequelize.query(`DELETE FROM matches WHERE challengerId=:playerId || acceptorId=:playerId`, {
            replacements: { playerId },
        });
        await sequelize.query(`DELETE FROM players WHERE id=:playerId`, {
            replacements: { playerId },
        });
    } else {
        await players.update({ isActive: false, readyForFinal: 0 }, { where: { id: playerId } });
    }

    await purgeTournamentCache({ tournamentId: player.tournamentId })(context);

    return context;
};

const setPrediction = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['player'])(context);

    const playerId = Number(context.id);
    const currentUser = context.params.user as User;

    // Validate the data
    {
        const schema = yup.object().shape({
            prediction: yup
                .array(
                    yup.object({
                        finalSpot: yup.number().min(1).max(15),
                        challengerId: yup.number(),
                        acceptorId: yup.number(),
                        winner: yup.number(),
                        sets: yup.number().oneOf([2, 3]),
                    })
                )
                .min(3)
                .max(15),
        });

        const errors = getSchemaErrors(schema, context.data);
        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const sequelize = context.app.get('sequelizeClient');
    const { players, tournaments } = sequelize.models;

    const player = await players.findByPk(playerId);
    if (!player) {
        throw new Unprocessable('There is no player.');
    }
    if (player.userId !== currentUser.id) {
        throw new Unprocessable('You are not this player.');
    }
    if (!player.isActive) {
        throw new Unprocessable("You're not active in this ladder.");
    }

    const tournament = await tournaments.findByPk(player.tournamentId);
    const endDate = dayjs.tz(tournament.endDate);
    const deadline = endDate.add(18, 'hour');
    const currentDate = dayjs.tz();

    if (currentDate.isBefore(endDate) || currentDate.isAfter(deadline)) {
        throw new Unprocessable('Deadline for participating in the Bracket Battle is over.');
    }

    await players.update({ prediction: JSON.stringify(context.data.prediction) }, { where: { id: playerId } });
    await purgeTournamentCache({ tournamentId: player.tournamentId })(context);

    return context;
};

const joinDoublesTeam = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['player'])(context);

    let action;
    try {
        action = decodeAction(context.data.payload);
    } catch (e) {
        throw new Unprocessable((e as Error).message);
    }

    if (action.name !== 'joinDoubles') {
        throw new Unprocessable('Invalid request', {
            errors: { link: 'The link is broken' },
        });
    }

    const { config } = context.params;
    const currentUser = context.params.user as User;
    const sequelize = context.app.get('sequelizeClient');
    const { players } = sequelize.models;
    const playerId = Number(action.playerId);
    const [[player]] = await sequelize.query(
        `
        SELECT p.id,
               u.firstName,
               u.lastName,
               u.email,
               p.tournamentId,
               p.partnerId,
               s.endDate
          FROM players AS p,
               users AS u,
               tournaments AS t,
               seasons AS s
         WHERE p.userId=u.id AND
               p.id=:playerId AND
               (p.partnerId IS NULL OR p.partnerId=:poolPartnerId) AND
               p.tournamentId=t.id AND
               p.isActive=1 AND
               t.seasonId=s.id`,
        { replacements: { playerId, poolPartnerId: POOL_PARTNER_ID } }
    );
    if (!player) {
        throw new Unprocessable('Invalid request', {
            errors: { link: 'The player who provided this link is no longer a captain.' },
        });
    }

    const currentDate = dayjs.tz();
    if (currentDate.isAfter(dayjs.tz(player.endDate))) {
        throw new Unprocessable('Invalid request', {
            errors: { link: 'The season is over.' },
        });
    }

    // Check for the team size
    const [teammates] = await sequelize.query(`SELECT id FROM players WHERE id=:playerId OR partnerId=:playerId`, {
        replacements: { playerId },
    });
    if (teammates.length >= config.maxPlayersPerDoublesTeam) {
        throw new Unprocessable('Invalid request', {
            errors: { link: `The team already has the maximum of ${config.maxPlayersPerDoublesTeam} players.` },
        });
    }

    const [[currentPlayer]] = await sequelize.query(
        `SELECT id, partnerId FROM players WHERE userId=:userId AND tournamentId=:tournamentId`,
        { replacements: { userId: currentUser.id, tournamentId: player.tournamentId } }
    );
    if (currentPlayer) {
        if (currentPlayer.id === player.id) {
            throw new Unprocessable('Invalid request', {
                errors: { link: "It's your captain link. You should share it to other teammates." },
            });
        }
        if (currentPlayer.partnerId && currentPlayer.partnerId !== player.id) {
            throw new Unprocessable('Invalid request', {
                errors: { link: 'You are already a teammate in a different team.' },
            });
        }

        const [[currentPlayerPartner]] = await sequelize.query(`SELECT id FROM players WHERE partnerId=:partnerId`, {
            replacements: { partnerId: currentPlayer.id },
        });
        if (currentPlayerPartner) {
            throw new Unprocessable('Invalid request', {
                errors: { link: 'You are already a captain of a different team.' },
            });
        }

        await players.update({ partnerId: player.id }, { where: { id: currentPlayer.id } });
    } else {
        await players.create({ userId: currentUser.id, tournamentId: player.tournamentId, partnerId: player.id });
    }

    // If player is from the player pool
    if (player.partnerId === POOL_PARTNER_ID) {
        await players.update({ partnerId: null }, { where: { id: playerId } });
    }

    await purgeTournamentCache({ tournamentId: player.tournamentId })(context);

    {
        // send message to the captain
        const fullName = getPlayerName(currentUser);
        const emails = [{ email: player.email, name: getPlayerName(player) }];

        context.app.service('api/emails').create({
            to: emails,
            subject: `${fullName} Joined Your Doubles Team!`,
            html: getCustomEmail({
                config,
                compose: ({ h2 }) => `
    ${h2('Hello, #firstName#!', 'padding-top="10px"')}
    <mj-text><b>${fullName}</b> joined your Doubles team using the invite.</mj-text>`,
            }),
        });
    }

    return context;
};

const acceptPlayerFromPool = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['player'])(context);

    const { config } = context.params;
    const currentUser = context.params.user as User;
    const playerId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { players } = sequelize.models;

    const player = await players.findByPk(playerId);
    if (!player) {
        throw new Unprocessable('There is no player.');
    }
    if (!player.isActive) {
        throw new Unprocessable('The player is no longer available for matches.');
    }
    if (player.userId === currentUser.id) {
        throw new Unprocessable('Wrong user.');
    }

    const currentPlayer = await players.findOne({
        where: { userId: currentUser.id, tournamentId: player.tournamentId },
    });
    if (!currentPlayer) {
        throw new Unprocessable('You are not at the same ladder.');
    }
    if (!currentPlayer.isActive) {
        throw new Unprocessable('You are not active.');
    }
    if (currentPlayer.partnerId && currentPlayer.partnerId !== POOL_PARTNER_ID) {
        throw new Unprocessable('You are already in different team.');
    }

    // TODO: check that season is still active

    const [teammates] = await sequelize.query(`SELECT id FROM players WHERE partnerId=:partnerId`, {
        replacements: { partnerId: currentPlayer.id },
    });
    if (teammates.length + 1 >= config.maxPlayersPerDoublesTeam) {
        throw new Unprocessable(
            `Your team already has maximum capacity of ${config.maxPlayersPerDoublesTeam} players.`
        );
    }

    if (currentPlayer.partnerId === POOL_PARTNER_ID) {
        // validate team name
        {
            const schema = yup.object().shape({
                teamName: yup.string().required().min(config.teamNameMinLength).max(config.teamNameMaxLength),
            });

            const errors = getSchemaErrors(schema, context.data);
            if (!_isEmpty(errors)) {
                throw new Unprocessable('Team name is incorrect.');
            }
        }

        await players.update(
            { partnerId: null, teamName: formatTeamName(context.data.teamName) },
            { where: { id: currentPlayer.id } }
        );
    }
    await players.update({ partnerId: currentPlayer.id }, { where: { id: playerId } });
    await purgeTournamentCache({ tournamentId: player.tournamentId })(context);

    // send message to the player. Do not wait for it.
    sendAcceptedTeammateMessage(context, player.userId);

    return context;
};

const removeFromPlayerPool = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['player'])(context);

    const currentUser = context.params.user as User;
    const playerId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { players } = sequelize.models;

    const player = await players.findByPk(playerId);
    if (!player) {
        throw new Unprocessable('There is no player.');
    }
    if (player.userId !== currentUser.id) {
        throw new Unprocessable('You can remove only yourself.');
    }
    if (player.partnerId !== POOL_PARTNER_ID) {
        throw new Unprocessable('You are not in Player Pool.');
    }

    await players.destroy({ where: { id: playerId } });
    await purgeTournamentCache({ tournamentId: player.tournamentId })(context);

    return context;
};

const moveToPlayerPool = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['player'])(context);

    // Validate the data
    {
        const schema = yup.object().shape({
            partnerInfo: yup.string().max(200),
        });

        const errors = getSchemaErrors(schema, context.data);
        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const currentUser = context.params.user as User;
    const playerId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { players } = sequelize.models;
    const { partnerInfo } = context.data;

    const player = await players.findByPk(playerId);
    if (!player) {
        throw new Unprocessable('There is no player.');
    }
    if (player.userId !== currentUser.id) {
        throw new Unprocessable('You can remove only yourself.');
    }
    if (player.partnerId && player.partnerId !== POOL_PARTNER_ID) {
        throw new Unprocessable('You are not a captain.');
    }

    const teammate = await players.findOne({ where: { partnerId: playerId } });
    if (teammate) {
        throw new Unprocessable('You are a captain with teammates.');
    }

    await players.update({ partnerId: POOL_PARTNER_ID, partnerInfo }, { where: { id: playerId } });
    await purgeTournamentCache({ tournamentId: player.tournamentId })(context);

    sendNewPoolPlayerMessage(context, playerId);

    return context;
};

const getSuggestedTeamNames = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    // Validate the data
    {
        const schema = yup.object().shape({
            tournamentId: yup.number().integer().required(),
        });

        const errors = getSchemaErrors(schema, context.data);
        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const currentUser = context.params.user as User;
    const sequelize = context.app.get('sequelizeClient');
    const { tournamentId } = context.data;

    // get existing team names
    let existingTeamNames;
    {
        const [rows] = await sequelize.query(
            `SELECT teamName FROM players WHERE partnerId IS NULL AND tournamentId=:tournamentId`,
            {
                replacements: { tournamentId },
            }
        );
        existingTeamNames = new Set(rows.map((item) => item.teamName));
    }

    // get user previous team names
    let prevTeamName;
    {
        const [rows] = await sequelize.query(
            `
            SELECT teamName
              FROM players
             WHERE userId=userId AND
                   teamName IS NOT NULL
          ORDER BY createdAt DESC`,
            { replacements: { tournamentId } }
        );
        prevTeamName = rows.map((item) => item.teamName).filter((name) => !existingTeamNames.has(name))[0];
    }

    const random = seedrandom(currentUser.id + 1);
    const startingIndex = Math.floor(random() * teamNames.length);

    const TOTAL_SUGGESTED_TEAM_NAMES = 8;
    const suggestedTeamNames = [...teamNames, ...teamNames]
        .slice(startingIndex)
        .filter((name) => !existingTeamNames.has(name) && name !== prevTeamName)
        .slice(0, TOTAL_SUGGESTED_TEAM_NAMES);
    if (prevTeamName) {
        suggestedTeamNames.unshift(prevTeamName);
        suggestedTeamNames.pop();
    }

    context.result = suggestedTeamNames;

    return context;
};

const changeTeamName = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const playerId = Number(context.id);
    const { config } = context.params;

    // Validate the data
    {
        const schema = yup.object().shape({
            teamName: yup
                .string()
                .required()
                .min(config.teamNameMinLength)
                .max(config.teamNameMaxLength)
                .matches(/^[a-zA-Z0-9 -]+$/),
        });

        const errors = getSchemaErrors(schema, context.data);
        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const currentUser = context.params.user as User;
    const sequelize = context.app.get('sequelizeClient');
    const { players } = sequelize.models;

    const player = await players.findByPk(playerId);
    if (!player) {
        throw new Unprocessable('There is no player.');
    }
    if (!player.isActive) {
        throw new Unprocessable('The player is no longer available for matches.');
    }
    if (player.partnerId) {
        throw new Unprocessable('The player is not a captain.');
    }

    if (!currentUser.roles.includes('superadmin') && player.userId !== currentUser.id) {
        throw new Unprocessable('You are not allowed to change the team name.');
    }

    // get existing team names
    const formattedTeamName = formatTeamName(context.data.teamName);
    const [[existingTeam]] = await sequelize.query(
        `SELECT id FROM players WHERE teamName=:teamName AND tournamentId=:tournamentId AND id!=:playerId`,
        { replacements: { teamName: formattedTeamName, tournamentId: player.tournamentId, playerId: player.id } }
    );
    if (existingTeam) {
        throw new Unprocessable('Invalid request', { errors: { teamName: 'The name is already used.' } });
    }

    await players.update({ teamName: formattedTeamName }, { where: { id: playerId } });
    await purgeTournamentCache({ tournamentId: player.tournamentId })(context);

    return context;
};

const replaceCaptain = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const playerId = Number(context.id);
    const { config } = context.params;

    // Validate the data
    {
        const schema = yup.object().shape({
            captainId: yup.number().required().integer().min(1),
        });

        const errors = getSchemaErrors(schema, context.data);
        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const currentUser = context.params.user as User;
    const sequelize = context.app.get('sequelizeClient');
    const { players, users } = sequelize.models;
    const { captainId } = context.data;

    const player = await players.findByPk(playerId);
    if (!player) {
        throw new Unprocessable('There is no player.');
    }
    if (!player.isActive) {
        throw new Unprocessable('The player is no longer available for matches.');
    }
    if (player.userId !== currentUser.id) {
        throw new Unprocessable('Wrong user.');
    }
    if (player.partnerId) {
        throw new Unprocessable('You are not a captain.');
    }

    const captain = await players.findByPk(captainId);
    if (!captain || !captain.isActive) {
        throw new Unprocessable('There is no captain.');
    }
    if (captain.partnerId !== playerId) {
        throw new Unprocessable('You are not in the same team.');
    }

    await players.update({ teamName: player.teamName, partnerId: null }, { where: { id: captainId } });
    await players.update({ teamName: null, partnerId: captainId }, { where: { id: playerId } });
    await players.update({ partnerId: captainId }, { where: { partnerId: playerId } });

    await purgeTournamentCache({ tournamentId: player.tournamentId })(context);

    {
        // send message to the new captain
        const captainUser = await users.findByPk(captain.userId);

        context.app.service('api/emails').create({
            to: [getEmailContact(captainUser)],
            replyTo: getEmailContact(currentUser),
            subject: `${getPlayerName(currentUser)} Made You the Team Captain`,
            html: getCustomEmail({
                config,
                compose: ({ h2 }) => `
    ${h2('Hello, #firstName#!', 'padding-top="10px"')}
    <mj-text><b>${getPlayerName(currentUser)}</b> made you the Team Captain of the <b>${
        player.teamName
    }</b> doubles team.</mj-text>`,
            }),
        });
    }

    return context;
};

const leaveTeam = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const playerId = Number(context.id);
    const { config } = context.params;

    // Validate the data
    {
        const schema = yup.object().shape({
            reason: yup.string().required('Reason is required.').max(100),
        });

        const errors = getSchemaErrors(schema, context.data);
        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const currentUser = context.params.user as User;
    const sequelize = context.app.get('sequelizeClient');
    const { players, users } = sequelize.models;
    const { reason } = context.data;

    const player = await players.findByPk(playerId);
    if (!player) {
        throw new Unprocessable('There is no player.');
    }
    if (player.userId !== currentUser.id) {
        throw new Unprocessable('Wrong user.');
    }
    if (!player.partnerId) {
        throw new Unprocessable('You are the captain.');
    }

    // delete passed proposals and unplayed matches
    await sequelize.query(
        `DELETE FROM matches
               WHERE score IS NULL AND
                     playedAt<:currentDate AND
                     (challengerId=:playerId OR challenger2Id=:playerId OR acceptorId=:playerId OR acceptor2Id=:playerId)`,
        { replacements: { currentDate: dayjs.tz().format('YYYY-MM-DD HH:mm:ss'), playerId } }
    );

    await players.destroy({ where: { id: playerId } });
    await purgeTournamentCache({ tournamentId: player.tournamentId })(context);

    {
        // send message to the new captain
        const captain = await players.findByPk(player.partnerId);
        const captainUser = await users.findByPk(captain.userId);

        context.app.service('api/emails').create({
            to: [getEmailContact(captainUser)],
            replyTo: getEmailContact(currentUser),
            subject: `${getPlayerName(currentUser)} Left Your Doubles Team`,
            html: getCustomEmail({
                config,
                compose: ({ h2 }) => `
${h2('Hello, #firstName#!', 'padding-top="10px"')}
<mj-text><b>${getPlayerName(currentUser)}</b> left the <b>${captain.teamName}</b> doubles team.</mj-text>
<mj-text><b>Reason:</b> ${reason}</mj-text>`,
            }),
        });
    }

    return context;
};

const createTeamFromPool = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['admin', 'manager'])(context);

    const { config } = context.params;
    const sequelize = context.app.get('sequelizeClient');
    const { players, users } = sequelize.models;

    // Validate the data
    {
        const schema = yup.object().shape({
            players: yup.array(yup.number().integer().min(1)).required().min(2).max(3),
            teamName: yup.string().required().min(config.teamNameMinLength).max(config.teamNameMaxLength),
        });

        const errors = getSchemaErrors(schema, context.data);
        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const playerInfo = await Promise.all(
        context.data.players.map(async (playerId: number) => {
            const player = await players.findByPk(playerId);
            if (player) {
                player.user = await users.findByPk(player.userId);
            }
            return player;
        })
    );
    if (playerInfo.some((player) => !player)) {
        throw new Unprocessable('There is no player.');
    }
    if (playerInfo.some((player) => player.partnerId !== POOL_PARTNER_ID)) {
        throw new Unprocessable('Player is not from player pool.');
    }

    const captain = playerInfo[0];
    const partners = playerInfo.slice(1);
    if (partners.some((partner) => partner.tournamentId !== captain.tournamentId)) {
        throw new Unprocessable('Players are not from the same tournament.');
    }

    await players.update({ partnerId: null, teamName: context.data.teamName }, { where: { id: captain.id } });
    for (const partner of partners) {
        await players.update({ partnerId: captain.id, teamName: null }, { where: { id: partner.id } });
    }

    await purgeTournamentCache({ tournamentId: captain.tournamentId })(context);

    // send message to the new team
    {
        const sendEmail = async (emails, captainText) => {
            context.app.service('api/emails').create({
                to: emails,
                subject: `You've Been Added to a Doubles Team!`,
                html: getCustomEmail({
                    config,
                    compose: ({ h2 }) => `
${h2('Hello, #firstName#!', 'padding-top="10px"')}
<mj-text>Get ready to play Doubles! We matched you with other players to create this brand-new team: <b>${
                        context.data.teamName
                    }</b>.</mj-text>
<mj-text>${captainText} Here are your teammates:</mj-text>
${playerInfo.map(
    (player) => `<mj-text>
    <h3 style="margin-bottom: 5px;">${getPlayerName(player.user)}</h3>
    <b>Email:</b> ${getEmailLink(player.user)}<br>
    <b>Phone:</b> ${getPhoneLink(player.user)}
</mj-text>`
)}    

<mj-text>Reach out to them to start coordinating matches!</mj-text>
`,
                }),
            });
        };

        const list = playerInfo.map((player) => player.user).map(getEmailContact);
        await sendEmail(list.slice(0, 1), 'You will be the Team Captain this season.');
        await sendEmail(list.slice(1), `<b>${list[0].name}</b> will be your Team Captain this season.`);
    }

    return context;
};

const movePartner = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['superadmin'])(context);

    const playerId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { players } = sequelize.models;

    // Validate the data
    {
        const schema = yup.object().shape({
            toCaptainId: yup.number().integer().min(1),
            isReplaceCaptain: yup.boolean(),
        });

        const errors = getSchemaErrors(schema, context.data);
        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const { toCaptainId, isReplaceCaptain } = context.data;
    const playerInfo = await players.findByPk(playerId);

    const [allPlayers] = await sequelize.query(`SELECT * FROM players WHERE tournamentId=:tournamentId ORDER BY id`, {
        replacements: { tournamentId: playerInfo.tournamentId },
    });

    const playerUpdates = getPlayersUpdates({
        players: allPlayers,
        playerId,
        captainId: toCaptainId,
        replaceCaptain: isReplaceCaptain,
    });

    for (const update of playerUpdates) {
        await sequelize.query(`UPDATE players SET partnerId=:partnerId, teamName=:teamName WHERE id=:id`, {
            replacements: update,
        });
    }

    logEvent(`Partner ${playerId} moved to the captain ${toCaptainId}${isReplaceCaptain ? ' and replaced him' : ''}`)(
        context
    );

    await purgeTournamentCache({ tournamentId: playerInfo.tournamentId })(context);

    return context;
};

const runCustomAction = () => async (context: HookContext) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'batchAddPlayers') {
        await batchAddPlayers()(context);
    } else if (action === 'getPossibleTournaments') {
        await getPossibleTournaments()(context);
    } else if (action === 'switchTournament') {
        await switchTournament()(context);
    } else if (action === 'registerForFree') {
        await registerForFree()(context);
    } else if (action === 'claimReward') {
        await claimReward()(context);
    } else if (action === 'activatePlayer') {
        await activatePlayer()(context);
    } else if (action === 'deactivatePlayer') {
        await deactivatePlayer()(context);
    } else if (action === 'quitTournament') {
        await quitTournament()(context);
    } else if (action === 'setPrediction') {
        await setPrediction()(context);
    } else if (action === 'joinDoublesTeam') {
        await joinDoublesTeam()(context);
    } else if (action === 'acceptPlayerFromPool') {
        await acceptPlayerFromPool()(context);
    } else if (action === 'removeFromPlayerPool') {
        await removeFromPlayerPool()(context);
    } else if (action === 'moveToPlayerPool') {
        await moveToPlayerPool()(context);
    } else if (action === 'getSuggestedTeamNames') {
        await getSuggestedTeamNames()(context);
    } else if (action === 'changeTeamName') {
        await changeTeamName()(context);
    } else if (action === 'replaceCaptain') {
        await replaceCaptain()(context);
    } else if (action === 'leaveTeam') {
        await leaveTeam()(context);
    } else if (action === 'createTeamFromPool') {
        await createTeamFromPool()(context);
    } else if (action === 'movePartner') {
        await movePartner()(context);
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
        find: [],
        get: [populateEloHistory()],
        create: [],
        update: [runCustomAction()],
        patch: [authenticate('jwt'), validatePatch(), checkIfCurrentUser(), keep('readyForFinal')],
        remove: [authenticate('jwt'), hasAnyRole(['admin', 'manager']), validateRemove()],
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [purgeRelatedTournaments()],
        remove: [purgeTournamentCache()],
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
