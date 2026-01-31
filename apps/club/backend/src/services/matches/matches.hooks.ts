// @ts-nocheck
import type { HookContext } from '@feathersjs/feathers';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { NotFound, Unprocessable, MethodNotAllowed } from '@feathersjs/errors';
import { calculateElo } from './calculateElo';
import calculateRank from './calculateRank';
import { keep, disallow } from 'feathers-hooks-common';
import dayjs from '../../utils/dayjs';
import validate from './validate';
import _isEmpty from 'lodash/isEmpty';
import _pick from 'lodash/pick';
import _omit from 'lodash/omit';
import { hasAnyRole, purgeTournamentCache, logEvent, generateBadges, purgeMatchCache } from '../commonHooks';
import { throwValidationErrors, getSchemaErrors } from '../../helpers';
import { completeInjuryFullScore, completeInjuryFastScore, isFullScoreCorrect, isFastScoreCorrect } from './helpers';
import renderImage from '../../utils/renderImage';
import newMatchReportedTemplate from '../../emailTemplates/newMatchReported';
import newMatchStatReportedTemplate from '../../emailTemplates/newMatchStatReported';
import scheduleMatchTemplate from '../../emailTemplates/scheduleMatch';
import newRivalryStartedTemplate from '../../emailTemplates/newRivalryStarted';
import deletedScheduledMatchTemplate from '../../emailTemplates/deletedScheduledMatch';
import eloEstablishedTemplate from '../../emailTemplates/eloEstablished';
import getCustomEmail from '../../emailTemplates/getCustomEmail';
import { reverseScore } from './calculateElo';
import yup from '../../packages/yup';
import sendFinalReminders from './sendFinalReminders';
import axios from 'axios';
import getStat from './getStat';
import getScore from './getScore';
import processStat from './processStat';
import { updateCurrentWeekUserBadges } from '../../utils/applyNewBadges';
import formatElo from '../../utils/formatElo';
import { relationsUp } from './relations';
import { BRACKET_BOT_ID } from '../../constants';
import compareFields from '../../utils/compareFields';
import { getStatsMatches } from '../../utils/sqlConditions';
import getMatchInfo from './getMatchInfo';
import { getPlayerName, getEmailContact, getEmailLink, getPhoneLink } from '../users/helpers';
import type { Level, Match, Player, User } from '../../types';

const isAdmin = (user: User) => {
    const roles = user.roles.split(',');

    return roles.includes('admin') || roles.includes('manager');
};

const validateCreate = () => (context: HookContext) => {
    const errors = validate(context.data);

    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    return context;
};

const validatePatch = () => (context: HookContext) => {
    const errors = validate({ ...context.data, challengerId: 1, acceptorId: 1 });

    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    return context;
};

const completePlayedAt = () => async (context: HookContext) => {
    context.data.playedAt += '+00:00';
    return context;
};

const populateWinner = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const { data } = context;
    const userId = context.params.user!.id;

    const { players } = context.app.get('sequelizeClient').models;
    const isFast4 = data.matchFormat === 2;
    const isScoreCorrect = isFast4 ? isFastScoreCorrect : isFullScoreCorrect;
    const completeInjuryScore = isFast4 ? completeInjuryFastScore : completeInjuryFullScore;

    if (!data.challengerId || !data.acceptorId) {
        throw new Unprocessable("Match doesn't have two players.");
    }
    const isDoubles = data.challenger2Id || data.acceptor2Id;
    if (isDoubles && (!data.challenger2Id || !data.acceptor2Id)) {
        throw new Unprocessable("Match doesn't have all four players.");
    }

    if (data.wonByDefault && !['6-0 6-0', '0-6 0-6'].includes(data.score)) {
        throw new Unprocessable('The score for default match is wrong');
    }

    if (data.unavailable && !['6-0 6-0', '0-6 0-6'].includes(data.score)) {
        throw new Unprocessable('The score for unavailable match is wrong');
    }

    if ((data.wonByDefault ? 1 : 0) + (data.wonByInjury ? 1 : 0) + (data.unavailable ? 1 : 0) > 1) {
        throw new Unprocessable('Too many checkboxes');
    }

    const completeScore = data.wonByInjury
        ? completeInjuryScore(data.score, data.winner === data.challengerId)
        : data.score;
    if (!isScoreCorrect(completeScore)) {
        throw new Unprocessable('The score is incorrect.');
    }

    const challenger = data.challengerId ? await players.findByPk(data.challengerId) : null;
    const challenger2 = data.challenger2Id ? await players.findByPk(data.challenger2Id) : null;
    const acceptor = data.acceptorId ? await players.findByPk(data.acceptorId) : null;
    const acceptor2 = data.acceptor2Id ? await players.findByPk(data.acceptor2Id) : null;

    if (!challenger || !acceptor) {
        throw new Unprocessable('Challenger or acceptor are wrong');
    }
    if (isDoubles && (!challenger2 || !acceptor2)) {
        throw new Unprocessable('Challenger2 or acceptor2 are wrong');
    }

    const tournamentId = challenger.tournamentId;
    if ([challenger2, acceptor, acceptor2].some((item) => item && item.tournamentId !== tournamentId)) {
        throw new Unprocessable('All players should be from the same tournament.');
    }

    context.params.tournamentId = tournamentId;

    if (!isAdmin(context.params.user as User)) {
        if ([challenger, acceptor, challenger2, acceptor2].some((item) => item && !item.isActive)) {
            throw new Unprocessable('The player is no longer available for matches.');
        }

        const currentPlayer = await players.findOne({ where: { userId, tournamentId } });
        if (!currentPlayer) {
            throw new Unprocessable("You're not in this tournament.");
        }
        if (
            ![
                data.challengerId,
                data.challenger2Id,
                data.acceptorId,
                data.acceptor2Id,
                challenger.partnerId,
                acceptor.partnerId,
            ].includes(currentPlayer.id)
        ) {
            throw new Unprocessable('You did not play in this match.');
        }
    }

    // get season info
    const [result] = await sequelize.query(
        'SELECT s.startDate, s.endDate FROM tournaments AS t, seasons AS s WHERE t.seasonId=s.id AND t.id=:id',
        { replacements: { id: tournamentId } }
    );
    const { startDate, endDate } = result[0];
    const currentDate = dayjs.tz();
    if (currentDate.isAfter(dayjs.tz(endDate))) {
        throw new Unprocessable('The season is already over.');
    }
    if (currentDate.isBefore(dayjs.tz(startDate))) {
        throw new Unprocessable('The season is not started yet.');
    }

    // Figure out the winner
    const challengerSetsWon = completeScore.split(' ').reduce((sum: number, set: string) => {
        const [first, second] = set.split('-');
        return sum + (+first > +second ? 1 : 0);
    }, 0);
    data.winner = challengerSetsWon === 2 ? data.challengerId : data.acceptorId;

    data.acceptedAt = dayjs.tz().format('YYYY-MM-DD HH:mm:ss+00:00');
    data.initial = 3;

    return context;
};

