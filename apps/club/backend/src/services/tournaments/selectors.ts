// @ts-nocheck TODO
import { SEASON_OPTIONS, POOL_PARTNER_ID } from '../../constants';
import _pick from 'lodash/pick';
import _shuffle from 'lodash/shuffle';
import dayjs from '../../utils/dayjs';
import processStat from '../matches/processStat';
import getBetPoints from './getBetPoints';
import { getJoinDoublesLink } from '../players/helpers';
import { getPartners } from './helpers';
import { limitedPromiseAll } from '../../helpers';
import { projectedTlrMultipliers } from '../../config';
import type { Config } from '../../types';

const STAT_COUNT = 5;
const SWITCH_LADDER_DEADLINE_WEEKS = 2;

export const shuffleRange = (array: any[], ranges: number[][]) => {
    const result = [...array];

    // eslint-disable-next-line
    for (let [from, to] of ranges) {
        to = Math.min(to, array.length - 1);

        if (to - from < 1) {
            continue;
        }

        result.splice(from, to - from + 1, ..._shuffle(result.slice(from, to + 1)));
    }

    return result;
};

export const getSeeds = (players, isShuffle = false) => {
    if (isShuffle && [4, 6, 8, 12, 16].includes(players.length)) {
        players = shuffleRange(players, [
            [2, 3],
            [4, 7],
            [8, 15],
        ]);
    }

    if (players.length === 2) {
        return [{ finalSpot: 1, challenger: players[0], acceptor: players[1] }];
    }

    if (players.length === 3) {
        return [
            { finalSpot: 1, challenger: players[0] },
            { finalSpot: 2, challenger: players[2], acceptor: players[1] },
        ];
    }

    if (players.length === 4) {
        return [
            { finalSpot: 3, challenger: players[0], acceptor: players[3] },
            { finalSpot: 2, challenger: players[2], acceptor: players[1] },
        ];
    }

    if (players.length === 5) {
        return [
            { finalSpot: 3, challenger: players[0] },
            { finalSpot: 2, challenger: players[2], acceptor: players[1] },
            { finalSpot: 6, challenger: players[4], acceptor: players[3] },
        ];
    }

    if (players.length === 6) {
        return [
            { finalSpot: 3, challenger: players[0] },
            { finalSpot: 2, acceptor: players[1] },
            { finalSpot: 6, challenger: players[4], acceptor: players[3] },
            { finalSpot: 5, challenger: players[2], acceptor: players[5] },
        ];
    }

    if (players.length === 7) {
        return [
            { finalSpot: 3, challenger: players[0] },
            { finalSpot: 6, challenger: players[4], acceptor: players[3] },
            { finalSpot: 5, challenger: players[2], acceptor: players[5] },
            { finalSpot: 4, challenger: players[6], acceptor: players[1] },
        ];
    }

    if (players.length === 8) {
        return [
            { finalSpot: 7, challenger: players[0], acceptor: players[7] },
            { finalSpot: 6, challenger: players[4], acceptor: players[3] },
            { finalSpot: 5, challenger: players[2], acceptor: players[5] },
            { finalSpot: 4, challenger: players[6], acceptor: players[1] },
        ];
    }

    if (players.length === 9) {
        return [
            { finalSpot: 7, challenger: players[0] },
            { finalSpot: 6, challenger: players[4], acceptor: players[3] },
            { finalSpot: 5, challenger: players[2], acceptor: players[5] },
            { finalSpot: 4, challenger: players[6], acceptor: players[1] },
            { finalSpot: 14, challenger: players[8], acceptor: players[7] },
        ];
    }

    if (players.length === 10) {
        return [
            { finalSpot: 7, challenger: players[0] },
            { finalSpot: 4, acceptor: players[1] },
            { finalSpot: 6, challenger: players[4], acceptor: players[3] },
            { finalSpot: 5, challenger: players[2], acceptor: players[5] },
            { finalSpot: 14, challenger: players[8], acceptor: players[7] },
            { finalSpot: 9, challenger: players[6], acceptor: players[9] },
        ];
    }

    if (players.length === 11) {
        return [
            { finalSpot: 7, challenger: players[0] },
            { finalSpot: 5, challenger: players[2] },
            { finalSpot: 4, acceptor: players[1] },
            { finalSpot: 6, challenger: players[4], acceptor: players[3] },
            { finalSpot: 14, challenger: players[8], acceptor: players[7] },
            { finalSpot: 10, challenger: players[10], acceptor: players[5] },
            { finalSpot: 9, challenger: players[6], acceptor: players[9] },
        ];
    }

    if (players.length === 12) {
        return [
            { finalSpot: 7, challenger: players[0] },
            { finalSpot: 6, acceptor: players[3] },
            { finalSpot: 5, challenger: players[2] },
            { finalSpot: 4, acceptor: players[1] },
            { finalSpot: 14, challenger: players[8], acceptor: players[7] },
            { finalSpot: 13, challenger: players[4], acceptor: players[11] },
            { finalSpot: 10, challenger: players[10], acceptor: players[5] },
            { finalSpot: 9, challenger: players[6], acceptor: players[9] },
        ];
    }

    if (players.length === 13) {
        return [
            { finalSpot: 7, challenger: players[0] },
            { finalSpot: 5, challenger: players[2] },
            { finalSpot: 4, acceptor: players[1] },
            { finalSpot: 14, challenger: players[8], acceptor: players[7] },
            { finalSpot: 13, challenger: players[4], acceptor: players[11] },
            { finalSpot: 12, challenger: players[12], acceptor: players[3] },
            { finalSpot: 10, challenger: players[10], acceptor: players[5] },
            { finalSpot: 9, challenger: players[6], acceptor: players[9] },
        ];
    }

    if (players.length === 14) {
        return [
            { finalSpot: 7, challenger: players[0] },
            { finalSpot: 4, acceptor: players[1] },
            { finalSpot: 14, challenger: players[8], acceptor: players[7] },
            { finalSpot: 13, challenger: players[4], acceptor: players[11] },
            { finalSpot: 12, challenger: players[12], acceptor: players[3] },
            { finalSpot: 11, challenger: players[2], acceptor: players[13] },
            { finalSpot: 10, challenger: players[10], acceptor: players[5] },
            { finalSpot: 9, challenger: players[6], acceptor: players[9] },
        ];
    }

    if (players.length === 15) {
        return [
            { finalSpot: 7, challenger: players[0] },
            { finalSpot: 14, challenger: players[8], acceptor: players[7] },
            { finalSpot: 13, challenger: players[4], acceptor: players[11] },
            { finalSpot: 12, challenger: players[12], acceptor: players[3] },
            { finalSpot: 11, challenger: players[2], acceptor: players[13] },
            { finalSpot: 10, challenger: players[10], acceptor: players[5] },
            { finalSpot: 9, challenger: players[6], acceptor: players[9] },
            { finalSpot: 8, challenger: players[14], acceptor: players[1] },
        ];
    }

    if (players.length === 16) {
        return [
            { finalSpot: 15, challenger: players[0], acceptor: players[15] },
            { finalSpot: 14, challenger: players[8], acceptor: players[7] },
            { finalSpot: 13, challenger: players[4], acceptor: players[11] },
            { finalSpot: 12, challenger: players[12], acceptor: players[3] },
            { finalSpot: 11, challenger: players[2], acceptor: players[13] },
            { finalSpot: 10, challenger: players[10], acceptor: players[5] },
            { finalSpot: 9, challenger: players[6], acceptor: players[9] },
            { finalSpot: 8, challenger: players[14], acceptor: players[1] },
        ];
    }

    return [];
};

