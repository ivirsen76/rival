import type { HookContext } from '@feathersjs/feathers';
import { disallow } from 'feathers-hooks-common';
import { NotFound } from '@feathersjs/errors';
import dayjs from '../../utils/dayjs';
import compareFields from '../../utils/compareFields';
import { getSeasonName } from '../seasons/helpers';
import { isFullScoreCorrect, isFastScoreCorrect } from '../matches/helpers';
import isObsoleteBadge from '../users/isObsoleteBadge';
import { getStatsMatches } from '../../utils/sqlConditions';

// not hook, just a helper
const getCurrentSeasonUsers = async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');

    const currentDate = dayjs.tz();

    const [[currentSeason]] = await sequelize.query(
        `SELECT *
           FROM seasons
          WHERE startDate<:currentDate
       ORDER BY startDate DESC
          LIMIT 0, 1`,
        { replacements: { currentDate: currentDate.format('YYYY-MM-DD HH:mm:ss') } }
    );
    if (!currentSeason) {
        return [];
    }

    const [userIds] = await sequelize.query(
        `
        SELECT p.userId
          FROM players AS p,
               tournaments AS t
         WHERE p.tournamentId=t.id AND
               t.seasonId=:seasonId`,
        { replacements: { seasonId: currentSeason.id } }
    );

    return new Set(userIds.map((item) => item.userId));
};

// not hook, just a helper
const getAllUsers = async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');

    const [users] = await sequelize.query(`
        SELECT id,
               firstName,
               lastName,
               slug AS userSlug,
               avatar,
               gender
          FROM users`);
    return users.reduce((obj, u) => {
        obj[u.id] = u;
        return obj;
    }, {});
};

const getMostMatchesStat = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');

    const currentUserIds = await getCurrentSeasonUsers(context);

    const [result] = await sequelize.query(`
        SELECT m.id,
                m.challengerId,
                m.acceptorId,
                m.winner,
                pc.userId AS challengerUserId,
                pa.userId AS acceptorUserId,
                pc2.userId AS challenger2UserId,
                pa2.userId AS acceptor2UserId
            FROM matches AS m
            JOIN players AS pc ON m.challengerId=pc.id
            JOIN players AS pa ON m.acceptorId=pa.id
       LEFT JOIN players AS pc2 ON m.challenger2Id=pc2.id
       LEFT JOIN players AS pa2 ON m.acceptor2Id=pa2.id
           WHERE ${getStatsMatches('m')}`);

    const users = {};
    const addMatch = (id, isWin) => {
        if (!id) {
            return;
        }

        if (!users[id]) {
            users[id] = {
                id,
                matches: 0,
                won: 0,
                lost: 0,
                isCurrent: currentUserIds.has(id),
            };
        }

        users[id].matches++;
        users[id].won += isWin ? 1 : 0;
        users[id].lost += isWin ? 0 : 1;
    };

    for (const match of result) {
        addMatch(match.challengerUserId, match.challengerId === match.winner);
        addMatch(match.challenger2UserId, match.challengerId === match.winner);
        addMatch(match.acceptorUserId, match.acceptorId === match.winner);
        addMatch(match.acceptor2UserId, match.acceptorId === match.winner);
    }

    const allUsers = await getAllUsers(context);
    const MIN_MATCHES = 50;
    const list = Object.values(users)
        .filter((item) => item.matches >= MIN_MATCHES)
        .sort((a, b) => b.matches - a.matches)
        .map((u, i) => ({ ...u, ...allUsers[u.id] }));

    context.result = { data: list };

    return context;
};