const sendEstablishedEloNotification = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const { users, players, matches } = sequelize.models;
    const { config } = context.params;
    const matchId = context.id ? Number(context.id) : context.result.id;
    const { TL_URL } = process.env;

    const currentDate = dayjs.tz().format('YYYY-MM-DD HH:mm:ss');
    const match = await matches.findByPk(matchId);

    if (match.wonByDefault || match.unavailable || match.challenger2Id || !match.score) {
        return context;
    }

    if (
        match.challengerMatches !== config.minMatchesToEstablishTlr &&
        match.acceptorMatches !== config.minMatchesToEstablishTlr
    ) {
        return context;
    }

    const [[currentLevel]] = await sequelize.query(
        `
        SELECT l.name,
               l.slug,
               l.baseTlr,
               l.maxTlr,
               t.seasonId,
               s.endDate
          FROM levels AS l,
               tournaments AS t,
               players AS p,
               seasons AS s
         WHERE p.tournamentId=t.id AND
               t.seasonId=s.id AND
               t.levelId=l.id AND
               p.id=:challengerId`,
        { replacements: { challengerId: match.challengerId } }
    );

    // do not wait for it
    const sendNotification = async (playerId: number, elo: number) => {
        const player = await players.findByPk(playerId);
        const user = await users.findByPk(player.userId);

        const ACTION_NAME = 'sendEstablishedEloNotification';
        const [actions] = await sequelize.query(`SELECT * FROM actions WHERE tableId=:tableId AND name=:name`, {
            replacements: { tableId: player.userId, name: ACTION_NAME },
        });
        if (actions.length > 0) {
            return;
        }

        const eloImg = await renderImage(`${TL_URL}/image/tlr?elo=${formatElo(elo)}`);

        const SUITABLE_DIFF = 40;
        const isLevelSuitable = Math.abs(currentLevel.baseTlr - elo) <= SUITABLE_DIFF;
        let suggestedLevel;
        if (!isLevelSuitable) {
            const [levels] = (await sequelize.query(
                `SELECT l.name,
                        l.slug,
                        l.baseTlr
                   FROM levels AS l,
                        tournaments AS t
                  WHERE t.levelId=l.id AND
                        t.seasonId=:seasonId AND
                        l.type="single" AND
                        l.baseTlr IS NOT NULL`,
                { replacements: { seasonId: currentLevel.seasonId } }
            )) as [Level[]];

            const genderRegex = /^Men/i.test(currentLevel.name) ? /^Men/i : /^Women/i;

            // Recommend the same gender level, which baseTlr is within SUITABLE_DIFF and close to the current level
            [suggestedLevel] = levels
                .map((item) => ({
                    ...item,
                    tlrDiff: Math.abs(item.baseTlr - elo),
                    currentLevelTlrDiff: Math.abs(item.baseTlr - currentLevel.baseTlr),
                }))
                .filter(
                    (item) =>
                        item.slug !== currentLevel.slug && item.tlrDiff <= SUITABLE_DIFF && genderRegex.test(item.name)
                )
                .sort((a, b) => a.currentLevelTlrDiff - b.currentLevelTlrDiff);
        }
        const isTournamentRestriction = Boolean(
            suggestedLevel &&
            currentLevel.endDate > currentDate &&
            player.readyForFinal === 0 &&
            elo > currentLevel.maxTlr
        );

        await context.app.service('api/emails').create({
            to: [getEmailContact(user)],
            subject: "You've Established Your TLR!",
            html: eloEstablishedTemplate({
                config,
                elo: formatElo(elo),
                eloImg,
                currentLevel: currentLevel.name,
                isLevelSuitable,
                suggestedLevel: suggestedLevel?.name,
                moveDirection: suggestedLevel
                    ? suggestedLevel.baseTlr > currentLevel.baseTlr
                        ? 'up'
                        : 'down'
                    : undefined,
                isTournamentRestriction,
            }),
        });

        await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:tableId, :name)`, {
            replacements: { tableId: player.userId, name: ACTION_NAME },
        });
    };

    // do not wait for it
    if (match.challengerMatches === config.minMatchesToEstablishTlr) {
        sendNotification(match.challengerId, match.challengerElo);
    }
    // do not wait for it
    if (match.acceptorMatches === config.minMatchesToEstablishTlr) {
        sendNotification(match.acceptorId, match.acceptorElo);
    }

    return context;
};

// This is not a hook, just a helper
const populateNextFinalMatch = async (context: HookContext, prevMatch: Match) => {
    const connectedMatch = relationsUp[prevMatch.finalSpot];
    if (!connectedMatch) {
        return;
    }

    const sequelize = context.app.get('sequelizeClient');
    const { matches, players } = sequelize.models;

    const { tournamentId } = await players.findByPk(prevMatch.challengerId);

    const [result] = await sequelize.query(
        `SELECT m.*
           FROM matches AS m, players AS p
          WHERE (m.challengerId=p.id OR m.challengerId IS NULL AND m.acceptorId=p.id) AND
                p.tournamentId=:tournamentId AND
                m.type="final" AND
                m.battleId IS NULL AND
                m.finalSpot=:finalSpot`,
        { replacements: { tournamentId, finalSpot: connectedMatch.finalSpot } }
    );
    const nextMatch = result[0];
    if (nextMatch?.score) {
        throw new Unprocessable('Next match is already played');
    }

    if (prevMatch.score) {
        // we have a new match
        const nextMatchSeed =
            prevMatch.winner === prevMatch.challengerId ? prevMatch.challengerSeed : prevMatch.acceptorSeed;

        if (nextMatch) {
            await matches.update(
                {
                    [connectedMatch.player]: prevMatch.winner,
                    ...(connectedMatch.player === 'challengerId'
                        ? { challengerSeed: nextMatchSeed }
                        : { acceptorSeed: nextMatchSeed }),
                },
                { where: { id: nextMatch.id } }
            );
        } else {
            await matches.create({
                initial: 3,
                [connectedMatch.player]: prevMatch.winner,
                ...(connectedMatch.player === 'challengerId'
                    ? { challengerSeed: nextMatchSeed }
                    : { acceptorSeed: nextMatchSeed }),
                type: 'final',
                finalSpot: connectedMatch.finalSpot,
            });
        }
    } else if (nextMatch) {
        // we are clearing the match result
        if (nextMatch.challengerId && nextMatch.acceptorId) {
            // we need to remove the player
            await matches.update(
                {
                    [connectedMatch.player]: null,
                    ...(connectedMatch.player === 'challengerId' ? { challengerSeed: 0 } : { acceptorSeed: 0 }),
                },
                { where: { id: nextMatch.id } }
            );
        } else {
            // we need to delete the match
            await matches.destroy({ where: { id: nextMatch.id } });
        }
    }

    sendFinalReminders(context, tournamentId);
};

const populateWinnerForPatch = () => async (context: HookContext) => {
    const { data } = context;
    const matchId = Number(context.id);
    const currentUser = context.params.user as User;

    const { matches, players } = context.app.get('sequelizeClient').models;
    const matchInfo = await getMatchInfo({ app: context.app, currentUser, matchId });
    const match = await matches.findByPk(matchId);

    if (!matchInfo.hasPlayers) {
        throw new Unprocessable("Match doesn't have all players.");
    }

    if (data.wonByDefault && !['6-0 6-0', '0-6 0-6'].includes(data.score)) {
        throw new Unprocessable('The score for default match is wrong');
    }

    if (data.unavailable && !['6-0 6-0', '0-6 0-6'].includes(data.score)) {
        throw new Unprocessable('The score for unavailable match is wrong');
    }

    if ((data.wonByDefault ? 1 : 0) + (data.wonByInjury ? 1 : 0) + (data.unavailable ? 1 : 0) > 1) {
        throw new Unprocessable('Too many checkboxes');
    }

    const isFast4 = data.matchFormat === 2;
    const isScoreCorrect = isFast4 ? isFastScoreCorrect : isFullScoreCorrect;
    const completeInjuryScore = isFast4 ? completeInjuryFastScore : completeInjuryFullScore;

    const completeScore = data.wonByInjury
        ? completeInjuryScore(data.score, data.winner === match.challengerId)
        : data.score;
    if (!isScoreCorrect(completeScore)) {
        throw new Unprocessable('The score is incorrect.');
    }

    const challengerId = data.challengerId || match.challengerId;
    const challenger2Id = data.challenger2Id || match.challenger2Id;
    const acceptorId = data.acceptorId || match.acceptorId;
    const acceptor2Id = data.acceptor2Id || match.acceptor2Id;
    const isDoubles = Boolean(challenger2Id || acceptor2Id);

    const challenger = challengerId ? await players.findByPk(challengerId) : null;
    const challenger2 = challenger2Id ? await players.findByPk(challenger2Id) : null;
    const acceptor = acceptorId ? await players.findByPk(acceptorId) : null;
    const acceptor2 = acceptor2Id ? await players.findByPk(acceptor2Id) : null;

    if (!challenger || !acceptor) {
        throw new Unprocessable('Challenger or acceptor are wrong');
    }
    if (isDoubles && (!challenger2 || !acceptor2)) {
        throw new Unprocessable('Challenger2 or acceptor2 are wrong');
    }

    const tournamentId = challenger.tournamentId;
    if ([challenger2, acceptor, acceptor2].some((item) => item && item.tournamentId !== tournamentId)) {
        throw new Unprocessable('All players should be from the same tournament.');
    }

    context.params.tournamentId = tournamentId;

    if (!matchInfo.canReportScore && !matchInfo.canEditScore) {
        throw new Unprocessable('You did not play in this match.');
    }

    // Figure out the winner
    const challengerSetsWon = completeScore.split(' ').reduce((sum: number, set: string) => {
        const [first, second] = set.split('-');
        return sum + (+first > +second ? 1 : 0);
    }, 0);
    data.winner = challengerSetsWon === 2 ? challengerId : acceptorId;

    if (match.type === 'final') {
        await populateNextFinalMatch(context, { ...match.dataValues, ...data });
    }

    return context;
};

const updateEloAndRank = () => async (context: HookContext) => {
    const { players, tournaments } = context.app.get('sequelizeClient').models;

    const challenger = await players.findOne({
        where: {
            id: context.result.challengerId,
        },
        include: tournaments,
    });

    await calculateElo();
    await calculateRank(challenger.tournamentId);

    return context;
};

const checkDuplicatedMatch = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const { challengerUserId, acceptorUserId, playedAt } = context.data;
    const currentUser = context.params.user as User;
    const userId = currentUser.id;
    const dayStart = dayjs.tz(playedAt).hour(0).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss');
    const dayEnd = dayjs.tz(dayStart).add(1, 'day').format('YYYY-MM-DD HH:mm:ss');

    if (!isAdmin(currentUser)) {
        if (userId !== challengerUserId && userId !== acceptorUserId) {
            throw new MethodNotAllowed();
        }
    }

    const sequelize = context.app.get('sequelizeClient');
    const [rows] = (await sequelize.query(
        `
        SELECT m.id,
               m.score,
               l.name AS levelName,
               pc.userId AS challengerUserId,
               pa.userId AS acceptorUserId
          FROM matches AS m
          JOIN (SELECT p.id, p.userId, p.tournamentId FROM players AS p ) AS pc
            ON m.challengerId=pc.id
          JOIN (SELECT p.id, p.userId FROM players AS p ) AS pa
            ON m.acceptorId=pa.id
          JOIN tournaments AS t ON pc.tournamentId=t.id
          JOIN levels AS l ON t.levelId=l.id AND l.type="single"
         WHERE m.score IS NOT NULL AND
               m.sameAs IS NULL AND
               m.unavailable=0 AND
               m.playedAt>:dayStart AND
               m.playedAt<:dayEnd`,
        { replacements: { dayStart, dayEnd } }
    )) as [Match[]];

    const duplicatedMatch = rows.find(
        (row) =>
            (row.challengerUserId === challengerUserId && row.acceptorUserId === acceptorUserId) ||
            (row.challengerUserId === acceptorUserId && row.acceptorUserId === challengerUserId)
    );

    context.result = {
        match: duplicatedMatch,
    };

    return context;
};

const replacePlayers = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['admin', 'manager'])(context);

    const matchId = Number(context.id);
    const { challengerId, acceptorId } = context.data;

    const sequelize = context.app.get('sequelizeClient');
    const { matches, players } = sequelize.models;

    const match = await matches.findByPk(matchId);
    if (!match) {
        throw new Unprocessable('The match is not found');
    }
    if (match.score) {
        throw new Unprocessable('You cannot replace players for already played match');
    }
    if (match.type !== 'final') {
        throw new Unprocessable('You can replace players only for final matches');
    }
    if (dayjs().diff(dayjs(match.createdAt), 'week', true) > 4) {
        throw new Unprocessable("It's too late to replace players");
    }
    if (challengerId === acceptorId) {
        throw new Unprocessable('Players are the same');
    }
    if (!challengerId && !acceptorId) {
        throw new Unprocessable('You have to select players');
    }

    const { tournamentId } = await (match.challengerId
        ? players.findByPk(match.challengerId)
        : players.findByPk(match.acceptorId));

    const [allPlayers] = (await sequelize.query(
        `SELECT id FROM players WHERE tournamentId=:tournamentId AND isActive=1`,
        { replacements: { tournamentId } }
    )) as [Player[]];
    const playerIds = new Set(allPlayers.map((item) => item.id));
    if (challengerId && !playerIds.has(challengerId)) {
        throw new Unprocessable('Challenger is not from this tournament');
    }
    if (acceptorId && !playerIds.has(acceptorId)) {
        throw new Unprocessable('Acceptor is not from this tournament');
    }

    const [playingPlayers] = (await sequelize.query(
        `SELECT p.id
           FROM players AS p
          WHERE p.tournamentId=:tournamentId AND
                (p.id IN (SELECT challengerId FROM matches WHERE type="final") || p.id IN (SELECT acceptorId FROM matches WHERE type="final"))`,
        { replacements: { tournamentId } }
    )) as [Player[]];
    const playingPlayersSet = new Set(playingPlayers.map((item) => item.id));
    playingPlayersSet.delete(match.challengerId);
    playingPlayersSet.delete(match.acceptorId);

    if (playingPlayersSet.has(challengerId)) {
        throw new Unprocessable('Invalid request', {
            errors: { challengerId: 'Player is already competing in the tournament.' },
        });
    }
    if (playingPlayersSet.has(acceptorId)) {
        throw new Unprocessable('Invalid request', {
            errors: { acceptorId: 'Player is already competing in the tournament.' },
        });
    }

    if (challengerId) {
        await sequelize.query(`UPDATE matches SET challengerId=:challengerId WHERE id=:matchId`, {
            replacements: { challengerId, matchId },
        });
    }
    if (acceptorId) {
        await sequelize.query(`UPDATE matches SET acceptorId=:acceptorId WHERE id=:matchId`, {
            replacements: { acceptorId, matchId },
        });
    }

    await purgeTournamentCache({ tournamentId })(context);

    sendFinalReminders(context, tournamentId);

    return context;
};

const scheduleMatch = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    // Validate data
    {
        const schema = yup.object().shape({
            challengerId: yup.number(),
            acceptorId: yup.number(),
            challenger2Id: yup.number().nullable(),
            acceptor2Id: yup.number().nullable(),
            place: yup.string().required('Location is required.').max(100),
            playedAt: yup
                .string()
                .required('Date is required.')
                .matches(/^\d\d\d\d-\d\d-\d\d\s\d\d:\d\d:\d\d$/),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    let matchId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { matches } = sequelize.models;
    const currentUser = context.params.user as User;

    let match: Match;
    if (matchId === 0) {
        match = {
            challengerId: context.data.challengerId,
            acceptorId: context.data.acceptorId,
            challenger2Id: context.data.challenger2Id,
            acceptor2Id: context.data.acceptor2Id,
        } as Match;
    } else {
        match = await matches.findByPk(matchId);
        if (!match) {
            throw new Unprocessable('The match is not found');
        }
        if (match.score) {
            throw new Unprocessable('You cannot schedule already played match');
        }
        if (dayjs().diff(dayjs(match.createdAt), 'week', true) > 4) {
            throw new Unprocessable("It's too late to schedule the match");
        }
    }

    const playedAt = dayjs.tz(context.data.playedAt);
    const currentDate = dayjs.tz();

    if (currentDate.isAfter(playedAt)) {
        throw new Unprocessable('Invalid request', { errors: { playedAt: 'This date has passed.' } });
    } else if (playedAt.isAfter(currentDate.add(1, 'week').isoWeekday(7).hour(23).minute(59).second(59))) {
        throw new Unprocessable('The date is more than a week in the future.');
    }

    const matchInfo = await getMatchInfo({ app: context.app, currentUser, matchId, match });
    if (!match.playedAt && !matchInfo.canScheduleMatch) {
        throw new Unprocessable('You cannot schedule this match.');
    }
    if (match.playedAt && !matchInfo.canRescheduleMatch) {
        throw new Unprocessable('You cannot reschedule this match.');
    }

    if (matchId === 0) {
        const result = await matches.create({
            initial: 6,
            challengerId: match.challengerId,
            acceptorId: match.acceptorId,
            challenger2Id: match.challenger2Id,
            acceptor2Id: match.acceptor2Id,
            place: context.data.place,
            playedAt: playedAt.format('YYYY-MM-DD HH:mm:ss+00:00'),
            acceptedAt: currentDate.format('YYYY-MM-DD HH:mm:ss+00:00'),
        });
        matchId = result.dataValues.id;
    } else {
        await sequelize.query(
            `
                UPDATE matches
                   SET place=:place, playedAt=:playedAt, comment=NULL
                 WHERE id=:matchId`,
            {
                replacements: {
                    matchId,
                    place: context.data.place,
                    playedAt: playedAt.format('YYYY-MM-DD HH:mm:ss'),
                },
            }
        );
    }

    await purgeTournamentCache({ tournamentId: matchInfo.tournamentId })(context);

    // don't wait for this email sent
    {
        const isRescheduling = Boolean(match.playedAt);
        const date = playedAt.format('ddd, MMM D, h:mm A');
        context.app.service('api/emails').create({
            to: matchInfo.emailsWithoutCurrentUser,
            replyTo: getEmailContact(currentUser),
            subject: `Your Match ${isRescheduling ? 'Was Rescheduled' : 'Is Scheduled'}`,
            html: scheduleMatchTemplate({
                config: context.params.config,
                challenger: matchInfo.challengerLinkedName,
                acceptor: matchInfo.acceptorLinkedName,
                date,
                location: context.data.place,
                isRescheduling,
                previewText: `${context.params.config.city}, ${date}, ${context.data.place}`,
            }),
        });
    }

    return context;
};

const clearResult = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const matchId = Number(context.id);
    const currentUser = context.params.user as User;

    if (!isAdmin(currentUser)) {
        throw new Unprocessable('You are not allowed to clear the match result.');
    }

    const sequelize = context.app.get('sequelizeClient');
    const { matches, players } = sequelize.models;

    let match = await matches.findByPk(matchId);
    if (!match) {
        throw new Unprocessable('The match is not found');
    }
    if (!match.score) {
        throw new Unprocessable('The match is not played yet.');
    }
    if (match.type !== 'final') {
        throw new Unprocessable('You can clear the result only for final matches.');
    }
    if (dayjs().diff(dayjs(match.createdAt), 'week', true) > 4) {
        throw new Unprocessable("It's too late to clear the match result");
    }

    const { tournamentId } = await players.findByPk(match.challengerId);

    await sequelize.query(
        `
            UPDATE matches
               SET place=NULL,
                   playedAt=NULL,
                   comment=NULL,
                   score=NULL,
                   winner=NULL,
                   stat=NULL,
                   swingMatchId=NULL,
                   statAddedBy=NULL,
                   wonByDefault=0,
                   wonByInjury=0,
                   unavailable=0
             WHERE id=:matchId`,
        { replacements: { matchId } }
    );

    // Update match variable
    match = await matches.findByPk(matchId);
    await populateNextFinalMatch(context, { ...match.dataValues });

    await purgeTournamentCache({ tournamentId })(context);

    return context;
};

const addStats = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    // Validate data
    {
        const schema = yup.object().shape({
            link: yup
                .string()
                .required('Link is required.')
                .matches(/^https:\/\/swing\.(tennis|vision)\/matches\/[0-9a-zA-Z_-]{10,100}$/, 'Link is wrong.'),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const matchId = Number(context.id);
    const currentUser = context.params.user as User;

    const sequelize = context.app.get('sequelizeClient');
    const { matches, players, users } = sequelize.models;

    const match = await matches.findByPk(matchId);
    if (!match) {
        throw new Unprocessable('The match is not found');
    }
    if (!match.score) {
        throw new Unprocessable('The match is not played yet');
    }
    if (!match.challengerId || !match.acceptorId) {
        throw new Unprocessable('You have to have all players');
    }

    const { tournamentId } = await players.findByPk(match.challengerId);
    const currentPlayer = await players.findOne({ where: { userId: currentUser.id, tournamentId } });
    if (!currentPlayer) {
        throw new Unprocessable("You're not in this tournament.");
    }
    if (![match.challengerId, match.acceptorId].includes(currentPlayer.id)) {
        throw new Unprocessable("You haven't played in this match.");
    }

    const swingMatchId = context.data.link.slice(context.data.link.lastIndexOf('/') + 1);

    let stat;
    let opponent;
    let autoScored;
    try {
        const points = [];
        let page = 0;

        {
            const response = await axios.get(`https://api.swing.tennis/v1/matches/${swingMatchId}`);
            autoScored = response.data.data.auto_scored;
        }

        while (true) {
            const response = await axios.get(`https://api.swing.tennis/v1/matches/${swingMatchId}/points?page=${page}`);
            points.push(...response.data.data);

            if (
                response.data.meta.next_page &&
                response.data.meta.next_page !== page &&
                response.data.meta.next_page < 4
            ) {
                page = response.data.meta.next_page;
            } else {
                break;
            }
        }

        if (points.length < 48) {
            throw new Unprocessable('Invalid request', {
                errors: {
                    link: 'The score is incomplete. Most likely the match stats are not uploaded to the cloud yet. Try again later.',
                },
            });
        }

        const score = getScore(points);
        const startedAt = dayjs.tz(points[0].started_at);
        const reversedScore = reverseScore(score);
        if (match.score !== score && match.score !== reversedScore) {
            throw new Unprocessable('Invalid request', {
                errors: {
                    link: `The match score (${match.score}) doesn't match the score from the link (${score}).`,
                },
            });
        }

        const matchDate = dayjs.tz(match.playedAt);
        if (Math.abs(matchDate.diff(startedAt, 'day')) > 3) {
            throw new Unprocessable('Invalid request', {
                errors: {
                    link: `The match date (${matchDate.format(
                        'MMM D, YYYY'
                    )}) doesn't match the date from the link (${startedAt.format('MMM D, YYYY')}).`,
                },
            });
        }

        const isReversed = match.score !== score;
        stat = getStat(points, isReversed);

        if (points.length !== stat.challenger.serveTotal + stat.acceptor.serveTotal) {
            throw new Unprocessable('Invalid request', { errors: { link: 'The statistics is broken.' } });
        }
    } catch (e) {
        if (e instanceof Unprocessable) {
            if (autoScored) {
                throw new Unprocessable('Invalid request', {
                    errors: { link: 'We only accept matches tracked via Apple Watch.' },
                });
            }

            throw e;
        } else {
            logEvent(`Stats for match with id=${matchId} was broken (${swingMatchId})`)(context);
            throw new Unprocessable('Invalid request', {
                errors: { link: 'Something wrong with processing this link.' },
            });
        }
    }

    // generate stat image
    {
        const { userId: challengerUserId } = await players.findByPk(match.challengerId);
        const { userId: acceptorUserId } = await players.findByPk(match.acceptorId);
        const challenger = await users.findByPk(challengerUserId);
        const acceptor = await users.findByPk(acceptorUserId);
        opponent = currentUser.id === challengerUserId ? acceptor : challenger;

        const props = encodeURIComponent(
            JSON.stringify({
                match: {
                    ..._pick(match, [
                        'score',
                        'playedAt',
                        'challengerElo',
                        'challengerEloChange',
                        'acceptorElo',
                        'acceptorEloChange',
                    ]),
                    stat: processStat(stat),
                },
                challenger: _pick(challenger, ['firstName', 'lastName', 'avatarObject']),
                acceptor: _pick(acceptor, ['firstName', 'lastName', 'avatarObject']),
                scaleToFit: false,
            })
        );

        const { src, width, height } = await renderImage(`${process.env.TL_URL}/image/match/stat?props=${props}`, {
            deviceScaleFactor: 1200 / 1098,
            type: 'jpg',
        });
        stat.imageUrl = src;
        stat.imageWidth = width;
        stat.imageHeight = height;
    }

    await sequelize.query(
        `
            UPDATE matches
               SET stat=:stat, swingMatchId=:swingMatchId, statAddedBy=:userId
             WHERE id=:matchId`,
        { replacements: { matchId, stat: JSON.stringify(stat), swingMatchId, userId: currentUser.id } }
    );

    context.result = {
        status: 'success',
        data: { ...match.dataValues, stat: processStat(stat), swingMatchId },
    };

    await purgeTournamentCache({ tournamentId })(context);
    await generateBadges()(context);

    // don't wait for the message sent
    const reporter = getPlayerName(currentUser);
    context.app.service('api/emails').create({
        to: [getEmailContact(opponent)],
        subject: `You Have New Match Stats!`,
        html: newMatchStatReportedTemplate({
            config: context.params.config,
            reporter,
            date: dayjs.tz(match.playedAt).format('MMMM D'),
            statImageUrl: stat.imageUrl,
        }),
    });

    return context;
};