const getSeasonName = (data) => {
    const seasonName = SEASON_OPTIONS.find((option) => option.value === data['season.season'])!.label;
    return `${data['season.year']} ${seasonName}`;
};

const getEloTrend = (data, config: Config) => {
    const all = {};
    const seasonEnd = dayjs.tz(data['season.endDate']).format('YYYY-MM-DD HH:mm:ss');
    const dateYearAgo = dayjs
        .min(dayjs.tz(), dayjs.tz(data['season.endDate']))
        .subtract(1, 'year')
        .format('YYYY-MM-DD HH:mm:ss');
    const tournamentId = data.id;

    const addUser = (id: number) => {
        if (!all[id]) {
            all[id] = {
                elo: null,
                matches: 0,
                won: 0,
                lost: 0,
                trend: [],
                isEloEstablished: false,
            };
        }

        return all[id];
    };

    for (const match of data.eloMatches) {
        if (match.playedAt > seasonEnd && match.tournamentId !== tournamentId) {
            continue;
        }
        if (match.wonByDefault) {
            continue;
        }

        const challenger = addUser(match.challengerUserId);
        challenger.elo = match.challengerElo;
        challenger.matches++;
        challenger.won += match.challengerId === match.winner ? 1 : 0;
        challenger.lost += match.challengerId === match.winner ? 0 : 1;
        if (!challenger.isEloEstablished && challenger.matches >= config.minMatchesToEstablishTlr) {
            challenger.isEloEstablished = true;
        }

        const acceptor = addUser(match.acceptorUserId);
        acceptor.elo = match.acceptorElo;
        acceptor.matches++;
        acceptor.won += match.acceptorId === match.winner ? 1 : 0;
        acceptor.lost += match.acceptorId === match.winner ? 0 : 1;
        if (!acceptor.isEloEstablished && acceptor.matches >= config.minMatchesToEstablishTlr) {
            acceptor.isEloEstablished = true;
        }

        if (match.playedAt > dateYearAgo) {
            if (challenger.isEloEstablished) {
                challenger.trend.push(match.challengerElo);
            }

            if (acceptor.isEloEstablished) {
                acceptor.trend.push(match.acceptorElo);
            }
        }
    }

    for (const user of Object.values(all)) {
        if (user.trend.length > 10) {
            user.trend = user.trend.slice(user.trend.length - 10);
        } else if (user.trend.length < 10) {
            const firstElo = user.trend[0] || 350;
            user.trend.unshift(...new Array(10 - user.trend.length).fill(firstElo));
        }
    }

    return all;
};