const getMostSeasonsStat = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');

    const currentUserIds = await getCurrentSeasonUsers(context);

    const [players] = await sequelize.query(`
        SELECT p.userId,
               t.seasonId,
               s.year,
               s.season
          FROM players AS p,
               tournaments AS t,
               seasons AS s
         WHERE p.tournamentId=t.id AND
               t.seasonId=s.id
      ORDER BY s.startDate`);

    const users = {};
    const addUser = (id: number, seasonId: number, seasonName: string) => {
        if (!users[id]) {
            users[id] = {
                id,
                seasons: new Set(),
                firstSeason: seasonName,
                lastSeason: seasonName,
                isCurrent: currentUserIds.has(id),
            };
        }

        users[id].seasons.add(seasonId);
        if (users[id].lastSeason !== seasonName) {
            users[id].lastSeason = seasonName;
        }
    };

    for (const player of players) {
        addUser(player.userId, player.seasonId, getSeasonName(player));
    }

    const allUsers = await getAllUsers(context);
    const MIN_SEASONS = 5;
    const list = Object.values(users)
        .map((u) => ({ ...u, seasons: u.seasons.size, ...allUsers[u.id] }))
        .filter((item) => item.seasons >= MIN_SEASONS)
        .sort((a, b) => b.seasons - a.seasons);

    context.result = { data: list };

    return context;
};

const getHighestTlrStats = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');

    const currentUserIds = await getCurrentSeasonUsers(context);

    const [matches] = await sequelize.query(`
        SELECT m.challengerElo,
               m.acceptorElo,
               m.challengerMatches,
               m.acceptorMatches,
               pc.userId AS challengerUserId,
               pa.userId AS acceptorUserId,
               m.playedAt
          FROM matches AS m
          JOIN (SELECT p.id, p.userId FROM players AS p) AS pc ON m.challengerId=pc.id
          JOIN (SELECT p.id, p.userId FROM players AS p) AS pa ON m.acceptorId=pa.id
         WHERE ${getStatsMatches('m')} AND
               m.challenger2Id IS NULL`);

    const users = {};
    const addUser = (userId: number, elo, date) => {
        if (!users[userId]) {
            users[userId] = {
                id: userId,
                elo,
                date,
                isCurrent: currentUserIds.has(userId),
            };
        }

        if (users[userId].elo < elo) {
            users[userId].elo = elo;
            users[userId].date = date;
        }
    };

    for (const match of matches) {
        if (match.challengerMatches >= 10) {
            addUser(match.challengerUserId, match.challengerElo, match.playedAt);
        }
        if (match.acceptorMatches >= 10) {
            addUser(match.acceptorUserId, match.acceptorElo, match.playedAt);
        }
    }

    const allUsers = await getAllUsers(context);
    const MIN_ELO = 350;
    const list = Object.values(users)
        .filter((item) => item.elo >= MIN_ELO)
        .sort(compareFields('elo-desc', 'date'))
        .map((u) => ({ ...u, ...allUsers[u.id] }));

    context.result = { data: list };

    return context;
};

const getMostProgress = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');

    const currentUserIds = await getCurrentSeasonUsers(context);

    const [matches] = await sequelize.query(`
        SELECT m.challengerElo,
               m.acceptorElo,
               m.challengerMatches,
               m.acceptorMatches,
               pc.userId AS challengerUserId,
               pa.userId AS acceptorUserId
          FROM matches AS m
          JOIN players AS pc ON m.challengerId=pc.id
          JOIN players AS pa ON m.acceptorId=pa.id
         WHERE ${getStatsMatches('m')} AND
               m.challenger2Id IS NULL
      ORDER BY m.playedAt`);

    const users = {};
    const addUser = (id, elo) => {
        if (!users[id]) {
            users[id] = {
                id,
                maxElo: elo,
                initialElo: elo,
                diffElo: 0,
                isCurrent: currentUserIds.has(id),
            };
        }

        if (users[id].maxElo < elo) {
            users[id].maxElo = elo;
            users[id].diffElo = users[id].maxElo - users[id].initialElo;
        }
    };

    for (const match of matches) {
        if (match.challengerMatches >= 10) {
            addUser(match.challengerUserId, match.challengerElo);
        }
        if (match.acceptorMatches >= 10) {
            addUser(match.acceptorUserId, match.acceptorElo);
        }
    }

    const allUsers = await getAllUsers(context);
    const MIN_PROGRESS = 50;
    const list = Object.values(users)
        .filter((item) => item.diffElo >= MIN_PROGRESS)
        .sort((a, b) => b.diffElo - a.diffElo)
        .map((u, i) => ({ ...u, ...allUsers[u.id] }));

    context.result = { data: list };

    return context;
};