const sendMatchNotification = () => async (context: HookContext) => {
    // Don't wait for this function to run just to not let user to wait
    (async () => {
        const { TL_URL } = process.env;
        const currentUser = context.params.user as User;

        const matchId = context.result.id;
        const matchInfo = await getMatchInfo({ app: context.app, currentUser, matchId });

        if (matchInfo.levelType === 'doubles') {
            return;
        }

        try {
            const props = encodeURIComponent(JSON.stringify(matchInfo.imageProps));
            const img = await renderImage(`${TL_URL}/image/match?props=${props}`);

            const previewText = matchInfo.match.wonByDefault
                ? `${matchInfo.winnerName} won by default against ${matchInfo.looserName}`
                : `${matchInfo.winnerName} beat ${matchInfo.looserName}: ${matchInfo.winnerScore}`;

            await context.app.service('api/emails').create({
                to: matchInfo.emailsWithoutCurrentUser,
                subject: `You Have New Match Results!`,
                html: newMatchReportedTemplate({
                    config: context.params.config,
                    reporter: getPlayerName(currentUser),
                    date: matchInfo.formattedPlayedAt,
                    isUnavailable: Boolean(matchInfo.match.unavailable),
                    levelName: matchInfo.levelName,
                    ladderLink: matchInfo.ladderLink,
                    img,
                    previewText,
                    multiLadderMatch: context.result.multiLadderMatch,
                }),
            });
        } catch {
            // do nothing
        }
    })();

    return context;
};

