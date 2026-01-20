import { isInjuryFullSetScoreIncomplete, isInjuryFastSetScoreIncomplete, getAvailableSets } from './utils';

describe('isInjuryFullSetScoreIncomplete()', () => {
    describe('Incomplete variants', () => {
        const variants = [
            [1, 0],
            [0, 0],
            [6, 6],
        ];

        for (const variant of variants) {
            it(`Should return false for [${variant.join(', ')}]`, () => {
                const values = {
                    challengerPoints: variant[0],
                    acceptorPoints: variant[1],
                };
                expect(isInjuryFullSetScoreIncomplete(values)).toBe(true);
            });
        }
    });

    describe('Complete variants', () => {
        const variants = [
            [7, 5],
            [4, 6],
            [7, 6],
            [6, 7],
            [6, 0],
        ];

        for (const variant of variants) {
            it(`Should return true for [${variant.join(', ')}]`, () => {
                const values = {
                    challengerPoints: variant[0],
                    acceptorPoints: variant[1],
                };
                expect(isInjuryFullSetScoreIncomplete(values)).toBe(false);
            });
        }
    });
});

describe('isInjuryFastSetScoreIncomplete()', () => {
    describe('Incomplete variants', () => {
        const variants = [
            [1, 0],
            [0, 0],
            [3, 3],
        ];

        for (const variant of variants) {
            it(`Should return false for [${variant.join(', ')}]`, () => {
                const values = {
                    challengerPoints: variant[0],
                    acceptorPoints: variant[1],
                };
                expect(isInjuryFastSetScoreIncomplete(values)).toBe(true);
            });
        }
    });

    describe('Complete variants', () => {
        const variants = [
            [4, 2],
            [2, 4],
            [4, 3],
            [3, 4],
            [4, 0],
        ];

        for (const variant of variants) {
            it(`Should return true for [${variant.join(', ')}]`, () => {
                const values = {
                    challengerPoints: variant[0],
                    acceptorPoints: variant[1],
                };
                expect(isInjuryFastSetScoreIncomplete(values)).toBe(false);
            });
        }
    });
});

describe('getAvailableSets()', () => {
    describe('Full set', () => {
        const variants = [
            {
                score: [
                    [7, 6],
                    [1, 2],
                    [6, 7],
                ],
                result: [1, 2],
            },
            {
                score: [
                    [7, 6],
                    [7, 6],
                    [6, 7],
                ],
                result: [1, 2],
            },
            {
                score: [
                    [7, 6],
                    [7, 6],
                    [3, 4],
                ],
                result: [1, 2],
            },
            {
                score: [
                    [7, 6],
                    [6, 7],
                    [1, 0],
                ],
                result: [1, 2, 3],
            },
            {
                score: [
                    [2, 3],
                    [7, 6],
                    [7, 6],
                ],
                result: [1],
            },
            {
                score: [
                    [null, null],
                    [null, null],
                    [null, null],
                ],
                result: [1],
            },
        ];

        for (const variant of variants) {
            it(`Should return true for [${JSON.stringify(variant.score)}]`, () => {
                expect(getAvailableSets(variant.score)).toEqual(variant.result);
            });
        }
    });

    describe('Fast4', () => {
        const variants = [
            {
                score: [
                    [4, 3],
                    [1, 2],
                    [0, 1],
                ],
                result: [1, 2],
            },
            {
                score: [
                    [4, 3],
                    [4, 3],
                    [3, 4],
                ],
                result: [1, 2],
            },
            {
                score: [
                    [4, 3],
                    [4, 3],
                    [0, 1],
                ],
                result: [1, 2],
            },
            {
                score: [
                    [4, 3],
                    [3, 4],
                    [1, 0],
                ],
                result: [1, 2, 3],
            },
            {
                score: [
                    [2, 3],
                    [4, 3],
                    [4, 3],
                ],
                result: [1],
            },
            {
                score: [
                    [null, null],
                    [null, null],
                    [null, null],
                ],
                result: [1],
            },
        ];

        for (const variant of variants) {
            it(`Should return true for [${JSON.stringify(variant.score)}]`, () => {
                expect(getAvailableSets(variant.score, true)).toEqual(variant.result);
            });
        }

        it(`Should not return third set as available for fast4 and injury`, () => {
            expect(
                getAvailableSets(
                    [
                        [4, 3],
                        [3, 4],
                    ],
                    true,
                    true
                )
            ).toEqual([1, 2]);
        });
    });
});