const getHighTlrRestrictions = (data, config) => {
    if (data['level.type'] !== 'single') {
        return {};
    }

    const obj = {};
    const seasonStart = data['season.startDate'];
    const seasonEnd = data['season.endDate'];
    const levelBaseTlr = data['level.baseTlr'];

    for (let i = data.eloMatches.length - 1; i >= 0; i--) {
        const match = data.eloMatches[i];
        if (match.playedAt >= seasonEnd) {
            continue;
        }

        // Populate initial values
        obj[match.challengerUserId] ||= { startingTlr: 0, initialTlr: 0, projectedTlr: 0 };
        const challengerObj = obj[match.challengerUserId];

        obj[match.acceptorUserId] ||= { startingTlr: 0, initialTlr: 0, projectedTlr: 0 };
        const acceptorObj = obj[match.acceptorUserId];

        if (match.playedAt >= seasonStart) {
            // Get initial TLR
            if (challengerObj.initialTlr === 0 && match.challengerMatches === config.minMatchesToEstablishTlr) {
                challengerObj.initialTlr = match.challengerElo;
            }
            if (acceptorObj.initialTlr === 0 && match.acceptorMatches === config.minMatchesToEstablishTlr) {
                acceptorObj.initialTlr = match.acceptorElo;
            }

            // Get projected TLR
            if (
                challengerObj.initialTlr === 0 &&
                challengerObj.projectedTlr === 0 &&
                match.challengerMatches < config.minMatchesToEstablishTlr
            ) {
                const multiplier = projectedTlrMultipliers[match.challengerMatches];
                challengerObj.projectedTlr = multiplier
                    ? levelBaseTlr + (match.challengerElo - levelBaseTlr) * multiplier
                    : 1; // 1 would indicated that the value has been changed
            }

            if (
                acceptorObj.initialTlr === 0 &&
                acceptorObj.projectedTlr === 0 &&
                match.acceptorMatches < config.minMatchesToEstablishTlr
            ) {
                const multiplier = projectedTlrMultipliers[match.acceptorMatches];
                acceptorObj.projectedTlr = multiplier
                    ? levelBaseTlr + (match.acceptorElo - levelBaseTlr) * multiplier
                    : 1; // 1 would indicated that the value has been changed
            }
        }

        // Get starting TLR
        if (match.playedAt <= seasonStart) {
            if (challengerObj.startingTlr === 0 && match.challengerMatches >= config.minMatchesToEstablishTlr) {
                challengerObj.startingTlr = match.challengerElo;
            }
            if (acceptorObj.startingTlr === 0 && match.acceptorMatches >= config.minMatchesToEstablishTlr) {
                acceptorObj.startingTlr = match.acceptorElo;
            }
        }
    }

    return obj;
};