const sendNewRivalryNotification = () => async (context: HookContext) => {
    // Don't wait for this function to run just to not let user to wait
    (async () => {
        const { TL_URL } = process.env;
        const sequelize = context.app.get('sequelizeClient');

        const isDoubles = context.result.challenger2Id || context.result.acceptor2Id;
        if (isDoubles) {
            return;
        }

        // Get users information
        const matchId = context.result.id;
        const [[match]] = await sequelize.query(
            `SELECT uc.id AS challengerUserId,
                uc.firstName AS challengerFirstName,
                uc.lastName AS challengerLastName,
                uc.email AS challengerEmail,
                uc.avatarObject AS challengerAvatar,
                uc.slug AS challengerSlug,
                ua.id AS acceptorUserId,
                ua.firstName AS acceptorFirstName,
                ua.lastName AS acceptorLastName,
                ua.email AS acceptorEmail,
                ua.avatarObject AS acceptorAvatar,
                ua.slug AS acceptorSlug
           FROM matches AS m
           JOIN players AS pc ON m.challengerId=pc.id
           JOIN users AS uc ON pc.userId=uc.id
           JOIN players AS pa ON m.acceptorId=pa.id
           JOIN users AS ua ON pa.userId=ua.id
          WHERE m.id=:matchId`,
            { replacements: { matchId } }
        );

        const ids = [match.challengerUserId, match.acceptorUserId].sort((a, b) => a - b).join('-');

        const ACTION_NAME = `newRivalryStarted${ids}`;
        const [actions] = await sequelize.query(`SELECT * FROM actions WHERE name=:name`, {
            replacements: { name: ACTION_NAME },
        });
        if (actions.length > 0) {
            return;
        }

        // Get all rivalry matches
        const [matches] = (await sequelize.query(
            `SELECT m.id,
                m.challengerId,
                m.acceptorId,
                m.score,
                m.winner,
                m.playedAt,
                pc.userId AS challengerUserId,
                pa.userId AS acceptorUserId
           FROM matches AS m
           JOIN players AS pc ON m.challengerId=pc.id
           JOIN players AS pa ON m.acceptorId=pa.id
          WHERE ${getStatsMatches('m')} AND
                m.challenger2Id IS NULL AND
                m.acceptor2Id IS NULL AND
                ((pc.userId=:challengerUserId AND pa.userId=:acceptorUserId) OR (pc.userId=:acceptorUserId AND pa.userId=:challengerUserId))
       ORDER BY m.playedAt`,
            { replacements: { challengerUserId: match.challengerUserId, acceptorUserId: match.acceptorUserId } }
        )) as [Match[]];

        // Rivalry started when 3 matches played
        if (matches.length !== 3) {
            return;
        }

        try {
            const challenger = {
                id: match.challengerUserId,
                firstName: match.challengerFirstName,
                lastName: match.challengerLastName,
                email: match.challengerEmail,
                avatar: match.challengerAvatar ? JSON.parse(match.challengerAvatar) : null,
                slug: match.challengerSlug,
                phone: '',
            } as User;
            const acceptor = {
                id: match.acceptorUserId,
                firstName: match.acceptorFirstName,
                lastName: match.acceptorLastName,
                email: match.acceptorEmail,
                avatar: match.acceptorAvatar ? JSON.parse(match.acceptorAvatar) : null,
                slug: match.acceptorSlug,
                phone: '',
            } as User;

            for (const user of [challenger, acceptor]) {
                const opponent = challenger.id === user.id ? acceptor : challenger;

                const lead = matches.reduce(
                    (arr: [number, number], item) => {
                        const isWinner =
                            (item.challengerId === item.winner && item.challengerUserId === user.id) ||
                            (item.acceptorId === item.winner && item.acceptorUserId === user.id);

                        if (isWinner) {
                            arr[0]++;
                        } else {
                            arr[1]++;
                        }

                        return arr;
                    },
                    [0, 0]
                );

                const history = matches.map((item) => {
                    const isWinner =
                        (item.challengerId === item.winner && item.challengerUserId === user.id) ||
                        (item.acceptorId === item.winner && item.acceptorUserId === user.id);

                    return {
                        date: dayjs.tz(item.playedAt).format('MMM D, YYYY'),
                        isWinner,
                        score: item.challengerUserId === user.id ? item.score : reverseScore(item.score),
                    };
                });

                const props = encodeURIComponent(JSON.stringify({ avatar1: user.avatar, avatar2: opponent.avatar }));
                const img = await renderImage(`${TL_URL}/image/rivalry?props=${props}`);

                const emails = [getEmailContact(user)];
                const previewText = `New rivalry with ${getPlayerName(opponent)}`;

                context.app.service('api/emails').create({
                    to: emails,
                    subject: 'New Rivalry Started!',
                    html: newRivalryStartedTemplate({
                        config: context.params.config,
                        lead,
                        user,
                        opponent,
                        img,
                        previewText,
                        history,
                    }),
                });
            }

            await sequelize.query(`INSERT INTO actions (name) VALUES (:name)`, {
                replacements: { name: ACTION_NAME },
            });
        } catch {
            // do nothing
        }
    })();

    return context;
};

