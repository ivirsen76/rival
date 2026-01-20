import { calculateNextOrder } from './helpers';

const defaultParams = {
    payments: [],
    allTournaments: [],
    tournaments: [],
    singlesCost: 3000,
    doublesCost: 2000,
    additionalLadderDiscount: 1000,
    earlyRegistrationDiscount: 500,
    isEarlyRegistration: false,
};

describe('calculateNextOrder()', () => {
    it('Should return right result for one level with early registration', () => {
        const params = {
            ...defaultParams,
            tournaments: [
                { id: 1, levelName: 'Men 3.5', levelType: 'single', seasonYear: 2022, seasonSeason: 'summer' },
            ],
            isEarlyRegistration: true,
            partners: {
                'partner-13-1': 'first@gmail.com',
                'partner-13-2': '',
            },
        };

        const expectedResult = {
            payload: {
                transactions: [
                    {
                        type: 'product',
                        tournamentId: 1,
                        description: '2022 Summer - Men 3.5 Ladder (early registration)',
                        cost: -2500,
                    },
                ],
                partners: {
                    'partner-13-1': 'first@gmail.com',
                },
            },
            total: 2500,
            prevBalance: 0,
            newBalance: 0,
        };

        expect(calculateNextOrder(params)).toEqual(expectedResult);
    });

    it('Should return right result for one level', () => {
        const params = {
            ...defaultParams,
            tournaments: [
                { id: 1, levelName: 'Men 3.5', levelType: 'single', seasonYear: 2022, seasonSeason: 'summer' },
            ],
        };

        const expectedResult = {
            payload: {
                transactions: [
                    { type: 'product', tournamentId: 1, description: '2022 Summer - Men 3.5 Ladder', cost: -3000 },
                ],
            },
            total: 3000,
            prevBalance: 0,
            newBalance: 0,
        };

        expect(calculateNextOrder(params)).toEqual(expectedResult);
    });

    it('Should return right result for two levels with early registration', () => {
        const params = {
            ...defaultParams,
            tournaments: [
                { id: 1, levelName: 'Men 3.5', levelType: 'single', seasonYear: 2022, seasonSeason: 'summer' },
                { id: 2, levelName: 'Men Doubles', levelType: 'doubles', seasonYear: 2022, seasonSeason: 'summer' },
            ],
            isEarlyRegistration: true,
        };

        const expectedResult = {
            payload: {
                transactions: [
                    {
                        type: 'product',
                        tournamentId: 1,
                        description: '2022 Summer - Men 3.5 Ladder (early registration)',
                        cost: -2500,
                    },
                    {
                        type: 'product',
                        tournamentId: 2,
                        description: '2022 Summer - Men Doubles Ladder (early registration, additional ladder)',
                        cost: -500,
                    },
                ],
            },
            total: 3000,
            prevBalance: 0,
            newBalance: 0,
        };

        expect(calculateNextOrder(params)).toEqual(expectedResult);
    });

    it('Should return right result for two levels', () => {
        const params = {
            ...defaultParams,
            tournaments: [
                { id: 1, levelName: 'Men 3.5', levelType: 'single', seasonYear: 2022, seasonSeason: 'summer' },
                { id: 2, levelName: 'Men Doubles', levelType: 'doubles', seasonYear: 2022, seasonSeason: 'summer' },
            ],
        };

        const expectedResult = {
            payload: {
                transactions: [
                    { type: 'product', tournamentId: 1, description: '2022 Summer - Men 3.5 Ladder', cost: -3000 },
                    {
                        type: 'product',
                        tournamentId: 2,
                        description: '2022 Summer - Men Doubles Ladder (additional ladder)',
                        cost: -1000,
                    },
                ],
            },
            total: 4000,
            prevBalance: 0,
            newBalance: 0,
        };

        expect(calculateNextOrder(params)).toEqual(expectedResult);
    });

    it('Should return right result for one level with some balance', () => {
        const params = {
            ...defaultParams,
            payments: [{ amount: 500 }],
            tournaments: [
                { id: 1, levelName: 'Men 3.5 Doubles', levelType: 'doubles', seasonYear: 2022, seasonSeason: 'summer' },
            ],
        };

        const expectedResult = {
            payload: {
                transactions: [
                    {
                        type: 'product',
                        tournamentId: 1,
                        description: '2022 Summer - Men 3.5 Doubles Ladder',
                        cost: -2000,
                    },
                    { type: 'balance', description: 'From Wallet', cost: 500 },
                ],
            },
            total: 1500,
            prevBalance: 500,
            newBalance: 0,
        };

        expect(calculateNextOrder(params)).toEqual(expectedResult);
    });

    it('Should return right result for three levels with big balance', () => {
        const params = {
            ...defaultParams,
            payments: [{ amount: 400 }, { amount: 8000 }],
            tournaments: [
                { id: 1, levelName: 'Men 3.5', levelType: 'single', seasonYear: 2022, seasonSeason: 'summer' },
                { id: 2, levelName: 'Men Doubles', levelType: 'doubles', seasonYear: 2022, seasonSeason: 'summer' },
                { id: 3, levelName: 'Men 4.5 Doubles', levelType: 'doubles', seasonYear: 2022, seasonSeason: 'summer' },
            ],
        };

        const expectedResult = {
            payload: {
                transactions: [
                    { type: 'product', tournamentId: 1, description: '2022 Summer - Men 3.5 Ladder', cost: -3000 },
                    {
                        type: 'product',
                        tournamentId: 2,
                        description: '2022 Summer - Men Doubles Ladder (additional ladder)',
                        cost: -1000,
                    },
                    {
                        type: 'product',
                        tournamentId: 3,
                        description: '2022 Summer - Men 4.5 Doubles Ladder (additional ladder)',
                        cost: -1000,
                    },
                    { type: 'balance', description: 'From Wallet', cost: 5000 },
                ],
            },
            total: 0,
            prevBalance: 8400,
            newBalance: 3400,
        };

        expect(calculateNextOrder(params)).toEqual(expectedResult);
    });

    it('Should return right result for additional ladder', () => {
        const params = {
            ...defaultParams,
            payments: [{ amount: 10000 }, { amount: -3000, tournamentId: 1 }],
            allTournaments: [{ id: 1 }, { id: 2 }, { id: 3 }],
            tournaments: [
                { id: 2, levelName: 'Men Doubles', levelType: 'doubles', seasonYear: 2022, seasonSeason: 'summer' },
                { id: 3, levelName: 'Men 4.0', levelType: 'singles', seasonYear: 2022, seasonSeason: 'summer' },
            ],
        };

        const expectedResult = {
            payload: {
                transactions: [
                    {
                        type: 'product',
                        tournamentId: 2,
                        description: '2022 Summer - Men Doubles Ladder (additional ladder)',
                        cost: -1000,
                    },
                    {
                        type: 'product',
                        tournamentId: 3,
                        description: '2022 Summer - Men 4.0 Ladder (additional ladder)',
                        cost: -2000,
                    },
                    { type: 'balance', description: 'From Wallet', cost: 3000 },
                ],
            },
            total: 0,
            prevBalance: 7000,
            newBalance: 4000,
        };

        expect(calculateNextOrder(params)).toEqual(expectedResult);
    });
});