export const getPlayerPoints = (data, currentDate) => {
    const matches = data.matches.filter((match) => match.score && match.type === 'regular');
    const seasonEnd = dayjs.tz(data['season.endDate']);
    const currentDateString = dayjs.tz(currentDate).format('YYYY-MM-DD HH:mm:ss');
    const isLive = seasonEnd.format('YYYY-MM-DD HH:mm:ss') > currentDateString;
    const isDoublesTeam = data['level.type'] === 'doubles-team';

    const captains = data.users.reduce((obj, user) => {
        if (user.players.partnerId) {
            obj[user.players.id] = user.players.partnerId;
        }
        return obj;
    }, {});
    const captainsWithTeam = new Set(Object.values(captains));

    const result = data.users.reduce((obj, user) => {
        obj[user.players.id] = {
            id: user.players.id,
            total: {
                matches: 0,
                proposals: 0,
            },
            matchesWon: 0,
            matchesLost: 0,
            rank: 1,
            points: 0,
            prev: {
                matchesWon: 0,
                matchesLost: 0,
                rank: 1,
                points: 0,
            },
            live: {
                matchesWon: 0,
                matchesLost: 0,
                points: 0,
            },
        };
        return obj;
    }, {});

    const getResult = (playerId: number) => result[captains[playerId] || playerId];

    const addActivityData = (playerId: number, match) => {
        if (!playerId || !getResult(playerId)) {
            return;
        }

        if (match.score) {
            getResult(playerId).total.matches++;
        } else if (match.initial === 1) {
            getResult(playerId).total.proposals++;
        } else if (match.initial === 2) {
            // do nothing for former challenges
        } else {
            getResult(playerId).total.matches++;
        }
    };

    // get total matches, proposals
    for (const match of data.matches) {
        addActivityData(match.challengerId, match);
        addActivityData(match.acceptorId, match);

        if (!isDoublesTeam) {
            addActivityData(match.challenger2Id, match);
            addActivityData(match.acceptor2Id, match);
        }
    }

    // Get live matches
    if (isLive) {
        for (const match of matches) {
            if (getResult(match.challengerId)) {
                getResult(match.challengerId).live.matchesWon += match.winner === match.challengerId ? 1 : 0;
                getResult(match.challengerId).live.matchesLost += match.winner === match.challengerId ? 0 : 1;
                getResult(match.challengerId).live.points += match.challengerPoints;
            }
            if (getResult(match.acceptorId)) {
                getResult(match.acceptorId).live.matchesWon += match.winner === match.acceptorId ? 1 : 0;
                getResult(match.acceptorId).live.matchesLost += match.winner === match.acceptorId ? 0 : 1;
                getResult(match.acceptorId).live.points += match.acceptorPoints;
            }
            if (!isDoublesTeam && getResult(match.challenger2Id)) {
                getResult(match.challenger2Id).live.matchesWon += match.winner === match.challengerId ? 1 : 0;
                getResult(match.challenger2Id).live.matchesLost += match.winner === match.challengerId ? 0 : 1;
                getResult(match.challenger2Id).live.points += match.challenger2Points;
            }
            if (!isDoublesTeam && getResult(match.acceptor2Id)) {
                getResult(match.acceptor2Id).live.matchesWon += match.winner === match.acceptorId ? 1 : 0;
                getResult(match.acceptor2Id).live.matchesLost += match.winner === match.acceptorId ? 0 : 1;
                getResult(match.acceptor2Id).live.points += match.acceptor2Points;
            }
        }

        const sorted = Object.values(result)
            .filter((item) => !isDoublesTeam || captainsWithTeam.has(item.id))
            .sort((a, b) => b.live.points - a.live.points);
        let prevRank = 0;
        for (let i = 0; i < sorted.length; i++) {
            const { id, live } = sorted[i];
            if (i === 0 || live.points < sorted[i - 1].live.points) {
                prevRank = getResult(id).live.rank = i + 1;
            } else {
                getResult(id).live.rank = prevRank;
            }
        }
    }

    let index = matches.length - 1;
    let start = dayjs.tz(data['season.startDate']);
    while (start.format('YYYY-MM-DD HH:mm:ss') < seasonEnd.format('YYYY-MM-DD HH:mm:ss')) {
        const end = dayjs.min(seasonEnd, start.add(1, 'week'));
        const endString = end.format('YYYY-MM-DD HH:mm:ss');
        if (currentDateString < endString) {
            break;
        }

        for (const value of Object.values(result)) {
            value.prev.matchesWon = value.matchesWon;
            value.prev.matchesLost = value.matchesLost;
            value.prev.rank = value.rank;
            value.prev.points = value.points;
        }

        while (index >= 0) {
            const match = matches[index];
            if (match.playedAt >= endString) {
                break;
            }

            if (getResult(match.challengerId)) {
                getResult(match.challengerId).matchesWon += match.winner === match.challengerId ? 1 : 0;
                getResult(match.challengerId).matchesLost += match.winner === match.challengerId ? 0 : 1;
                getResult(match.challengerId).points += match.challengerPoints;
            }

            if (getResult(match.acceptorId)) {
                getResult(match.acceptorId).matchesWon += match.winner === match.acceptorId ? 1 : 0;
                getResult(match.acceptorId).matchesLost += match.winner === match.acceptorId ? 0 : 1;
                getResult(match.acceptorId).points += match.acceptorPoints;
            }

            if (!isDoublesTeam && getResult(match.challenger2Id)) {
                getResult(match.challenger2Id).matchesWon += match.winner === match.challengerId ? 1 : 0;
                getResult(match.challenger2Id).matchesLost += match.winner === match.challengerId ? 0 : 1;
                getResult(match.challenger2Id).points += match.challenger2Points;
            }

            if (!isDoublesTeam && getResult(match.acceptor2Id)) {
                getResult(match.acceptor2Id).matchesWon += match.winner === match.acceptorId ? 1 : 0;
                getResult(match.acceptor2Id).matchesLost += match.winner === match.acceptorId ? 0 : 1;
                getResult(match.acceptor2Id).points += match.acceptor2Points;
            }

            index--;
        }

        const sorted = Object.values(result)
            .filter((item) => !isDoublesTeam || captainsWithTeam.has(item.id))
            .sort((a, b) => b.points - a.points);
        let prevRank = 0;
        for (let i = 0; i < sorted.length; i++) {
            const { id, points } = sorted[i];
            if (i === 0 || points < sorted[i - 1].points) {
                prevRank = getResult(id).rank = i + 1;
            } else {
                getResult(id).rank = prevRank;
            }
        }

        start = start.add(1, 'week');
    }

    for (const value of Object.values(result)) {
        value.matches = value.matchesWon + value.matchesLost;
        value.matchesWonChange = value.matchesWon - value.prev.matchesWon;
        value.matchesLostChange = value.matchesLost - value.prev.matchesLost;
        value.rankChange = value.prev.rank - value.rank;
        value.pointsChange = value.points - value.prev.points;
        delete value.prev;
        delete value.id;

        if (isLive) {
            value.live.matches = value.live.matchesWon + value.live.matchesLost;
            value.live.matchesWonChange = value.live.matchesWon - value.matchesWon;
            value.live.matchesLostChange = value.live.matchesLost - value.matchesLost;
            value.live.rankChange = value.rank - value.live.rank;
            value.live.pointsChange = value.live.points - value.points;
        }
    }

    return result;
};