const setPredictionWinner = () => async (context: HookContext) => {
    const match = context.result;

    if (match.type !== 'final' || match.finalSpot !== 1 || !match.score) {
        return context;
    }

    const { app } = context;
    const sequelize = app.get('sequelizeClient');
    const { tournaments, payments } = sequelize.models;

    const [[info]] = await sequelize.query(
        `SELECT l.slug AS levelSlug,
                p.tournamentId,
                s.year AS seasonYear,
                s.season AS season
           FROM levels AS l, seasons AS s, tournaments AS t, players AS p, matches AS m
          WHERE m.challengerId=p.id
            AND p.tournamentId=t.id
            AND t.levelId=l.id
            AND t.seasonId=s.id
            AND m.id=:matchId`,
        { replacements: { matchId: match.id } }
    );

    const tournamentInfo = await context.app
        .service('api/tournaments')
        .get(1, { query: { year: info.seasonYear, season: info.season, level: info.levelSlug } });

    if (!tournamentInfo.data.hasPredictionContest) {
        return context;
    }

    const predictions = Object.values(tournamentInfo.data.players).filter((player) => player.predictionPoints);
    if (tournamentInfo.data.botPrediction) {
        predictions.push({
            id: BRACKET_BOT_ID,
            stats: {
                rank: 0,
            },
            prediction: tournamentInfo.data.botPrediction,
            predictionPoints: tournamentInfo.data.botPredictionPoints,
        });
    }
    predictions.sort(compareFields('predictionPoints.points-desc', 'predictionPoints.maxPoints-desc', 'stats.rank'));

    const winner = predictions[0];
    if (!winner || winner.id === tournamentInfo.data.predictionWinner) {
        return context;
    }

    await tournaments.update(
        { predictionWinner: winner.id, predictionWonAt: dayjs.tz().format('YYYY-MM-DD HH:mm:ss+00:00') },
        { where: { id: info.tournamentId } }
    );

    if (winner.id !== BRACKET_BOT_ID) {
        const ACTION_NAME = 'bracketBattleWinner';
        const [[action]] = await sequelize.query(`SELECT * FROM actions WHERE tableId=:playerId AND name=:name`, {
            replacements: { playerId: winner.id, name: ACTION_NAME },
        });

        if (!action) {
            await payments.create({
                userId: winner.userId,
                type: 'discount',
                description: `Bracket Battle Winner Award for ${tournamentInfo.data.level}`,
                amount: 500,
            });

            await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:playerId, :name)`, {
                replacements: { playerId: winner.id, name: ACTION_NAME },
            });
        }

        context.usersWithUpdatedBadges ||= new Set();
        context.usersWithUpdatedBadges.add(winner.userId);
    }

    return context;
};

const removeScheduledMatch = () => async (context: HookContext) => {
    const { app } = context;
    const sequelize = context.app.get('sequelizeClient');
    const matchId = Number(context.id);
    const currentUser = context.params.user as User;

    // Validate
    {
        const schema = yup.object().shape({
            reason: yup.string().max(200).required('The reason is required.'),
        });
        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const { matches } = sequelize.models;
    const match = await matches.findByPk(matchId);
    const matchInfo = await getMatchInfo({ app: context.app, currentUser, matchId });

    if (match.score) {
        throw new Unprocessable('The match is already played.');
    }
    if (!matchInfo.hasPlayers || match.initial !== 6) {
        throw new Unprocessable('The match is not scheduled.');
    }
    if (!matchInfo.canManageChallengers && !matchInfo.canManageAcceptors) {
        throw new Unprocessable('You cannot delete this match.');
    }

    // Send notification
    // We don't have to wait for the email sent
    app.service('api/emails').create({
        replyTo: getEmailContact(currentUser),
        to: matchInfo.emailsWithoutCurrentUser,
        subject: `${getPlayerName(currentUser)} Deleted Your Scheduled Match`,
        html: deletedScheduledMatchTemplate({
            config: context.params.config,
            currentUser,
            reason: context.data.reason,
            playedAt: matchInfo.formattedPlayedAt,
        }),
    });

    // purge cache
    await purgeMatchCache({ matchId })(context);

    // remove match
    await matches.destroy({ where: { id: matchId } });

    logEvent(`Scheduled match with id=${matchId} was deleted`)(context);

    return context;
};

const generateMatchBadges = () => async (context: HookContext) => {
    const { app } = context;
    const { players } = app.get('sequelizeClient').models;

    context.usersWithUpdatedBadges ||= new Set();

    // do not wait for it
    (async () => {
        for (const playerId of [context.result.challengerId, context.result.acceptorId]) {
            const player = await players.findByPk(playerId);
            if (player) {
                context.usersWithUpdatedBadges.add(player.userId);
            }
        }

        for (const userId of [...context.usersWithUpdatedBadges]) {
            await updateCurrentWeekUserBadges(app, userId);
        }
    })();

    return context;
};

const populateMultipleLadderMatch = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const { players, tournaments, matches } = sequelize.models;

    if (context.result.type !== 'regular' || !context.result.score) {
        return context;
    }

    const isDoubles = context.result.challenger2Id || context.result.acceptor2Id;
    if (isDoubles) {
        return context;
    }

    const matchId = context.result.id;
    const { challengerId, acceptorId } = context.result;
    const currentUser = context.params.user as User;

    const challenger = await players.findByPk(challengerId);
    const acceptor = await players.findByPk(acceptorId);
    const { seasonId } = await tournaments.findByPk(challenger.tournamentId);

    const [rows] = (await sequelize.query(
        `SELECT p.id,
                p.userId,
                p.tournamentId
           FROM players AS p,
                tournaments AS t,
                levels AS l
          WHERE p.tournamentId=t.id AND
                t.levelId=l.id AND
                l.type="single" AND
                p.isActive=1 AND
                (p.userId=:challengerUserId OR p.userId=:acceptorUserId) AND
                t.seasonId=:seasonId AND
                t.id!=:tournamentId`,
        {
            replacements: {
                seasonId,
                tournamentId: challenger.tournamentId,
                challengerUserId: challenger.userId,
                acceptorUserId: acceptor.userId,
            },
        }
    )) as [Player[]];

    const sameTournaments = Object.values(
        rows.reduce((obj, item) => {
            obj[item.tournamentId] ||= { id: item.tournamentId, users: {} };
            obj[item.tournamentId].users[item.userId] = item.id;
            return obj;
        }, {})
    ).filter((item) => Object.values(item.users).length === 2);

    if (sameTournaments.length === 0) {
        return context;
    }

    const ladders = [challenger.tournamentId];

    for (const tournament of sameTournaments) {
        const newChallengerId = tournament.users[challenger.userId];
        const newAcceptorId = tournament.users[acceptor.userId];

        const { id } = await matches.create({
            ..._omit(context.result, ['id']),
            challengerId: newChallengerId,
            acceptorId: newAcceptorId,
            winner: context.result.challengerId === context.result.winner ? newChallengerId : newAcceptorId,
            sameAs: matchId,
        });

        // set dates the same
        await sequelize.query(`
            UPDATE matches m, (SELECT * FROM matches WHERE id=${matchId}) m1
               SET m.playedAt=m1.playedAt, m.createdAt=m1.createdAt
             WHERE m.id=${id}`);
        await purgeTournamentCache({ tournamentId: tournament.id })(context);

        ladders.push(tournament.id);
    }

    {
        const [levels] = await sequelize.query(
            `SELECT l.name
                   FROM tournaments AS t, levels AS l
                  WHERE t.levelId=l.id AND t.id IN (${ladders.join(',')})
               ORDER BY l.position`
        );
        context.result.multiLadderMatch = levels.map((item) => item.name);

        if (currentUser.id === challenger.userId || currentUser.id === acceptor.userId) {
            const ACTION_NAME = 'multiLadderMatchAlert';
            const [actions] = await sequelize.query(`SELECT * FROM actions WHERE tableId=:tableId AND name=:name`, {
                replacements: { tableId: currentUser.id, name: ACTION_NAME },
            });

            if (actions.length === 0) {
                context.result.multiLadderMatchAlert = true;
                await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:tableId, :name)`, {
                    replacements: { tableId: currentUser.id, name: ACTION_NAME },
                });
            }
        }
    }

    return context;
};

