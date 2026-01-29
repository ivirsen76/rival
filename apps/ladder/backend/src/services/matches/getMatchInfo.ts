// @ts-nocheck - TODO
import { Unprocessable } from '@feathersjs/errors';
import { getPlayerName, getEmailContact } from '../users/helpers';
import { getSeasonName } from '../seasons/helpers';
import dayjs from '@rival/dayjs';
import _pick from 'lodash/pick';
import getMatchPermissions from './getMatchPermissions';
import { reverseScore } from './calculateElo';
import type { Application } from '@feathersjs/feathers';
import type { Match, User } from '../../types';

const getMatchInfo = async ({
    app,
    currentUser,
    matchId,
    match,
}: {
    app: Application;
    currentUser?: User;
    matchId?: number;
    match?: Match;
}) => {
    const sequelize = app.get('sequelizeClient');
    const { matches, players } = sequelize.models;
    const { TL_URL } = process.env;

    if (!match) {
        match = await matches.findByPk(matchId);

        if (!match) {
            throw new Unprocessable("Match doesn't exist.");
        }
    }

    const [[info]] = await sequelize.query(
        `SELECT p.tournamentId,
                l.name AS levelName,
                l.type AS levelType,
                l.slug AS levelSlug,
                s.year,
                s.season,
                s.startDate,
                s.endDate
           FROM players AS p,
                tournaments AS t,
                levels AS l,
                seasons AS s
          WHERE p.id=:playerId AND
                p.tournamentId=t.id AND
                t.levelId=l.id AND
                t.seasonId=s.id`,
        { replacements: { playerId: match.challengerId || match.acceptorId } }
    );

    if (!info) {
        throw new Unprocessable("Match doesn't exist.");
    }

    const playerIds = [];
    const challengerPlayerIds = [];
    const acceptorPlayerIds = [];
    const isDoubles = info.levelType === 'doubles';
    const isDoublesTeam = info.levelType === 'doubles-team';
    const challengerTeamPlayerIds = [];
    const acceptorTeamPlayerIds = [];

    for (const playerId of [match.challengerId, match.acceptorId]) {
        if (!playerId) {
            continue;
        }
        const group = playerId === match.challengerId ? challengerPlayerIds : acceptorPlayerIds;
        playerIds.push(playerId);
        group.push(playerId);

        const anotherPlayerId = playerId === match.challengerId ? match.challenger2Id : match.acceptor2Id;
        if (anotherPlayerId) {
            playerIds.push(anotherPlayerId);
            group.push(anotherPlayerId);
        }

        // check doubles teammates as well
        if (info.levelType === 'doubles-team' && !anotherPlayerId) {
            const player = await players.findByPk(playerId);
            const captainId = player.partnerId || playerId;
            if (!playerIds.includes(captainId)) {
                // put captain to the first position
                playerIds.unshift(captainId);
                group.unshift(captainId);
            }

            const [rows] = await sequelize.query(`SELECT id FROM players WHERE partnerId=:partnerId`, {
                replacements: { partnerId: captainId },
            });
            for (const row of rows) {
                if (!playerIds.includes(row.id)) {
                    playerIds.push(row.id);
                    group.push(row.id);
                }
            }
        }

        // populate team playerIds
        if (info.levelType === 'doubles-team') {
            const teamPlayerIds = playerId === match.challengerId ? challengerTeamPlayerIds : acceptorTeamPlayerIds;
            const player = await players.findByPk(playerId);

            const captainId = player.partnerId || playerId;
            const [teammates] = await sequelize.query(`SELECT id FROM players WHERE partnerId=:partnerId`, {
                replacements: { partnerId: captainId },
            });

            teamPlayerIds.push(captainId);
            teamPlayerIds.push(...teammates.map((item) => item.id));
        }
    }

    const [allPlayers] = await sequelize.query(
        `SELECT id, partnerId, teamName FROM players WHERE tournamentId=:tournamentId`,
        { replacements: { tournamentId: info.tournamentId } }
    );
    const teamNames = allPlayers
        .filter((item) => item.teamName)
        .reduce((obj, item) => {
            obj[item.id] = item.teamName;
            return obj;
        }, {});

    const [users] = await sequelize.query(
        `SELECT u.id,
                u.firstName,
                u.lastName,
                u.slug,
                u.email,
                u.phone,
                u.avatar,
                p.id AS playerId,
                p.partnerId,
                p.isActive,
                p.tournamentId
           FROM users AS u,
                players AS p
          WHERE p.userId=u.id AND
                p.id IN (${playerIds.join(',')})
       ORDER BY FIELD(p.id, ${playerIds.join(',')})`
    );
    for (const user of users) {
        const teamName = teamNames[user.playerId] || teamNames[user.partnerId];
        if (teamName) {
            user.teamName = teamName;
        }
    }
    const emails = users.map((user) => ({
        id: user.id,
        ...getEmailContact(user),
    }));
    const emailsWithoutCurrentUser = currentUser ? emails.filter((user) => user.id !== currentUser.id) : emails;

    if (users.some((user) => user.tournamentId !== info.tournamentId)) {
        throw new Unprocessable('Players are not from the same ladder.');
    }

    const challengers = users.filter((user) => challengerPlayerIds.includes(user.playerId));
    const acceptors = users.filter((user) => acceptorPlayerIds.includes(user.playerId));

    const challengerEmails = challengers.map((user) => ({ id: user.id, ...getEmailContact(user) }));
    const acceptorEmails = acceptors.map((user) => ({ id: user.id, ...getEmailContact(user) }));

    // populate partnerIds for doubles
    if (challengerPlayerIds.length > 1) {
        challengers.forEach((user) => {
            user.partnerIds = challengerPlayerIds;
        });
    }
    if (acceptorPlayerIds.length > 1) {
        acceptors.forEach((user) => {
            user.partnerIds = acceptorPlayerIds;
        });
    }

    const challengerName = getPlayerName(challengers);
    const acceptorName = getPlayerName(acceptors);
    const challengerLinkedName = getPlayerName(challengers, true);
    const acceptorLinkedName = getPlayerName(acceptors, true);

    const challenger = await players.findByPk(match.challengerId);
    const challenger2 = await players.findByPk(match.challenger2Id);
    const acceptor = await players.findByPk(match.acceptorId);
    const acceptor2 = await players.findByPk(match.acceptor2Id);

    const currentDate = dayjs.tz();
    const playedAt = dayjs.tz(match.playedAt);
    const formattedPlayedAt = playedAt.format('ddd, MMM D, h:mm A');
    const isThisWeek = match.playedAt && currentDate.isSameOrBefore(playedAt, 'isoWeek');
    const isTournamentOver = currentDate.isAfter(dayjs.tz(info.endDate));

    // check doubles captains
    const currentPlayer = currentUser
        ? await players.findOne({
              where: { userId: currentUser.id, tournamentId: info.tournamentId },
          })
        : null;

    const canManageChallengers =
        currentPlayer &&
        challengers.length > 0 &&
        (currentPlayer.id === challengers[0].playerId || currentPlayer.id === challengers[0].partnerId);
    const canManageAcceptors =
        currentPlayer &&
        acceptors.length > 0 &&
        (currentPlayer.id === acceptors[0].playerId || currentPlayer.id === acceptors[0].partnerId);

    const sameMatchIds = (match.same || '')
        .split(',')
        .map(Number)
        .filter((id) => id && id !== matchId);

    const hasPlayers = (() => {
        if (!match.challengerId || !match.acceptorId) {
            return false;
        }
        if (isDoubles) {
            return Boolean(match.challenger2Id && match.acceptor2Id);
        }
        return true;
    })();

    const imageProps = {
        match: _pick(match, [
            'type',
            'initial',
            'score',
            'winner',
            'playedAt',
            'challengerId',
            'acceptorId',
            'challenger2Id',
            'acceptor2Id',
            'challengerPoints',
            'acceptorPoints',
            'challengerRank',
            'acceptorRank',
            'challengerSeed',
            'acceptorSeed',
            'wonByDefault',
            'unavailable',
            'wonByInjury',
        ]),
        players: users.reduce((obj, item) => {
            obj[item.playerId] = {
                ..._pick(item, ['id', 'firstName', 'lastName', 'avatar', 'teamName', 'partnerIds']),
                id: item.playerId,
                userId: item.id,
            };
            return obj;
        }, {}),
        showHeader: false,
    };

    return {
        match,
        tournamentId: info.tournamentId,
        levelType: info.levelType,
        levelName: info.levelName,
        ladderLink: `${TL_URL}/season/${info.year}/${info.season}/${info.levelSlug}`,
        seasonName: getSeasonName(info),
        seasonStartDate: info.startDate,
        seasonEndDate: info.endDate,
        canManageChallengers,
        canManageAcceptors,
        hasChallengers: challengers.length > 0,
        hasAcceptors: acceptors.length > 0,
        hasPlayers,
        users,
        emails,
        emailsWithoutCurrentUser,
        challengers,
        acceptors,
        challengerEmails,
        acceptorEmails,
        challengerTeamPlayerIds,
        acceptorTeamPlayerIds,
        challengerName:
            isDoublesTeam && challenger
                ? `${teamNames[challenger.partnerId || challenger.id]} (${challengerName})`
                : challengerName,
        acceptorName:
            isDoublesTeam && acceptor
                ? `${teamNames[acceptor.partnerId || acceptor.id]} (${acceptorName})`
                : acceptorName,
        challengerLinkedName:
            isDoublesTeam && challenger
                ? `${teamNames[challenger.partnerId || challenger.id]} (${challengerLinkedName})`
                : challengerLinkedName,
        acceptorLinkedName:
            isDoublesTeam && acceptor
                ? `${teamNames[acceptor.partnerId || acceptor.id]} (${acceptorLinkedName})`
                : acceptorLinkedName,
        winnerName: match.winner === match.challengerId ? challengerName : acceptorName,
        looserName: match.winner === match.acceptorId ? challengerName : acceptorName,
        winnerScore: match.winner === match.challengerId || !match.score ? match.score : reverseScore(match.score),
        isChallengerActive: challengers.every((user) => user.isActive),
        isAcceptorActive: acceptors.every((user) => user.isActive),
        formattedPlayedAt,
        sameMatchIds,
        imageProps,
        ...getMatchPermissions({
            levelType: info.levelType,
            match,
            currentUser,
            currentPlayer,
            challenger,
            challenger2,
            acceptor,
            acceptor2,
            isThisWeek,
            isTournamentOver,
            currentDate: currentDate.format('YYYY-MM-DD HH:mm:ss'),
            players: allPlayers,
        }),
    };
};

export default getMatchInfo;