const getMostRivalries = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');

    const currentUserIds = await getCurrentSeasonUsers(context);

    const [matches] = await sequelize.query(`
        SELECT pc.userId AS challengerUserId,
               pa.userId AS acceptorUserId
          FROM matches AS m
          JOIN players AS pc ON m.challengerId=pc.id
          JOIN players AS pa ON m.acceptorId=pa.id
         WHERE ${getStatsMatches('m')} AND
               m.challenger2Id IS NULL`);

    const users = {};
    const addUser = (id: number, opponentId: number) => {
        if (!users[id]) {
            users[id] = {
                id,
                rivalries: {},
                isCurrent: currentUserIds.has(id),
            };
        }

        if (!users[id].rivalries[opponentId]) {
            users[id].rivalries[opponentId] = 0;
        }
        users[id].rivalries[opponentId]++;
    };

    for (const match of matches) {
        addUser(match.challengerUserId, match.acceptorUserId);
        addUser(match.acceptorUserId, match.challengerUserId);
    }

    const allUsers = await getAllUsers(context);
    const MIN_RIVALRIES = 5;
    const list = Object.values(users)
        .map((u) => ({
            ...u,
            rivalries: Object.values(u.rivalries).filter((num) => num >= 3).length,
            ...allUsers[u.id],
        }))
        .filter((item) => item.rivalries >= MIN_RIVALRIES)
        .sort((a, b) => b.rivalries - a.rivalries);

    context.result = { data: list };

    return context;
};

const getMostComebacks = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');

    const currentUserIds = await getCurrentSeasonUsers(context);

    const [matches] = await sequelize.query(`
        SELECT m.id,
               m.challengerId,
               m.acceptorId,
               m.winner,
               m.score,
               m.matchFormat,
               pc.userId AS challengerUserId,
               pa.userId AS acceptorUserId,
               pc2.userId AS challenger2UserId,
               pa2.userId AS acceptor2UserId
          FROM matches AS m
          JOIN players AS pc ON m.challengerId=pc.id
          JOIN players AS pa ON m.acceptorId=pa.id
     LEFT JOIN players AS pc2 ON m.challenger2Id=pc2.id
     LEFT JOIN players AS pa2 ON m.acceptor2Id=pa2.id
         WHERE ${getStatsMatches('m')}`);

    const users = {};
    const addUser = (id) => {
        if (!id) {
            return;
        }

        if (!users[id]) {
            users[id] = {
                id,
                comebacks: 0,
                isCurrent: currentUserIds.has(id),
            };
        }

        users[id].comebacks++;
    };

    for (const match of matches) {
        const isFast4 = match.matchFormat === 2;
        const isScoreCorrect = isFast4 ? isFastScoreCorrect : isFullScoreCorrect;

        if (!isScoreCorrect(match.score) || !/^\d+-\d+\s\d+-\d+\s\d+-\d+$/.test(match.score)) {
            continue;
        }
        const challengerWonFirstSet =
            match.score.startsWith('7') || (match.score.startsWith('6') && !match.score.startsWith('6-7'));

        if (match.winner === match.challengerId && !challengerWonFirstSet) {
            addUser(match.challengerUserId);
            addUser(match.challenger2UserId);
        }
        if (match.winner === match.acceptorId && challengerWonFirstSet) {
            addUser(match.acceptorUserId);
            addUser(match.acceptor2UserId);
        }
    }

    const allUsers = await getAllUsers(context);
    const MIN_COMEBACKS = 5;
    const list = Object.values(users)
        .map((u) => ({
            ...u,
            ...allUsers[u.id],
        }))
        .filter((item) => item.comebacks >= MIN_COMEBACKS)
        .sort((a, b) => b.comebacks - a.comebacks);

    context.result = { data: list };

    return context;
};