const populatePartners = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const { players, matches } = sequelize.models;

    const { challengerId, acceptorId, challenger2Id, acceptor2Id, score, id } = context.result;
    if (!score) {
        return context;
    }

    if (!challenger2Id) {
        const challenger = await players.findByPk(challengerId);
        if (challenger.partnerId) {
            context.result.challengerId = challenger.partnerId;
            context.result.challenger2Id = challengerId;
            await matches.update(
                { challengerId: challenger.partnerId, challenger2Id: challengerId },
                { where: { id } }
            );
        } else {
            const challengerPartner = await players.findOne({ where: { partnerId: challengerId } });
            if (challengerPartner) {
                context.result.challenger2Id = challengerPartner.id;
                await matches.update({ challenger2Id: challengerPartner.id }, { where: { id } });
            }
        }
    }

    if (!acceptor2Id) {
        const acceptor = await players.findByPk(acceptorId);
        if (acceptor.partnerId) {
            context.result.acceptorId = acceptor.partnerId;
            context.result.acceptor2Id = acceptorId;
            await matches.update({ acceptorId: acceptor.partnerId, acceptor2Id: acceptorId }, { where: { id } });
        } else {
            const acceptorPartner = await players.findOne({ where: { partnerId: acceptorId } });
            if (acceptorPartner) {
                context.result.acceptor2Id = acceptorPartner.id;
                await matches.update({ acceptor2Id: acceptorPartner.id }, { where: { id } });
            }
        }
    }

    return context;
};

