// @ts-nocheck
import { getTbStats, getWeekNumber } from './helpers';
import _cloneDeep from 'lodash/cloneDeep';
import _pick from 'lodash/pick';
import { allBadges } from '../../utils/badges';
import { isFullScoreCorrect, isFastScoreCorrect } from '../matches/helpers';

export const initialUsersStats = {
    startingTlr: 0,
    tlrGain: 0,
    matchesTotal: 0,
    matchesWon: 0,
    proposalsCreated: 0,
    proposalsAccepted: 0,
    rivalries: 0,
    tiebreaks: 0,
    feedbacks: 0,
    predictionWins: 0,
    isAvatarCreated: false,
    isProfileCompleted: false,
    seasonsPlayed: {
        winter: { seasons: {}, matches: 0 },
        spring: { seasons: {}, matches: 0 },
        summer: { seasons: {}, matches: 0 },
        fall: { seasons: {}, matches: 0 },
    },
    seasonsParticipated: {},
    statsUploaded: false,
    maxPlayedInWeek: 0,
    wonManyGamesMatch: false,
    playedSinglesDoubles: false,
    doubleImpact: false,
    beatMuchStrongerPlayer: false,
    beatOnTwoTiebreaks: false,
    doubleBageled: false,
    photoUploaded: false,
    practiceProposed: false,
    comebacks: 0,
    revenge: false,
    fury: false,
    levels: {},
    payload: {
        beatMuchStrongerPlayer: [],
        beatOnTwoTiebreaks: [],
        doubleBageled: [],
        comebacks: [],
        tiebreaks: [],
        predictionWins: [],
        rivalries: {
            recent: [],
            candidates: [],
        },
        revenge: {
            players: [],
            candidates: {},
        },
        fury: [],
        wonManyGamesMatch: {
            recent: [],
            close: [],
        },
        matchesWithStats: [],
        maxPlayedInWeek: {},
        doubleImpact: {},
        latestMatches: [],
        latestWins: [],
        latestProposalsSent: [],
        latestProposalsAccepted: [],
        seasons: [],
    },
    sum: {
        prevMatchWonAt: '',
        playedSinglesSeasonId: 0,
        playedDoublesSeasonId: 0,
        prevWeekNumber: 0,
        weekNumberCount: 0,
        maxPoints: {},
        rivalries: {},
        revenge: {},
    },
};

const initialState = {
    config: {},
    users: {},
};

const applyBadges = (user) => {
    let isNew = false;

    const addBadge = (code) => {
        if (user.badges.has(code)) {
            return;
        }

        user.badgesHistory.push({ code, achievedAt: user.updatedAt });
        user.badges.add(code);

        isNew = true;
    };

    for (const badge of allBadges) {
        if (badge.isLevelSpecific) {
            for (const level of Object.values(user.stats.levels)) {
                const { completedBadges } = badge.getState({ stats: level });
                for (const code of completedBadges) {
                    addBadge(code);
                }
            }
        } else if (badge.levels) {
            const { completedBadges } = badge.getState({ stats: user.stats });
            for (const code of completedBadges) {
                addBadge(code);
            }
        } else {
            const { completed } = badge.getState({ stats: user.stats });
            if (completed) {
                addBadge(badge.code);
            }
        }
    }

    return isNew;
};