const getTopUpsetMatches = (data, config) => {
    const getEloDifference = (match) => {
        const diff = match.challengerElo - match.challengerEloChange - (match.acceptorElo - match.acceptorEloChange);
        return match.winner === match.challengerId ? diff : -diff;
    };

    return data.matches
        .filter(
            (match) =>
                match.score &&
                !match.wonByDefault &&
                !match.wonByInjury &&
                match.challengerMatches > config.minMatchesToEstablishTlr &&
                match.acceptorMatches > config.minMatchesToEstablishTlr &&
                getEloDifference(match) <= -20
        )
        .sort((a, b) => getEloDifference(a) - getEloDifference(b))
        .slice(0, STAT_COUNT);
};

const getMostProgress = (data, config: Config) => {
    const progress = {};

    const userToPlayerId = data.users.reduce((obj, user) => {
        obj[user.id] = user.players.id;
        return obj;
    }, {});

    const playersWithMatches = data.matches
        .filter((match) => match.score && !match.wonByDefault)
        .reduce((set, match) => {
            set.add(match.challengerId);
            set.add(match.challenger2Id);
            set.add(match.acceptorId);
            set.add(match.acceptor2Id);
            return set;
        }, new Set());

    const add = (id, eloIn, eloOut) => {
        progress[id] ||= {
            id,
            playerId: userToPlayerId[id],
            first: eloIn,
            last: eloOut,
        };
        progress[id].last = eloOut;
    };

    data.eloMatches
        .filter((match) => match.seasonId === data.seasonId)
        .forEach((match) => {
            if (userToPlayerId[match.challengerUserId] && match.challengerMatches > config.minMatchesToEstablishTlr) {
                add(match.challengerUserId, match.challengerElo - match.challengerEloChange, match.challengerElo);
            }

            if (userToPlayerId[match.acceptorUserId] && match.acceptorMatches > config.minMatchesToEstablishTlr) {
                add(match.acceptorUserId, match.acceptorElo - match.acceptorEloChange, match.acceptorElo);
            }
        });

    return Object.values(progress)
        .map((obj) => ({ id: obj.playerId, progress: obj.last - obj.first, elo: obj.last }))
        .filter((obj) => obj.progress > 0 && playersWithMatches.has(obj.id))
        .sort((a, b) => (b.progress === a.progress ? b.id - a.id : b.progress - a.progress))
        .slice(0, STAT_COUNT);
};

const getMostMatches = (data) => {
    const isDoublesTeam = data['level.type'] === 'doubles-team';
    const progress = {};

    const adjustedPlayerIds = data.users.reduce((obj, item) => {
        obj[item.players.id] = item.players.partnerId || item.players.id;
        return obj;
    }, {});

    const add = (id) => {
        if (!id) {
            return;
        }

        const adjustedId = adjustedPlayerIds[id] || id;

        progress[adjustedId] ||= { id: adjustedId, matches: 0 };
        progress[adjustedId].matches++;
    };

    data.matches
        .filter((match) => match.score && !match.wonByDefault)
        .forEach((match) => {
            add(match.challengerId);
            add(match.acceptorId);

            if (!isDoublesTeam) {
                add(match.challenger2Id);
                add(match.acceptor2Id);
            }
        });

    return Object.values(progress)
        .sort((a, b) => (b.matches === a.matches ? b.id - a.id : b.matches - a.matches))
        .slice(0, STAT_COUNT);
};

