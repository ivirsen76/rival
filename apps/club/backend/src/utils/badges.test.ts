import { badges, getSeriesState } from './badges';

describe('getSeriesState', () => {
    const levels = [1, 5, 25, 50, 100, 250, 500, 1000];

    it('Should return state in general case', () => {
        const value = 200;
        const expectedState = {
            state: {
                props: {
                    label: 100,
                    percent: (5 / 8) * 100,
                    disabled: false,
                },
                completed: false,
                nextDiff: 50,
            },
        };

        expect(getSeriesState('code', levels, value)).toMatchObject(expectedState);
    });

    it('Should return completed state', () => {
        const value = 9999;
        const expectedState = {
            state: {
                props: {
                    label: 1000,
                    percent: 100,
                    disabled: false,
                },
                completed: true,
                nextDiff: 0,
            },
        };

        expect(getSeriesState('code', levels, value)).toMatchObject(expectedState);
    });
});

describe('matchesPlayed', () => {
    it('Should return right state', () => {
        const state = badges.matchesPlayed.getState({ stats: { matchesTotal: 90, payload: {} } });
        expect(state.value).toBe(90);
        expect(state.nextDiff).toBe(10);

        expect(badges.matchesPlayed.getState({ stats: { matchesTotal: 9999, payload: {} } }).completed).toBe(true);
    });
});

describe('matchesWon', () => {
    it('Should return right state', () => {
        const state = badges.matchesWon.getState({ stats: { matchesWon: 90, payload: {} } });
        expect(state.value).toBe(90);
        expect(state.nextDiff).toBe(10);

        expect(badges.matchesWon.getState({ stats: { matchesWon: 9999, payload: {} } }).completed).toBe(true);
    });
});

describe('proposalsCreated', () => {
    it('Should return right state', () => {
        const state = badges.proposalsCreated.getState({ stats: { proposalsCreated: 90, payload: {} } });
        expect(state.value).toBe(90);
        expect(state.nextDiff).toBe(10);

        expect(badges.proposalsCreated.getState({ stats: { proposalsCreated: 9999, payload: {} } }).completed).toBe(
            true
        );
    });
});

describe('proposalsAccepted', () => {
    it('Should return right state', () => {
        const state = badges.proposalsAccepted.getState({ stats: { proposalsAccepted: 90, payload: {} } });
        expect(state.value).toBe(90);
        expect(state.nextDiff).toBe(10);

        expect(badges.proposalsAccepted.getState({ stats: { proposalsAccepted: 9999, payload: {} } }).completed).toBe(
            true
        );
    });
});

describe('rivalries', () => {
    it('Should return right state', () => {
        const state = badges.rivalries.getState({ stats: { rivalries: 42, payload: {} } });
        expect(state.value).toBe(42);
        expect(state.nextDiff).toBe(8);

        expect(badges.rivalries.getState({ stats: { rivalries: 9999, payload: {} } }).completed).toBe(true);
    });
});

describe('tiebreaker', () => {
    it('Should return right state', () => {
        const state = badges.tiebreaker.getState({ stats: { tiebreaks: 90, payload: {} } });
        expect(state.value).toBe(90);
        expect(state.nextDiff).toBe(10);

        expect(badges.tiebreaker.getState({ stats: { tiebreaks: 9999, payload: {} } }).completed).toBe(true);
    });
});

describe('tournament', () => {
    it('Should return right state', () => {
        {
            const state = badges.tournament.getState({ stats: { id: 1, tournamentResult: 'semifinal' } });
            // expect(state.value).toBe('Semifinal');
            expect(state.completedBadges).toEqual(['level1:tournament:quarterfinal', 'level1:tournament:semifinal']);
        }

        {
            const state = badges.tournament.getState({ stats: { id: 1, tournamentResult: 'champion' } });
            expect(state.completed).toBe(true);
            expect(state.completedBadges).toEqual([
                'level1:tournament:quarterfinal',
                'level1:tournament:semifinal',
                'level1:tournament:final',
                'level1:tournament:champion',
            ]);
        }
    });
});