const removeSameMatches = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const { id, sameAs } = context.result;
    const { matches } = sequelize.models;

    if (sameAs) {
        await purgeMatchCache({ matchId: sameAs })(context);
        await matches.destroy({ where: { id: sameAs } });

        await matches.update({ sameAs: null }, { where: { id } });
        delete context.result.sameAs;
    }
    if (id) {
        const [rows] = await sequelize.query(`SELECT id FROM matches WHERE sameAs=:sameAs`, {
            replacements: { sameAs: id },
        });

        for (const row of rows) {
            await purgeMatchCache({ matchId: row.id })(context);
            await matches.destroy({ where: { id: row.id } });
        }
    }

    return context;
};

const removeMatch = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const currentUser = context.params.user as User;
    const { config } = context.params;
    const { matches } = sequelize.models;
    const matchId = Number(context.id);
    const matchInfo = await getMatchInfo({ app: context.app, currentUser, matchId });

    // Validation
    {
        const schema = yup.object().shape({
            reason: yup.string().max(200).required('The reason is required.'),
        });
        const errors = getSchemaErrors(schema, context.data);
        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    if (!matchInfo.canDeleteMatch) {
        throw new Unprocessable('You cannot delete this match.');
    }

    context.params.tournamentId = matchInfo.tournamentId;
    context.result = await matches.findByPk(matchId);

    // remove match
    await matches.destroy({ where: { id: matchId } });

    await removeSameMatches()(context);
    await updateEloAndRank()(context);
    await purgeTournamentCache()(context);
    await generateMatchBadges()(context);

    // do not send a message if the admin deleted a match
    if (!isAdmin(currentUser)) {
        // do not wait for it
        context.app.service('api/emails').create({
            to: matchInfo.emailsWithoutCurrentUser,
            replyTo: getEmailContact(currentUser),
            subject: `${getPlayerName(currentUser)} Deleted Your Match`,
            html: getCustomEmail({
                config,
                compose: () => `
<mj-text><b>${getPlayerName(currentUser, true)}</b> deleted your match for ${matchInfo.formattedPlayedAt}.</mj-text>
<mj-text><b>Reason:</b> ${context.data.reason}.</mj-text>
<mj-text padding-bottom="0px">You can contact ${getPlayerName(currentUser, true)} for more information:</mj-text>
<mj-text>
    <b>Email:</b> ${getEmailLink(currentUser)}<br>
    <b>Phone:</b> ${getPhoneLink(currentUser)}
</mj-text>`,
            }),
        });
    }

    logEvent(`Match with id=${matchId} was deleted`)(context);

    return context;
};