const getTopForm = (data, config) => {
    const list = {};

    const userToPlayerId = data.users.reduce((obj, user) => {
        obj[user.id] = user.players.id;
        return obj;
    }, {});

    const add = (id, elo, isSeason) => {
        if (!list[id]) {
            list[id] = {
                id,
                playerId: 0,
                maxElo: 0,
                maxSeasonElo: 0,
            };
        }

        if (isSeason) {
            list[id].maxSeasonElo = Math.max(list[id].maxSeasonElo, elo);
            list[id].playerId = userToPlayerId[id];
        } else {
            list[id].maxElo = Math.max(list[id].maxElo, elo);
        }
    };

    const seasonId = data.seasonId;
    let reachedSeason = false;
    for (const match of data.eloMatches) {
        if (match.seasonId === seasonId) {
            reachedSeason = true;
        }
        if (reachedSeason && match.seasonId > seasonId) {
            continue;
        }

        if (userToPlayerId[match.challengerUserId] && match.challengerMatches >= config.minMatchesToEstablishTlr) {
            add(match.challengerUserId, match.challengerElo, match.seasonId === seasonId);
        }
        if (userToPlayerId[match.acceptorUserId] && match.acceptorMatches >= config.minMatchesToEstablishTlr) {
            add(match.acceptorUserId, match.acceptorElo, match.seasonId === seasonId);
        }
    }

    return Object.values(list)
        .filter((obj) => obj.maxElo > 0 && obj.maxSeasonElo > obj.maxElo)
        .map((obj) => ({ id: obj.playerId, elo: obj.maxSeasonElo, diff: obj.maxSeasonElo - obj.maxElo }));
};

const getPlayingAnotherFinal = (data) => {
    const levelType = data['level.type'];
    const userIds = new Set(data.users.map((user) => user.id));

    return data.playingAnotherFinal.reduce((obj, row) => {
        if (userIds.has(row.userId) && row.levelType === levelType) {
            obj[row.userId] = row.levelName;
        }

        return obj;
    }, {});
};

const getTournamentLinks = (tournament) => {
    if (!tournament) {
        return;
    }

    const year = tournament['season.year'];
    const season = tournament['season.season'];
    const level = tournament['level.slug'];

    return {
        name: getSeasonName(tournament),
        link: `/season/${year}/${season}/${level}`,
        url: `/api/tournaments/1?year=${year}&season=${season}&level=${level}`,
    };
};

const getWinner = (data) => {
    const lastMatch = data.matches.find((match) => match.type === 'final' && match.finalSpot === 1 && match.score);
    return lastMatch ? lastMatch.winner : 0;
};

const getCancelTournamentStatus = ({
    data,
    config,
    isOver,
    isBreak,
    isStarted,
}: {
    data;
    config: Config;
    isOver: boolean;
    isBreak: boolean;
    isStarted: boolean;
}) => {
    const deadline = dayjs.tz(data['season.endDate']).subtract(config.tournamentReminderWeeks, 'week');
    const deadlineStr = deadline.format('YYYY-MM-DD HH:mm:ss');
    const matchesBeforeDeadline = data.matches.filter((match) => match.score && match.playedAt < deadlineStr).length;

    const captainPlayerIds = new Set(data.users.map((user) => user.players.partnerId));
    const playersBeforeDeadline = data.users.filter((user) => {
        if (user.players.createdAt >= deadlineStr) {
            return false;
        }
        if (data['level.type'] === 'doubles-team' && !captainPlayerIds.has(user.players.id)) {
            return false;
        }

        return true;
    }).length;

    const totalFinalPlayers = playersBeforeDeadline >= 75 ? 16 : playersBeforeDeadline >= 50 ? 12 : 8;
    let cancelFinalTournamentCode = '';

    const cancelFinalTournamentReason = (() => {
        if (!isStarted) {
            return '';
        }
        if (isOver && !isBreak) {
            return '';
        }

        if (dayjs.tz().isBefore(deadline)) {
            return '';
        }

        if (matchesBeforeDeadline < config.minMatchesToPlanTournament) {
            cancelFinalTournamentCode = 'notEnoughMatches';
            return [
                `No tournament is scheduled for the ${data['level.name']} Ladder because fewer than ${config.minMatchesToPlanTournament} matches were played before the final week of the regular season.`,
            ];
        }

        if (isOver) {
            const readyUsersCount = data.users.filter(
                (user) => user?.players.isActive && user?.players.readyForFinal === 1
            ).length;
            const minPlayers = config.minPlayersToRunTournament;
            if (readyUsersCount < minPlayers) {
                cancelFinalTournamentCode = 'notEnoughTournamentPlayers';
                return `No tournament is scheduled for the ${data['level.name']} Ladder because it requires at least ${minPlayers} registered players.`;
            }
        }

        return '';
    })();

    return {
        cancelFinalTournament: Boolean(cancelFinalTournamentReason),
        cancelFinalTournamentReason,
        cancelFinalTournamentCode,
        matchesBeforeDeadline,
        playersBeforeDeadline,
        totalFinalPlayers,
    };
};