export const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_CONFIG': {
            state.config = action.payload;

            return state;
        }
        case 'LOAD_USERS': {
            state.users = action.payload.reduce((obj, item) => {
                const clonedInitialUserStats = _cloneDeep(initialUsersStats);

                obj[item.id] = {
                    badges: new Set(),
                    badgesHistory: [],
                    ...item,
                    updatedAt: null,
                    stats: {
                        ...clonedInitialUserStats,
                        ...item.stats,
                        payload: {
                            ...clonedInitialUserStats.payload,
                            ...item?.stats?.payload,
                        },
                        sum: {
                            ...clonedInitialUserStats.sum,
                            ...item?.stats?.sum,
                        },
                    },
                };

                return obj;
            }, {});

            return state;
        }
        case 'ADD_AVATAR': {
            const { userId, avatarCreatedAt } = action.payload;

            if (!state.users[userId]) {
                return state;
            }

            state.users[userId].stats.isAvatarCreated = true;
            state.users[userId].updatedAt = avatarCreatedAt;

            applyBadges(state.users[userId]);

            return state;
        }
        case 'PROFILE_COMPLETE': {
            const { userId, profileCompletedAt } = action.payload;

            if (!state.users[userId]) {
                return state;
            }

            state.users[userId].stats.isProfileCompleted = true;
            state.users[userId].updatedAt = profileCompletedAt;

            applyBadges(state.users[userId]);

            return state;
        }
        case 'ADD_MATCH': {
            const match = action.payload;
            const isFast4 = match.matchFormat === 2;
            const isScoreCorrect = isFast4 ? isFastScoreCorrect : isFullScoreCorrect;

            const processUser = (userId: number) => {
                if (!userId) {
                    return;
                }
                if (!state.users[userId]) {
                    return;
                }

                const stats = state.users[userId].stats;

                stats.levels[match.levelId] ||= {
                    id: match.levelId,
                    maxPoints: 0,
                    tournamentResult: null,
                    minFinalSpot: 99,
                    seasonPoints: {},
                };

                const isChallenger = match.challengerUserId === userId || match.challenger2UserId === userId;
                const isWinner = isChallenger ? match.challengerId === match.winner : match.acceptorId === match.winner;
                const pointsGained = isChallenger ? match.challengerPoints : match.acceptorPoints;
                const currentLevel = stats.levels[match.levelId];
                const isCorrect = isScoreCorrect(match.score);

                const role =
                    match.challengerUserId === userId
                        ? 'challenger'
                        : match.acceptorUserId === userId
                          ? 'acceptor'
                          : match.challenger2UserId === userId
                            ? 'challenger2'
                            : 'acceptor2';

                if (match.wonByDefault === 0) {
                    stats.matchesTotal++;

                    const matchSummary = _pick(match, [
                        'id',
                        'playedAt',
                        'score',
                        'winner',
                        'challengerId',
                        'challengerUserId',
                        'challengerElo',
                        'challengerEloChange',
                        'acceptorId',
                        'acceptorUserId',
                        'acceptorElo',
                        'acceptorEloChange',
                        'challenger2UserId',
                        'acceptor2UserId',
                    ]);
                    const winnerTlr =
                        match.challengerId === match.winner
                            ? match.challengerElo - match.challengerEloChange
                            : match.acceptorElo - match.acceptorEloChange;
                    const looserTlr =
                        match.challengerId === match.winner
                            ? match.acceptorElo - match.acceptorEloChange
                            : match.challengerElo - match.challengerEloChange;
                    const resultedTlr = isChallenger ? match.challengerElo : match.acceptorElo;

                    const isDoublesTeam = match.levelType === 'doubles-team';
                    const matchesPlayed = isChallenger ? match.challengerMatches : match.acceptorMatches;
                    const opponentMatchesPlayed = isChallenger ? match.acceptorMatches : match.challengerMatches;

                    if (match.levelBaseTlr) {
                        if (matchesPlayed === state.config.minMatchesToEstablishTlr) {
                            stats.startingTlr = resultedTlr;
                        }

                        if (stats.startingTlr) {
                            stats.tlrGain = Math.max(stats.tlrGain, resultedTlr - stats.startingTlr);
                        }
                    }

                    const currentWeekNumber = getWeekNumber(match.playedAt);
                    if (isWinner) {
                        stats.matchesWon++;

                        const challengerWonFirstSet =
                            match.score.startsWith('7') ||
                            (match.score.startsWith('6') && !match.score.startsWith('6-7'));
                        const wonFirstSet = isChallenger ? challengerWonFirstSet : !challengerWonFirstSet;
                        if (!wonFirstSet && isCorrect) {
                            stats.comebacks++;
                            stats.payload.comebacks.unshift(matchSummary);
                            while (stats.payload.comebacks.length > 5) {
                                stats.payload.comebacks.pop();
                            }
                        }

                        // Latest wins
                        stats.payload.latestWins.unshift(matchSummary);
                        while (stats.payload.latestWins.length > 5) {
                            stats.payload.latestWins.pop();
                        }
                    }

                    // Latest matches
                    stats.payload.latestMatches.unshift(matchSummary);
                    while (stats.payload.latestMatches.length > 5) {
                        stats.payload.latestMatches.pop();
                    }

                    if (currentWeekNumber === stats.sum.prevWeekNumber) {
                        stats.sum.weekNumberCount++;
                        if (stats.sum.weekNumberCount > stats.maxPlayedInWeek) {
                            stats.maxPlayedInWeek = stats.sum.weekNumberCount;
                        }
                        if (stats.sum.weekNumberCount >= 5) {
                            stats.payload.maxPlayedInWeek[currentWeekNumber] = {
                                week: currentWeekNumber,
                                total: stats.sum.weekNumberCount,
                            };
                        }
                    } else {
                        stats.sum.weekNumberCount = 1;
                    }

                    if (!stats.playedSinglesDoubles) {
                        if (isDoublesTeam && match.seasonId === stats.sum.playedSinglesSeasonId) {
                            stats.playedSinglesDoubles = true;
                        }
                        if (!isDoublesTeam && match.seasonId === stats.sum.playedDoublesSeasonId) {
                            stats.playedSinglesDoubles = true;
                        }
                    }

                    if (isWinner) {
                        const prevMatchWonDate = stats.sum.prevMatchWonAt.slice(0, 10);
                        const currentMatchWonDate = match.playedAt.slice(0, 10);

                        stats.payload.doubleImpact[currentMatchWonDate] ||= [];
                        stats.payload.doubleImpact[currentMatchWonDate].push(matchSummary);

                        if (prevMatchWonDate === currentMatchWonDate) {
                            stats.doubleImpact = true;
                        } else if (prevMatchWonDate && stats.payload.doubleImpact[prevMatchWonDate].length < 2) {
                            delete stats.payload.doubleImpact[prevMatchWonDate];
                        }
                    }

                    if (match.statAddedBy === userId) {
                        stats.statsUploaded = true;
                        stats.payload.matchesWithStats.push({
                            ...matchSummary,
                            ...(match.stat ? { stat: JSON.parse(match.stat) } : {}),
                        });
                    }

                    stats.seasonsPlayed[match.season].matches++;
                    stats.seasonsPlayed[match.season].seasons[match.seasonId] = true;
                    stats.seasonsParticipated[match.seasonId] = true;

                    if (stats.payload.seasons[0]?.seasonId === match.seasonId) {
                        stats.payload.seasons[0].matches++;
                    } else {
                        stats.payload.seasons.unshift({ seasonId: match.seasonId, matches: 1 });
                    }
                    while (stats.payload.seasons.length > 5) {
                        stats.payload.seasons.pop();
                    }

                    if (isCorrect) {
                        const tbStats = getTbStats(match);
                        const newTiebreaks = isChallenger ? tbStats[0] : tbStats[1];
                        if (newTiebreaks > 0) {
                            stats.tiebreaks += newTiebreaks;
                            stats.payload.tiebreaks.unshift(matchSummary);
                            while (stats.payload.tiebreaks.length > 5) {
                                stats.payload.tiebreaks.pop();
                            }
                        }
                    }

                    if (isCorrect) {
                        const sets = match.score.split(' ').map((item) => {
                            const games = item.split('-').map(Number);
                            return games[0] - games[1];
                        });

                        const isFury = (() => {
                            if (isChallenger && sets[0] < 0 && sets[1] === 6) {
                                return true;
                            }
                            if (!isChallenger && sets[0] > 0 && sets[1] === -6) {
                                return true;
                            }

                            return false;
                        })();

                        if (isFury) {
                            stats.fury = true;
                            stats.payload.fury.push(matchSummary);
                        }
                    }

                    if (isChallenger ? match.score === '7-6 7-6' : match.score === '6-7 6-7') {
                        stats.beatOnTwoTiebreaks = true;
                        stats.payload.beatOnTwoTiebreaks.push(matchSummary);
                    }

                    if (isChallenger ? match.score === '6-0 6-0' : match.score === '0-6 0-6') {
                        stats.doubleBageled = true;
                        stats.payload.doubleBageled.push(matchSummary);
                    }

                    if (isCorrect) {
                        const gamesTotal = match.score.split(' ').reduce((sum, item) => {
                            const games = item.split('-').map(Number);
                            return sum + games[0] + games[1];
                        }, 0);
                        if (gamesTotal >= 36) {
                            if (isWinner) {
                                stats.wonManyGamesMatch = true;
                                stats.payload.wonManyGamesMatch.recent.push(matchSummary);
                            } else {
                                stats.payload.wonManyGamesMatch.close.push(matchSummary);
                            }
                        }
                    }
                    {
                        const opponent = role === 'challenger' ? 'acceptor' : 'challenger';
                        const opponentUserId = match[`${opponent}UserId`];
                        stats.sum.rivalries[opponentUserId] ||= [0, ''];
                        stats.sum.rivalries[opponentUserId][0]++;
                        stats.sum.rivalries[opponentUserId][1] = match.playedAt;

                        if (stats.sum.rivalries[opponentUserId][0] === 2) {
                            stats.payload.rivalries.candidates.unshift(opponentUserId);
                        } else if (stats.sum.rivalries[opponentUserId][0] === 3) {
                            stats.rivalries++;

                            // remove from candidates
                            stats.payload.rivalries.candidates = stats.payload.rivalries.candidates.filter(
                                (id) => id !== opponentUserId
                            );

                            stats.payload.rivalries.recent.unshift({ opponentUserId, date: match.playedAt });
                            while (stats.payload.rivalries.recent.length > 5) {
                                stats.payload.rivalries.recent.pop();
                            }
                        }

                        stats.sum.revenge[opponentUserId] ||= 0;
                        if (isWinner) {
                            if (stats.sum.revenge[opponentUserId] >= 5) {
                                stats.revenge = true;
                                stats.payload.revenge.players.push({
                                    match: matchSummary,
                                    lostBefore: stats.sum.revenge[opponentUserId],
                                });
                                delete stats.payload.revenge.candidates[opponentUserId];
                            }

                            stats.sum.revenge[opponentUserId] = -999;
                        } else {
                            stats.sum.revenge[opponentUserId]++;

                            if (stats.sum.revenge[opponentUserId] >= 5) {
                                stats.payload.revenge.candidates[opponentUserId] = {
                                    opponentUserId,
                                    lostMatches: stats.sum.revenge[opponentUserId],
                                };
                            }
                        }

                        if (
                            isWinner &&
                            matchesPlayed >= 10 &&
                            opponentMatchesPlayed >= 10 &&
                            winnerTlr - looserTlr <= -50
                        ) {
                            stats.beatMuchStrongerPlayer = true;
                            stats.payload.beatMuchStrongerPlayer.push(matchSummary);
                        }
                    }

                    if (isWinner) {
                        stats.sum.prevMatchWonAt = match.playedAt;
                    }
                    stats.sum.prevWeekNumber = currentWeekNumber;
                    stats.sum.playedSinglesSeasonId = match.seasonId;
                }

                if (match.type === 'regular') {
                    stats.sum.maxPoints[match.tournamentId] ||= 0;
                    stats.sum.maxPoints[match.tournamentId] += match[`${role}Points`];
                    currentLevel.maxPoints = Math.max(currentLevel.maxPoints, stats.sum.maxPoints[match.tournamentId]);
                }

                if (match.type === 'final') {
                    let finalSpot = match.finalSpot;
                    if (match.finalSpot === 1 && isWinner) {
                        finalSpot = 0;
                    }

                    if (currentLevel.minFinalSpot > finalSpot) {
                        currentLevel.minFinalSpot = finalSpot;

                        currentLevel.tournamentResult = (() => {
                            if (finalSpot > 7) {
                                return null;
                            }
                            if (finalSpot > 3) {
                                return 'quarterfinal';
                            }
                            if (finalSpot > 1) {
                                return 'semifinal';
                            }
                            return isWinner ? 'champion' : 'final';
                        })();
                    }
                }

                currentLevel.seasonPoints[match.seasonId] ||= 0;
                currentLevel.seasonPoints[match.seasonId] += pointsGained;

                state.users[userId].updatedAt = match.playedAt;

                applyBadges(state.users[userId]);
            };

            processUser(match.challengerUserId);
            processUser(match.acceptorUserId);
            processUser(match.challenger2UserId);
            processUser(match.acceptor2UserId);

            return state;
        }
        case 'ADD_PROPOSAL': {
            const match = action.payload;
            const userId = match.challengerUserId;

            if (!userId || !state.users[userId]) {
                return state;
            }
            if (match.initial !== 1) {
                return state;
            }

            const userState = state.users[userId];
            userState.stats.proposalsCreated++;
            userState.updatedAt = match.createdAt;

            userState.stats.payload.latestProposalsSent.unshift(_pick(match, ['id', 'playedAt', 'place']));
            while (userState.stats.payload.latestProposalsSent.length > 5) {
                userState.stats.payload.latestProposalsSent.pop();
            }

            if (match.practiceType) {
                userState.stats.practiceProposed = true;
            }

            applyBadges(userState);

            return state;
        }
        case 'ACCEPT_PROPOSAL': {
            const match = action.payload;
            const userId = match.acceptorUserId;

            if (!userId || !state.users[userId]) {
                return state;
            }
            if (match.initial !== 1) {
                return state;
            }

            const userState = state.users[userId];
            userState.stats.proposalsAccepted++;
            userState.updatedAt = match.acceptedAt;

            userState.stats.payload.latestProposalsAccepted.unshift(
                _pick(match, ['id', 'playedAt', 'challengerUserId'])
            );
            while (userState.stats.payload.latestProposalsAccepted.length > 5) {
                userState.stats.payload.latestProposalsAccepted.pop();
            }

            applyBadges(userState);

            return state;
        }
        case 'ADD_PREDICTION_WINNER': {
            const { userId, predictionWonAt, seasonId, levelId } = action.payload;

            const userState = state.users[userId];
            if (!userState) {
                return state;
            }

            userState.stats.predictionWins++;
            userState.updatedAt = predictionWonAt;

            userState.stats.payload.predictionWins.push({ seasonId, levelId });

            applyBadges(userState);

            return state;
        }
        case 'ADD_FEEDBACK': {
            const { userId, createdAt } = action.payload;

            if (!state.users[userId]) {
                return state;
            }

            state.users[userId].stats.feedbacks++;
            state.users[userId].updatedAt = createdAt;

            applyBadges(state.users[userId]);

            return state;
        }
        case 'ADD_PHOTO': {
            const { userId, createdAt } = action.payload;

            if (!state.users[userId]) {
                return state;
            }

            state.users[userId].stats.photoUploaded = true;
            state.users[userId].updatedAt = createdAt;

            applyBadges(state.users[userId]);

            return state;
        }
        default:
            return state;
    }
};

export const createStore = () => {
    return {
        state: initialState,
        dispatch(action) {
            this.state = reducer(this.state, action);
        },
        getState() {
            return this.state;
        },
    };
};
