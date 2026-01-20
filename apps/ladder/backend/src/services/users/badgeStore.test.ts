import { reducer, initialUsersStats } from './badgeStore';
import _cloneDeep from 'lodash/cloneDeep';
import _merge from 'lodash/merge';

const getUser = (obj = {}) => {
    return _merge(
        {
            updatedAt: null,
            badges: new Set(),
            badgesHistory: [],
            stats: _cloneDeep(initialUsersStats),
        },
        obj
    );
};

describe('reducer', () => {
    describe('LOAD_USERS', () => {
        it('Should load users', () => {
            const state = { users: {} };
            const action = {
                type: 'LOAD_USERS',
                payload: [
                    { id: 1, some: 'one', stats: { matchesTotal: 2 } },
                    { id: 2, some: 'two' },
                ],
            };
            const expectedState = {
                users: {
                    1: {
                        id: 1,
                        some: 'one',
                        stats: { ...initialUsersStats, matchesTotal: 2 },
                        badges: new Set(),
                        badgesHistory: [],
                        updatedAt: null,
                    },
                    2: {
                        id: 2,
                        some: 'two',
                        stats: initialUsersStats,
                        badges: new Set(),
                        badgesHistory: [],
                        updatedAt: null,
                    },
                },
            };

            expect(reducer(state, action)).toEqual(expectedState);
        });
    });

    describe('ADD_MATCH', () => {
        const defaultPayload = {
            id: 11,
            challengerId: 1000,
            acceptorId: 2000,
            challengerElo: 1600,
            acceptorElo: 1700,
            challenger2Elo: null,
            acceptor2Elo: null,
            challengerEloChange: 10,
            acceptorEloChange: -15,
            challengerPoints: 22,
            acceptorPoints: 11,
            challenger2Points: null,
            acceptor2Points: null,
            challengerMatches: 50,
            acceptorMatches: 50,
            winner: 1000,
            playedAt: '2022-02-13 14:00:00',
            createdAt: '2022-02-13 10:00:00',
            score: '6-3 6-4',
            type: 'regular',
            finalSpot: null,
            wonByDefault: 0,
            initial: 3,
            tournamentId: 1,
            challengerUserId: 100,
            acceptorUserId: 200,
            challenger2UserId: null,
            acceptor2UserId: null,
            challengerName: 'Ben Done',
            acceptorName: 'Roy Bone',
            seasonId: 1,
            levelId: 1,
            year: 2022,
            season: 'spring',
            levelType: 'single',
            statAddedBy: 100,
            avatarAddedAt: '2022-02-13 10:00:00',
            profileCompletedAt: '2022-02-13 10:00:00',
        };

        it('Should affect tournament result for the level', () => {
            const state = { users: { 100: getUser(), 300: getUser() } };
            const action = {
                type: 'ADD_MATCH',
                payload: {
                    ...defaultPayload,
                    wonByDefault: 1,
                    type: 'final',
                    finalSpot: 4,
                },
            };
            const resultedState = reducer(state, action);

            expect(resultedState.users[100].stats.levels[1].tournamentResult).toBe('quarterfinal');
            expect(resultedState.users[100].updatedAt).toBe('2022-02-13 14:00:00');

            expect(resultedState.users[300].updatedAt).toBeNull();
        });

        it('Should affect matchesTotal, matchesWon, seasonsPlayed', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_MATCH',
                payload: defaultPayload,
            };
            const resultedState = reducer(state, action);

            expect(resultedState.users[100].stats.matchesTotal).toBe(1);
            expect(resultedState.users[100].stats.matchesWon).toBe(1);
            expect(resultedState.users[100].stats.seasonsPlayed.spring.matches).toBe(1);
            expect(resultedState.users[100].updatedAt).toBe(defaultPayload.playedAt);

            expect(resultedState.users[200].stats.matchesTotal).toBe(1);
            expect(resultedState.users[200].stats.matchesWon).toBe(0);
            expect(resultedState.users[200].stats.seasonsPlayed.spring.matches).toBe(1);
            expect(resultedState.users[200].updatedAt).toBe(defaultPayload.playedAt);
        });

        it('Should not affect matchesTotal, matchesWon for match won by default', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_MATCH',
                payload: {
                    ...defaultPayload,
                    wonByDefault: 1,
                },
            };
            const resultedState = reducer(state, action);

            expect(resultedState.users[100].stats.matchesTotal).toBe(0);
            expect(resultedState.users[100].stats.matchesWon).toBe(0);

            expect(resultedState.users[200].stats.matchesTotal).toBe(0);
            expect(resultedState.users[200].stats.matchesWon).toBe(0);
        });

        it('Should not affect proposalsCreated, proposalsAccepted', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_MATCH',
                payload: {
                    ...defaultPayload,
                    initial: 1,
                },
            };
            const resultedState = reducer(state, action);

            expect(resultedState.users[100].stats.proposalsCreated).toBe(0);
            expect(resultedState.users[200].stats.proposalsAccepted).toBe(0);
        });

        it('Should affect wonManyGamesMatch', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_MATCH',
                payload: {
                    ...defaultPayload,
                    score: '6-4 6-7 7-6',
                },
            };
            const resultedState = reducer(state, action);

            expect(resultedState.users[100].stats.wonManyGamesMatch).toBe(true);
            expect(resultedState.users[200].stats.wonManyGamesMatch).toBe(false);
        });

        it('Should affect beatMuchStrongerPlayer', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_MATCH',
                payload: {
                    ...defaultPayload,
                    challengerElo: 310,
                    acceptorElo: 350,
                    challengerEloChange: 5,
                    acceptorEloChange: -5,
                },
            };
            const resultedState = reducer(state, action);

            expect(resultedState.users[100].stats.beatMuchStrongerPlayer).toBe(true);
            expect(resultedState.users[100].stats.payload.beatMuchStrongerPlayer).toEqual([
                {
                    id: 11,
                    acceptorElo: 350,
                    acceptorEloChange: -5,
                    acceptorId: 2000,
                    acceptorUserId: 200,
                    challengerElo: 310,
                    challengerEloChange: 5,
                    challengerId: 1000,
                    challengerUserId: 100,
                    playedAt: '2022-02-13 14:00:00',
                    score: '6-3 6-4',
                    winner: 1000,
                    challenger2UserId: null,
                    acceptor2UserId: null,
                },
            ]);
            expect(resultedState.users[200].stats.beatMuchStrongerPlayer).toBe(false);
        });

        it('Should affect tiebreaks', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_MATCH',
                payload: {
                    ...defaultPayload,
                    score: '7-6 6-7 1-0',
                },
            };
            const resultedState = reducer(state, action);

            expect(resultedState.users[100].stats.tiebreaks).toBe(2);
            expect(resultedState.users[200].stats.tiebreaks).toBe(1);
        });

        it('Should affect current level minFinalSpot', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_MATCH',
                payload: {
                    ...defaultPayload,
                    type: 'final',
                    finalSpot: 1,
                },
            };
            const resultedState = reducer(state, action);

            expect(resultedState.users[100].stats.levels[1].minFinalSpot).toBe(0);
            expect(resultedState.users[200].stats.levels[1].minFinalSpot).toBe(1);
        });

        it('Should affect current level maxPoints', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_MATCH',
                payload: defaultPayload,
            };
            const resultedState = reducer(state, action);

            expect(resultedState.users[100].stats.levels[1].maxPoints).toBe(22);
            expect(resultedState.users[200].stats.levels[1].maxPoints).toBe(11);
        });

        it('Should affect doubleImpact', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_MATCH',
                payload: defaultPayload,
            };
            let resultedState = reducer(state, action);
            resultedState = reducer(resultedState, action);

            expect(resultedState.users[100].stats.doubleImpact).toBe(true);
            expect(resultedState.users[200].stats.doubleImpact).toBe(false);
        });

        it('Should affect maxPlayedInWeek', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_MATCH',
                payload: defaultPayload,
            };
            let resultedState = reducer(state, action);
            resultedState = reducer(resultedState, action);
            resultedState = reducer(resultedState, action);

            expect(resultedState.users[100].stats.maxPlayedInWeek).toBe(3);
            expect(resultedState.users[200].stats.maxPlayedInWeek).toBe(3);
        });

        it('Should affect playedSinglesDoubles', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            let resultedState = reducer(state, {
                type: 'ADD_MATCH',
                payload: defaultPayload,
            });
            resultedState = reducer(resultedState, {
                type: 'ADD_MATCH',
                payload: {
                    ...defaultPayload,
                    levelType: 'doubles',
                },
            });

            expect(resultedState.users[100].stats.playedSinglesDoubles).toBe(true);
            expect(resultedState.users[200].stats.playedSinglesDoubles).toBe(true);
        });

        it('Should affect playedSinglesDoubles for doubles team', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            let resultedState = reducer(state, {
                type: 'ADD_MATCH',
                payload: defaultPayload,
            });
            resultedState = reducer(resultedState, {
                type: 'ADD_MATCH',
                payload: {
                    ...defaultPayload,
                    levelType: 'doubles-team',
                },
            });

            expect(resultedState.users[100].stats.playedSinglesDoubles).toBe(true);
            expect(resultedState.users[200].stats.playedSinglesDoubles).toBe(true);
        });

        it('Should affect rivalries', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_MATCH',
                payload: defaultPayload,
            };
            let resultedState = reducer(state, action);
            resultedState = reducer(resultedState, action);
            expect(resultedState.users[100].stats.rivalries).toBe(0);
            expect(resultedState.users[200].stats.rivalries).toBe(0);

            resultedState = reducer(resultedState, action);
            expect(resultedState.users[100].stats.rivalries).toBe(1);
            expect(resultedState.users[200].stats.rivalries).toBe(1);
        });

        it('Should affect beatOnTwoTiebreaks', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_MATCH',
                payload: {
                    ...defaultPayload,
                    score: '7-6 7-6',
                },
            };
            const resultedState = reducer(state, action);
            expect(resultedState.users[100].stats.beatOnTwoTiebreaks).toBe(true);
            expect(resultedState.users[100].stats.payload.beatOnTwoTiebreaks).toEqual([
                {
                    id: 11,
                    acceptorElo: 1700,
                    acceptorEloChange: -15,
                    acceptorId: 2000,
                    acceptorUserId: 200,
                    challengerElo: 1600,
                    challengerEloChange: 10,
                    challengerId: 1000,
                    challengerUserId: 100,
                    playedAt: '2022-02-13 14:00:00',
                    score: '7-6 7-6',
                    winner: 1000,
                    challenger2UserId: null,
                    acceptor2UserId: null,
                },
            ]);
            expect(resultedState.users[200].stats.beatOnTwoTiebreaks).toBe(false);
        });

        it('Should affect doubleBageled', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_MATCH',
                payload: {
                    ...defaultPayload,
                    score: '6-0 6-0',
                },
            };
            const resultedState = reducer(state, action);
            expect(resultedState.users[100].stats.doubleBageled).toBe(true);
            expect(resultedState.users[100].stats.payload.doubleBageled).toEqual([
                {
                    id: 11,
                    acceptorElo: 1700,
                    acceptorEloChange: -15,
                    acceptorId: 2000,
                    acceptorUserId: 200,
                    challengerElo: 1600,
                    challengerEloChange: 10,
                    challengerId: 1000,
                    challengerUserId: 100,
                    playedAt: '2022-02-13 14:00:00',
                    score: '6-0 6-0',
                    winner: 1000,
                    challenger2UserId: null,
                    acceptor2UserId: null,
                },
            ]);
            expect(resultedState.users[200].stats.doubleBageled).toBe(false);
        });

        it('Should affect statistician', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_MATCH',
                payload: defaultPayload,
            };
            const resultedState = reducer(state, action);
            expect(resultedState.users[100].stats.statsUploaded).toBe(true);
            expect(resultedState.users[200].stats.statsUploaded).toBe(false);
        });
    });

    describe('ADD_PROPOSAL', () => {
        const defaultPayload = {
            challengerId: 1000,
            acceptorId: 2000,
            challengerElo: null,
            acceptorElo: null,
            challenger2Elo: null,
            acceptor2Elo: null,
            challengerEloChange: null,
            acceptorEloChange: null,
            challengerPoints: null,
            acceptorPoints: null,
            challenger2Points: null,
            acceptor2Points: null,
            challengerMatches: null,
            acceptorMatches: null,
            winner: null,
            playedAt: '2022-02-13 14:00:00',
            createdAt: '2022-02-13 10:00:00',
            score: null,
            type: 'regular',
            finalSpot: null,
            wonByDefault: 0,
            initial: 1,
            tournamentId: 1,
            challengerUserId: 100,
            acceptorUserId: 200,
            challenger2UserId: null,
            acceptor2UserId: null,
            seasonId: 1,
            levelId: 1,
            year: 2022,
            season: 'spring',
            levelType: 'single',
        };

        it('Should not affect proposalsCreated if it is not a proposal', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_PROPOSAL',
                payload: {
                    ...defaultPayload,
                    initial: 3,
                },
            };
            const resultedState = reducer(state, action);

            expect(resultedState.users[100].stats.proposalsCreated).toBe(0);
            expect(resultedState.users[100].updatedAt).toBeNull();

            expect(resultedState.users[200].updatedAt).toBeNull();
        });

        it('Should affect proposalsCreated', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_PROPOSAL',
                payload: defaultPayload,
            };
            const resultedState = reducer(state, action);

            expect(resultedState.users[100].stats.proposalsCreated).toBe(1);
            expect(resultedState.users[100].stats.practiceProposed).toBe(false);
            expect(resultedState.users[100].updatedAt).toBe('2022-02-13 10:00:00');

            expect(resultedState.users[200].updatedAt).toBeNull();
            expect(resultedState.users[200].stats.practiceProposed).toBe(false);
        });

        it('Should affect practiceProposed', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ADD_PROPOSAL',
                payload: {
                    ...defaultPayload,
                    practiceType: 1,
                },
            };
            const resultedState = reducer(state, action);

            expect(resultedState.users[100].stats.practiceProposed).toBe(true);
            expect(resultedState.users[200].stats.practiceProposed).toBe(false);
        });
    });

    describe('ACCEPT_PROPOSAL', () => {
        const defaultPayload = {
            challengerId: 1000,
            acceptorId: 2000,
            challengerElo: null,
            acceptorElo: null,
            challenger2Elo: null,
            acceptor2Elo: null,
            challengerEloChange: null,
            acceptorEloChange: null,
            challengerPoints: null,
            acceptorPoints: null,
            challenger2Points: null,
            acceptor2Points: null,
            challengerMatches: null,
            acceptorMatches: null,
            winner: null,
            playedAt: '2022-02-13 14:00:00',
            acceptedAt: '2022-02-13 12:00:00',
            createdAt: '2022-02-13 10:00:00',
            score: null,
            type: 'regular',
            finalSpot: null,
            wonByDefault: 0,
            initial: 1,
            tournamentId: 1,
            challengerUserId: 100,
            acceptorUserId: 200,
            challenger2UserId: null,
            acceptor2UserId: null,
            seasonId: 1,
            levelId: 1,
            year: 2022,
            season: 'spring',
            levelType: 'single',
        };

        it('Should not affect proposalsAccepted if it is not a proposal', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ACCEPT_PROPOSAL',
                payload: {
                    ...defaultPayload,
                    initial: 3,
                },
            };
            const resultedState = reducer(state, action);

            expect(resultedState.users[200].stats.proposalsAccepted).toBe(0);
            expect(resultedState.users[200].updatedAt).toBeNull();
        });

        it('Should affect proposalsAccepted', () => {
            const state = { users: { 100: getUser(), 200: getUser() } };
            const action = {
                type: 'ACCEPT_PROPOSAL',
                payload: defaultPayload,
            };
            const resultedState = reducer(state, action);

            expect(resultedState.users[200].stats.proposalsAccepted).toBe(1);
            expect(resultedState.users[200].updatedAt).toBe('2022-02-13 12:00:00');

            expect(resultedState.users[100].updatedAt).toBeNull();
        });
    });

    describe('ADD_FEEDBACK', () => {
        it('Should do nothing', () => {
            const state = {
                users: { 100: getUser() },
            };
            const action = {
                type: 'ADD_FEEDBACK',
                payload: {
                    userId: 200,
                    createdAt: '2022-04-02 20:52:56',
                },
            };
            const expectedState = {
                users: { 100: getUser() },
            };
            const resultedState = reducer(state, action);

            expect(resultedState).toEqual(expectedState);
            expect(resultedState.users[100].updatedAt).toBeNull();
        });

        it('Should add feedback and change the stats', () => {
            const state = {
                users: { 100: getUser() },
            };
            const action = {
                type: 'ADD_FEEDBACK',
                payload: {
                    userId: 100,
                    createdAt: '2022-04-02 20:52:56',
                },
            };
            const expectedState = {
                users: {
                    100: getUser({
                        badges: new Set(['feedback']),
                        badgesHistory: [{ achievedAt: '2022-04-02 20:52:56', code: 'feedback' }],
                        updatedAt: '2022-04-02 20:52:56',
                        stats: {
                            feedbacks: 1,
                        },
                    }),
                },
            };

            expect(reducer(state, action)).toEqual(expectedState);
        });
    });

    describe('ADD_PHOTO', () => {
        it('Should do nothing', () => {
            const state = {
                users: { 100: getUser() },
            };
            const action = {
                type: 'ADD_PHOTO',
                payload: {
                    userId: 200,
                    createdAt: '2022-04-02 20:52:56',
                },
            };
            const expectedState = {
                users: { 100: getUser() },
            };
            const resultedState = reducer(state, action);

            expect(resultedState).toEqual(expectedState);
            expect(resultedState.users[100].updatedAt).toBeNull();
        });

        it('Should add feedback and change the stats', () => {
            const state = {
                users: { 100: getUser() },
            };
            const action = {
                type: 'ADD_PHOTO',
                payload: {
                    userId: 100,
                    createdAt: '2022-04-02 20:52:56',
                },
            };
            const expectedState = {
                users: {
                    100: getUser({
                        badges: new Set(['frame']),
                        badgesHistory: [{ achievedAt: '2022-04-02 20:52:56', code: 'frame' }],
                        updatedAt: '2022-04-02 20:52:56',
                        stats: {
                            photoUploaded: true,
                        },
                    }),
                },
            };

            expect(reducer(state, action)).toEqual(expectedState);
        });
    });

    describe('REGISTER_USER', () => {
        it('Should register user and change nothing', () => {
            const state = {
                users: {
                    100: getUser(),
                },
            };
            const action = {
                type: 'REGISTER_USER',
                payload: {
                    id: 200,
                    referrerUserId: 555,
                },
            };

            expect(reducer(state, action)).toBe(state);
        });

        it('Should register user and increase referrals count', () => {
            const state = {
                users: {
                    100: getUser(),
                },
            };
            const action = {
                type: 'REGISTER_USER',
                payload: {
                    id: 200,
                    referrerUserId: 100,
                    createdAt: '2022-04-02 20:52:56',
                },
            };

            const resultedState = reducer(state, action);
            expect(resultedState.users[100].stats.referrals).toBe(1);
            expect(resultedState.users[100].updatedAt).toBe('2022-04-02 20:52:56');
        });
    });
});