const replaceTeammates = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const currentUser = context.params.user as User;
    const { matches } = sequelize.models;
    const matchId = Number(context.id);
    const { players } = context.data;

    // Validate
    {
        const schema = yup.object().shape({
            players: yup.array(yup.number().integer()).length(2, 'Pick a teammate'),
        });
        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const matchInfo = await getMatchInfo({ app: context.app, currentUser, matchId });
    if (!matchInfo.canReplaceTeamPlayers) {
        throw new Unprocessable('You cannot do this task.');
    }

    if (players.every((id: number) => matchInfo.challengerTeamPlayerIds.includes(id))) {
        await matches.update(
            {
                challengerId: players[0],
                challenger2Id: players[1],
            },
            { where: { id: matchId } }
        );
    } else if (players.every((id: number) => matchInfo.acceptorTeamPlayerIds.includes(id))) {
        await matches.update(
            {
                acceptorId: players[0],
                acceptor2Id: players[1],
            },
            { where: { id: matchId } }
        );
    } else {
        throw new Unprocessable('Players are wrong.');
    }

    context.params.tournamentId = matchInfo.tournamentId;
    await purgeTournamentCache()(context);

    return context;
};

const runCustomAction = () => async (context: HookContext) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'checkDuplicatedMatch') {
        await checkDuplicatedMatch()(context);
    } else if (action === 'replacePlayers') {
        await replacePlayers()(context);
    } else if (action === 'scheduleMatch') {
        await scheduleMatch()(context);
    } else if (action === 'removeMatch') {
        await removeMatch()(context);
    } else if (action === 'removeScheduledMatch') {
        await removeScheduledMatch()(context);
    } else if (action === 'clearResult') {
        await clearResult()(context);
    } else if (action === 'addStats') {
        await addStats()(context);
    } else if (action === 'replaceTeammates') {
        await replaceTeammates()(context);
    } else {
        throw new NotFound();
    }

    if (!context.result) {
        context.result = { status: 'success' };
    }
};

export default {
    before: {
        all: [authenticate('jwt')],
        find: [disallow()],
        get: [disallow()],
        create: [
            validateCreate(),
            completePlayedAt(),
            keep(
                'challengerId',
                'acceptorId',
                'challenger2Id',
                'acceptor2Id',
                'score',
                'playedAt',
                'wonByDefault',
                'wonByInjury',
                'unavailable',
                'winner',
                'type',
                'matchFormat'
            ),
            populateWinner(),
        ],
        update: [runCustomAction()],
        patch: [
            validatePatch(),
            completePlayedAt(),
            keep(
                'challengerId',
                'acceptorId',
                'challenger2Id',
                'acceptor2Id',
                'score',
                'playedAt',
                'wonByDefault',
                'wonByInjury',
                'unavailable',
                'winner',
                'matchFormat'
            ),
            populateWinnerForPatch(),
        ],
        remove: [disallow()],
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [
            populatePartners(),
            populateMultipleLadderMatch(),
            updateEloAndRank(),
            purgeTournamentCache(),
            sendMatchNotification(),
            sendNewRivalryNotification(),
            sendEstablishedEloNotification(),
            setPredictionWinner(),
            generateMatchBadges(),
        ],
        update: [],
        patch: [
            populatePartners(),
            removeSameMatches(),
            populateMultipleLadderMatch(),
            updateEloAndRank(),
            purgeTournamentCache(),
            sendMatchNotification(),
            sendNewRivalryNotification(),
            sendEstablishedEloNotification(),
            setPredictionWinner(),
            generateMatchBadges(),
        ],
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