const getLongestRivalries = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');

    const currentUserIds = await getCurrentSeasonUsers(context);

    const [matches] = await sequelize.query(`
        SELECT m.id,
               m.challengerId,
               m.acceptorId,
               m.winner,
               m.playedAt,
               pc.userId AS challengerUserId,
               pa.userId AS acceptorUserId
          FROM matches AS m
          JOIN players AS pc ON m.challengerId=pc.id
          JOIN players AS pa ON m.acceptorId=pa.id
         WHERE ${getStatsMatches('m')} AND
               m.challenger2Id IS NULL`);

    const rivalries = {};
    const addRivalry = (challengerUserId: number, acceptorUserId: number, winnerUserId: number, playedAt) => {
        const code = [challengerUserId, acceptorUserId].sort((a, b) => a - b).join('-');
        const firstUserId = challengerUserId < acceptorUserId ? challengerUserId : acceptorUserId;
        const secondUserId = challengerUserId > acceptorUserId ? challengerUserId : acceptorUserId;

        if (!rivalries[code]) {
            rivalries[code] = {
                id: code,
                firstUserId,
                secondUserId,
                matches: 0,
                won: 0,
                lost: 0,
                isCurrent: currentUserIds.has(challengerUserId) && currentUserIds.has(acceptorUserId),
                userIds: [firstUserId, secondUserId],
            };
        }

        rivalries[code].matches++;
        rivalries[code].won += firstUserId === winnerUserId ? 1 : 0;
        rivalries[code].lost += firstUserId === winnerUserId ? 0 : 1;
        rivalries[code].lastPlayedAt = playedAt;
    };

    for (const match of matches) {
        addRivalry(
            match.challengerUserId,
            match.acceptorUserId,
            match.winner === match.challengerId ? match.challengerUserId : match.acceptorUserId,
            match.playedAt
        );
    }

    const allUsers = await getAllUsers(context);
    const MIN_MATCHES = 10;
    const list = Object.values(rivalries)
        .filter((item) => item.matches >= MIN_MATCHES)
        .map((u) => ({
            ...u,
            firstUser: allUsers[u.firstUserId],
            secondUser: allUsers[u.secondUserId],
            gender:
                allUsers[u.firstUserId].gender === 'female' || allUsers[u.secondUserId].gender === 'female'
                    ? 'female'
                    : 'male',
        }))
        .sort(compareFields('matches-desc', 'lastPlayedAt'));

    context.result = { data: list };

    return context;
};

const getMostBadges = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');

    const currentUserIds = await getCurrentSeasonUsers(context);

    const [badges] = await sequelize.query(`SELECT userId, code, achievedAt FROM badges`);
    const users = {};
    const addBadge = (id, code, achievedAt) => {
        if (!id) {
            return;
        }

        if (isObsoleteBadge(code)) {
            return;
        }

        if (!users[id]) {
            users[id] = {
                id,
                badges: 0,
                isCurrent: currentUserIds.has(id),
            };
        }

        users[id].badges++;
        users[id].lastAchievedAt = achievedAt;
    };

    for (const badge of badges) {
        addBadge(badge.userId, badge.code, badge.achievedAt);
    }

    const allUsers = await getAllUsers(context);
    const MIN_BADGES = 25;
    const list = Object.values(users)
        .map((u) => ({
            ...u,
            ...allUsers[u.id],
        }))
        .filter((item) => item.badges >= MIN_BADGES)
        .sort(compareFields('badges-desc', 'lastAchievedAt'));

    context.result = { data: list };

    return context;
};

const runCustomAction = () => async (context: HookContext) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'mostMatches') {
        await getMostMatchesStat()(context);
    } else if (action === 'mostSeasons') {
        await getMostSeasonsStat()(context);
    } else if (action === 'highestTlr') {
        await getHighestTlrStats()(context);
    } else if (action === 'mostProgress') {
        await getMostProgress()(context);
    } else if (action === 'mostRivalries') {
        await getMostRivalries()(context);
    } else if (action === 'mostComebacks') {
        await getMostComebacks()(context);
    } else if (action === 'longestRivalries') {
        await getLongestRivalries()(context);
    } else if (action === 'mostBadges') {
        await getMostBadges()(context);
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
        find: [disallow()],
        get: [disallow()],
        create: [disallow()],
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