export const getTournament = async ({ data, includeEmail, config, app }) => {
    const isDoublesTeam = data['level.type'] === 'doubles-team';

    const playerPoints = getPlayerPoints(data);
    const eloTrend = getEloTrend(data, config);
    const topUpsetMatches = getTopUpsetMatches(data, config);
    const mostProgress = getMostProgress(data, config);
    const mostMatches = getMostMatches(data);
    const topForm = getTopForm(data, config);
    const playingAnotherFinal = getPlayingAnotherFinal(data);
    const highTlrRestrictions = getHighTlrRestrictions(data, config);

    const pickMatchFields = (match) => ({
        ..._pick(match, [
            'id',
            'initial',
            'challengerId',
            'acceptorId',
            'challengerRank',
            'acceptorRank',
            'challengerPoints',
            'acceptorPoints',
            'challengerElo',
            'challengerEloChange',
            'acceptorElo',
            'acceptorEloChange',
            'challengerSeed',
            'acceptorSeed',
            'challengerMatches',
            'acceptorMatches',
            'place',
            'comment',
            'practiceType',
            'matchFormat',
            'duration',
            'youtube',
            'note',
            'type',
            'finalSpot',
            'winner',
            'score',
            'wonByDefault',
            'wonByInjury',
            'playedAt',
            'acceptedAt',
            'rejectedAt',
            'createdAt',
            'tournamentId',
            'challenger2Id',
            'challenger2Elo',
            'challenger2EloChange',
            'challenger2Rank',
            'challenger2Points',
            'acceptor2Id',
            'acceptor2Elo',
            'acceptor2EloChange',
            'acceptor2Rank',
            'acceptor2Points',
            'isCompetitive',
            'isAgeCompatible',
        ]),
        stat: match.stat ? processStat(match.stat) : null,
    });

    const currentDate = dayjs.tz();
    const currentDateStr = currentDate.format('YYYY-MM-DD HH:mm:ss');
    const startDate = dayjs.tz(data['season.startDate']);
    const endDate = dayjs.tz(data['season.endDate']);
    const participationDate = endDate.subtract(config.tournamentReminderWeeks, 'week');

    const isStarted = currentDate.isAfter(startDate);
    const isOver = currentDate.isAfter(endDate);
    const isParticipation = !isOver && currentDate.isAfter(participationDate);
    const isBreak = isOver && (!data.nextSeason || currentDate.isBefore(dayjs.tz(data.nextSeason.startDate)));
    const isFinalTournament = data.matches.some((match) => match.type === 'final');
    const finalMatches = data.matches.filter((match) => match.type === 'final');

    const partnerIds = isDoublesTeam
        ? getPartners(
              data.users
                  .filter((user) => user.players.partnerId !== POOL_PARTNER_ID)
                  .map((user) => [user.players.id, user.players.partnerId])
          )
        : {};

    const players = data.users
        .sort((a, b) => a.players.partnerId - b.players.partnerId)
        .reduce((obj, user) => {
            const prediction = user.players.prediction ? JSON.parse(user.players.prediction) : null;
            const predictionPoints = (() => {
                if (!prediction) {
                    return null;
                }
                return getBetPoints(finalMatches, prediction);
            })();
            const hasBan = user.banDate && user.banDate > currentDateStr;
            const isDoublesTeamCaptain = isDoublesTeam && user.players.id === partnerIds[user.players.id]?.[0];
            const isDoublesTeamPlayerPool = isDoublesTeam && user.players.partnerId === POOL_PARTNER_ID;
            const isDoublesTeamPartner = isDoublesTeam && !isDoublesTeamCaptain && !isDoublesTeamPlayerPool;
            const startingTlr = highTlrRestrictions[user.id]?.startingTlr || 0;
            const initialTlr = highTlrRestrictions[user.id]?.initialTlr || 0;
            const projectedTlr = highTlrRestrictions[user.id]?.projectedTlr || 0;
            const isStartingTlrTooHigh = user.players.readyForFinal === 0 && startingTlr > data['level.maxTlr'];
            const isInitialTlrTooHigh = user.players.readyForFinal === 0 && initialTlr > data['level.maxTlr'];
            const isProjectedTlrTooHigh =
                user.players.readyForFinal === 0 &&
                projectedTlr > data['level.maxTlr'] &&
                data.playersWithHighTlrWarning.includes(user.players.id);

            obj[user.players.id] = {
                id: user.players.id,
                createdAt: user.players.createdAt,
                firstName: user.firstName,
                lastName: user.lastName,
                deletedAt: user.deletedAt,
                ...(includeEmail && { email: user.email }),
                userId: user.id,
                userSlug: user.slug,
                isActive: user.players.isActive,
                readyForFinal: user.players.readyForFinal,
                address: user.players.address,
                partnerInfo: user.players.partnerInfo,
                teamName: user.players.teamName,
                avatar: user.avatar,
                avatarObject: user.avatarObject,
                gender: user.gender,
                stats: playerPoints[user.players.id],
                startingTlr,
                initialTlr,
                projectedTlr,
                isStartingTlrTooHigh,
                isInitialTlrTooHigh,
                isProjectedTlrTooHigh,
                elo: eloTrend[user.id] || {
                    elo: null,
                    lost: 0,
                    matches: 0,
                    trend: [],
                    won: 0,
                    isEloEstablished: false,
                },
                joinAnyTeam: user.players.joinAnyTeam,
                joinAnyTeamComment: user.players.joinAnyTeamComment,
                prediction,
                predictionPoints,
                hasBan,
                ...(hasBan ? { banReason: user.banReason } : {}),
                ...(partnerIds[user.players.id] ? { partnerIds: partnerIds[user.players.id] } : {}),
                partnerId: user.players.partnerId,
                hidden: isDoublesTeamPartner || isDoublesTeamPlayerPool,
                isDoublesTeamCaptain,
                isDoublesTeamPartner,
                isDoublesTeamPlayerPool,
                isSoftBan: user.isSoftBan,
            };

            return obj;
        }, {});

    // populate joinDoublesLink for team captains
    if (isDoublesTeam) {
        await limitedPromiseAll(Object.values(players), async (player) => {
            if (player.isDoublesTeamCaptain) {
                player.joinDoublesLink = await getJoinDoublesLink(player.id, app);
            }
        });
    }

    const botPrediction = data.botPrediction ? JSON.parse(data.botPrediction) : null;
    const botPredictionPoints = botPrediction ? getBetPoints(finalMatches, botPrediction) : {};

    return {
        id: data.id,
        seasonId: data.seasonId,
        levelId: data.levelId,
        level: data['level.name'],
        levelSlug: data['level.slug'],
        levelType: data['level.type'],
        levelBaseTlr: data['level.baseTlr'],
        season: getSeasonName(data),
        seasonYear: data['season.year'],
        seasonSeason: data['season.season'],
        seo: {
            title: `${getSeasonName(data)} ${data['level.name']}`,
        },
        allLevels: data.allLevels,
        startDate: data['season.startDate'],
        endDate: data['season.endDate'],
        seasonCloseReason: data['season.closeReason'],
        tooLateToSwitchLadder: isOver || endDate.diff(currentDate, 'week', true) < SWITCH_LADDER_DEADLINE_WEEKS,
        hasPredictionContest: Boolean(botPrediction),
        botPrediction,
        botPredictionPoints,
        predictionWinner: data.predictionWinner,
        players,
        winner: getWinner(data),
        isStarted,
        isOver,
        isParticipation,
        isBreak,
        ...(isBreak && { breakEnd: data.nextSeason ? data.nextSeason.startDate : '' }),
        isFinalTournament,
        ...getCancelTournamentStatus({ data, config, isOver, isBreak, isStarted }),
        playingAnotherFinal,
        matches: data.matches
            .filter((match) => {
                if (match.score) {
                    return true;
                }

                if (match.challengerId && !players[match.challengerId].isActive) {
                    return false;
                }

                if (match.acceptorId && !players[match.acceptorId].isActive) {
                    return false;
                }

                return true;
            })
            .map(pickMatchFields),
        topUpsetMatches: topUpsetMatches.map(pickMatchFields),
        mostProgress,
        mostMatches,
        topForm,
        prevTournament: getTournamentLinks(data.prevTournament),
        nextTournament: getTournamentLinks(data.nextTournament),
        currentWeek: Math.ceil(currentDate.diff(startDate, 'week', true)),
        totalWeeks: Math.ceil(endDate.subtract(12, 'hour').diff(startDate, 'week', true)),
    };
};
