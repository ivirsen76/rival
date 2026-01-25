import { getSuitableTournaments, getPartners } from './helpers';

describe('getSuitableTournaments()', () => {
    const men30 = {
        levelName: "Men's 3.0",
        levelType: 'single',
        levelBaseTlr: 300,
        levelMinTlr: 250,
        levelMaxTlr: 350,
        gender: 'male',
        isActivePlay: true,
        tournamentId: 30,
    };
    const men35 = {
        levelName: "Men's 3.5",
        levelType: 'single',
        levelBaseTlr: 350,
        levelMinTlr: 300,
        levelMaxTlr: 400,
        gender: 'male',
        isActivePlay: true,
        tournamentId: 35,
    };
    const men40 = {
        levelName: "Men's 4.0",
        levelType: 'single',
        levelBaseTlr: 400,
        levelMinTlr: 350,
        levelMaxTlr: 450,
        gender: 'male',
        isActivePlay: false,
        tournamentId: 40,
    };
    const men45 = {
        levelName: "Men's 4.5",
        levelType: 'single',
        levelBaseTlr: 450,
        levelMinTlr: 400,
        levelMaxTlr: 500,
        gender: 'male',
        isActivePlay: false,
        tournamentId: 45,
    };
    const men3540 = {
        levelName: "Men's 3.5/4.0 DBLS",
        levelType: 'doubles',
        levelBaseTlr: 375,
        levelMinTlr: 300,
        levelMaxTlr: 450,
        gender: 'male',
        isActivePlay: false,
        tournamentId: 3540,
    };

    // default conditions
    {
        it('Should return suitable tournaments for TLR 2.25', () => {
            const tournaments = [men30, men35, men40, men45, men3540];
            const expectedResult = {
                all: [30],
                suitable: [30],
                additional: [],
                free: [],
                text: `Since your [TLR is 2.25], you're allowed to join only the following ladders. Other ladders are too weak or too strong for you.`,
            };
            const result = getSuitableTournaments(tournaments, 225, 'male');
            expect(result).toEqual(expectedResult);
        });

        it('Should return suitable tournaments for TLR 2.75', () => {
            const tournaments = [men30, men35, men40, men45, men3540];
            const expectedResult = {
                all: [30],
                suitable: [30],
                additional: [],
                free: [],
                text: `Since your [TLR is 2.75], you're allowed to join only the following ladders. Other ladders are too weak or too strong for you.`,
            };
            const result = getSuitableTournaments(tournaments, 275, 'male');
            expect(result).toEqual(expectedResult);
        });

        it('Should return suitable tournaments for TLR 3.25', () => {
            const tournaments = [men30, men35, men40, men45, men3540];
            const expectedResult = {
                all: [30, 35, 3540],
                suitable: [30, 35],
                additional: [],
                free: [3540],
                text: `Since your [TLR is 3.25], you're allowed to join only the following ladders. Other ladders are too weak or too strong for you. Due to the low level of activity last season, you can join some ladders for free.`,
            };
            const result = getSuitableTournaments(tournaments, 325, 'male');
            expect(result).toEqual(expectedResult);
        });

        it('Should return 3 single tournaments for TLR 3.50', () => {
            const tournaments = [men30, men35, men40, men45, men3540];
            const expectedResult = {
                all: [30, 35, 40, 3540],
                suitable: [30, 35, 40],
                additional: [],
                free: [40, 3540],
                text: `Since your [TLR is 3.50], you're allowed to join only the following ladders. Other ladders are too weak or too strong for you. Due to the low level of activity last season, you can join some ladders for free.`,
            };
            const result = getSuitableTournaments(tournaments, 350, 'male');
            expect(result).toEqual(expectedResult);
        });

        it('Should return suitable tournaments for TLR 3.75', () => {
            const tournaments = [men30, men35, men40, men45, men3540];
            const expectedResult = {
                all: [35, 40, 3540],
                suitable: [35, 40],
                additional: [],
                free: [40, 3540],
                text: `Since your [TLR is 3.75], you're allowed to join only the following ladders. Other ladders are too weak or too strong for you. Due to the low level of activity last season, you can join some ladders for free.`,
            };
            const result = getSuitableTournaments(tournaments, 375, 'male');
            expect(result).toEqual(expectedResult);
        });

        it('Should return suitable tournaments for TLR 4.25', () => {
            const tournaments = [men30, men35, men40, men45, men3540];
            const expectedResult = {
                all: [35, 40, 45, 3540],
                suitable: [40, 45],
                additional: [35],
                free: [40, 45, 3540],
                text: `Since your [TLR is 4.25], you should play on either the [Men's 4.0] or [Men's 4.5] ladders. However, we will allow you to play on the [Men's 3.5] ladder as well. Due to the low level of activity last season, you can join some ladders for free.`,
            };
            const result = getSuitableTournaments(tournaments, 425, 'male');
            expect(result).toEqual(expectedResult);
        });

        it('Should return suitable tournaments for TLR 4.75', () => {
            const tournaments = [men30, men35, men40, men45, men3540];
            const expectedResult = {
                all: [35, 40, 45],
                suitable: [45],
                additional: [35, 40],
                free: [40, 45],
                text: `Since your [TLR is 4.75], you should play on the [Men's 4.5] ladder. However, we will allow you to play on either the [Men's 3.5] or [Men's 4.0] ladders as well. Due to the low level of activity last season, you can join some ladders for free.`,
            };
            const result = getSuitableTournaments(tournaments, 475, 'male');
            expect(result).toEqual(expectedResult);
        });

        it('Should return suitable tournaments for TLR 5.25', () => {
            const tournaments = [men30, men35, men40, men45, men3540];
            const expectedResult = {
                all: [35, 40, 45],
                suitable: [45],
                additional: [35, 40],
                free: [40, 45],
                text: `Since your [TLR is 5.25], you should play on the [Men's 4.5] ladder. However, we will allow you to play on either the [Men's 3.5] or [Men's 4.0] ladders as well. Due to the low level of activity last season, you can join some ladders for free.`,
            };
            const result = getSuitableTournaments(tournaments, 525, 'male');
            expect(result).toEqual(expectedResult);
        });
    }

    // no active ladders
    {
        it('Should return just a few tournaments for TLR 2.25 if there are no active one', () => {
            const tournaments = [men30, men35, men40, men45, men3540].map((item) => ({ ...item, isActivePlay: false }));
            const expectedResult = {
                all: [30],
                suitable: [30],
                additional: [],
                free: [30],
                text: `Since your [TLR is 2.25], you're allowed to join only the following ladders. Other ladders are too weak or too strong for you. Due to the low level of activity last season, you can join some ladders for free.`,
            };
            const result = getSuitableTournaments(tournaments, 225, 'male');
            expect(result).toEqual(expectedResult);
        });
    }

    // do not show free message when user already registered for free ladders
    {
        it('Should not show free message as user already registered for all free ladders', () => {
            const tournaments = [men30, men35, men40, men45, men3540].map((item) => ({ ...item, isActivePlay: false }));
            const expectedResult = {
                all: [30],
                suitable: [30],
                additional: [],
                free: [30],
                text: `Since your [TLR is 2.25], you're allowed to join only the following ladders. Other ladders are too weak or too strong for you.`,
            };
            const result = getSuitableTournaments(tournaments, 225, 'male', false, [30]);
            expect(result).toEqual(expectedResult);
        });
    }

    // free registration
    {
        it('Should return suitable tournaments for TLR 3.75 and free season', () => {
            const tournaments = [men30, men35, men40, men45, men3540];
            const expectedResult = {
                all: [35, 40, 3540],
                suitable: [35, 40],
                additional: [],
                free: [],
                text: `Since your [TLR is 3.75], you're allowed to join only the following ladders. Other ladders are too weak or too strong for you.`,
            };
            const result = getSuitableTournaments(tournaments, 375, 'male', true);
            expect(result).toEqual(expectedResult);
        });
    }
});

describe('getPartners()', () => {
    it('Should return proper partners', () => {
        const pairs: [number, number | null][] = [
            [2, null],
            [5, 1],
            [3, 1],
            [6, null],
            [1, null],
            [4, 2],
        ];
        const expectedResult = {
            1: [1, 3, 5],
            2: [2, 4],
            3: [1, 3, 5],
            4: [2, 4],
            5: [1, 3, 5],
            6: [6],
        };
        expect(getPartners(pairs)).toEqual(expectedResult);
    });
});