describe('points', () => {
    it('Should return right state', () => {
        const state = badges.points.getState({ stats: { maxPoints: 280 } });
        expect(state.value).toBe(280);
        expect(state.nextDiff).toBe(20);

        expect(badges.points.getState({ stats: { maxPoints: 9999 } }).completed).toBe(true);
    });
});

describe('feedback', () => {
    it('Should return right state', () => {
        const state = badges.feedback.getState({ stats: { feedbacks: 0 } });
        expect(state.props.disabled).toBe(true);

        const state1 = badges.feedback.getState({ stats: { feedbacks: 9999 } });
        expect(state1.completed).toBe(true);
        expect(state1.props.disabled).toBe(false);
    });
});

describe('avatar', () => {
    it('Should return right state', () => {
        const state = badges.avatar.getState({ stats: { isAvatarCreated: false } });
        expect(state.props.disabled).toBe(true);

        const state1 = badges.avatar.getState({ stats: { isAvatarCreated: true } });
        expect(state1.completed).toBe(true);
        expect(state1.props.disabled).toBe(false);
    });
});

describe('profile', () => {
    it('Should return right state', () => {
        const state = badges.profile.getState({ stats: { isProfileCompleted: null } });
        expect(state.props.disabled).toBe(true);

        const state1 = badges.profile.getState({ stats: { isProfileCompleted: true } });
        expect(state1.completed).toBe(true);
        expect(state1.props.disabled).toBe(false);
    });
});

describe('allSeasonPlayer', () => {
    it('Should return right state', () => {
        const state = badges.allSeasonPlayer.getState({
            stats: {
                seasonsParticipated: {},
                seasonsPlayed: {
                    winter: { seasons: {}, matches: 5 },
                    spring: { seasons: {}, matches: 5 },
                    summer: { seasons: {}, matches: 5 },
                    fall: { seasons: {}, matches: 0 },
                },
            },
        });
        expect(state.props.disabled).toBe(true);

        const state1 = badges.allSeasonPlayer.getState({
            stats: {
                seasonsParticipated: {},
                seasonsPlayed: {
                    winter: { seasons: {}, matches: 5 },
                    spring: { seasons: {}, matches: 5 },
                    summer: { seasons: {}, matches: 5 },
                    fall: { seasons: {}, matches: 5 },
                },
            },
        });
        expect(state1.completed).toBe(true);
        expect(state1.props.disabled).toBe(false);
    });
});

describe('statistician', () => {
    it('Should return right state', () => {
        const state = badges.statistician.getState({
            stats: { statsUploaded: false, payload: {} },
        });
        expect(state.props.disabled).toBe(true);

        const state1 = badges.statistician.getState({
            stats: { statsUploaded: true, payload: {} },
        });
        expect(state1.completed).toBe(true);
        expect(state1.props.disabled).toBe(false);
    });
});

describe('dedication', () => {
    it('Should return right state', () => {
        const state = badges.dedication.getState({
            stats: { maxPlayedInWeek: 4, payload: {} },
        });
        expect(state.props.disabled).toBe(true);

        const state1 = badges.dedication.getState({
            stats: { maxPlayedInWeek: 5, payload: {} },
        });
        expect(state1.completed).toBe(true);
        expect(state1.props.disabled).toBe(false);
    });
});

describe('takeItToLimit', () => {
    it('Should return right state', () => {
        const state = badges.takeItToLimit.getState({
            stats: { wonManyGamesMatch: false, payload: { wonManyGamesMatch: {} } },
        });
        expect(state.props.disabled).toBe(true);

        const state1 = badges.takeItToLimit.getState({
            stats: { wonManyGamesMatch: true, payload: { wonManyGamesMatch: {} } },
        });
        expect(state1.completed).toBe(true);
        expect(state1.props.disabled).toBe(false);
    });
});
