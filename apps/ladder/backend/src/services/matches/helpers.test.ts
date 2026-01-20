import {
    revertScore,
    getPoints,
    isFullScoreCorrect,
    isFastScoreCorrect,
    isFullSetScoreCorrect,
    isFastSetScoreCorrect,
    isInjuryFullSetScoreCorrect,
    isInjuryFastSetScoreCorrect,
    completeInjuryFullScore,
    completeInjuryFastScore,
    getOutcome,
} from './helpers';

describe('isFullSetScoreCorrect()', () => {
    describe('Incorrect variants', () => {
        const variants = [
            [null, null],
            [3, null],
            [null, 3],
            [1, 0],
            [3, 3],
            [6, 5],
            [4, 7],
            [7, 7],
            [6, 6],
        ];

        for (const variant of variants) {
            it(`Should return false for [${variant.join(', ')}]`, () => {
                const values = {
                    challengerPoints: variant[0],
                    acceptorPoints: variant[1],
                    isMatchTieBreak: variant[2],
                };
                expect(isFullSetScoreCorrect(values)).toBe(false);
            });
        }
    });

    describe('Correct variants', () => {
        const variants = [
            [7, 5],
            [4, 6],
            [7, 6],
            [6, 7],
            [6, 0],
            [1, 0, true],
        ];

        for (const variant of variants) {
            it(`Should return true for [${variant.join(', ')}]`, () => {
                const values = {
                    challengerPoints: variant[0],
                    acceptorPoints: variant[1],
                    isMatchTieBreak: variant[2],
                };
                expect(isFullSetScoreCorrect(values)).toBe(true);
            });
        }
    });
});

describe('isFastSetScoreCorrect()', () => {
    describe('Incorrect variants', () => {
        const variants = [
            [null, null],
            [3, null],
            [null, 3],
            [1, 0],
            [3, 3],
            [3, 2],
            [4, 4],
        ];

        for (const variant of variants) {
            it(`Should return false for [${variant.join(', ')}]`, () => {
                const values = {
                    challengerPoints: variant[0],
                    acceptorPoints: variant[1],
                    isMatchTieBreak: variant[2],
                };
                expect(isFastSetScoreCorrect(values)).toBe(false);
            });
        }
    });

    describe('Correct variants', () => {
        const variants = [
            [4, 2],
            [2, 4],
            [4, 3],
            [3, 4],
            [4, 0],
            [1, 0, true],
        ];

        for (const variant of variants) {
            it(`Should return true for [${variant.join(', ')}]`, () => {
                const values = {
                    challengerPoints: variant[0],
                    acceptorPoints: variant[1],
                    isMatchTieBreak: variant[2],
                };
                expect(isFastSetScoreCorrect(values)).toBe(true);
            });
        }
    });
});

describe('isInjuryFullSetScoreCorrect()', () => {
    describe('Incorrect variants', () => {
        const variants = [
            [null, null],
            [3, null],
            [null, 3],
            [4, 7],
            [7, 7],
            [9, 2],
        ];

        for (const variant of variants) {
            it(`Should return false for [${variant.join(', ')}]`, () => {
                const values = {
                    challengerPoints: variant[0],
                    acceptorPoints: variant[1],
                };
                expect(isInjuryFullSetScoreCorrect(values)).toBe(false);
            });
        }
    });

    describe('Correct variants', () => {
        const variants = [
            [1, 0],
            [7, 5],
            [4, 6],
            [7, 6],
            [6, 7],
            [6, 0],
            [3, 3],
            [0, 0],
        ];

        for (const variant of variants) {
            it(`Should return true for [${variant.join(', ')}]`, () => {
                const values = {
                    challengerPoints: variant[0],
                    acceptorPoints: variant[1],
                };
                expect(isInjuryFullSetScoreCorrect(values)).toBe(true);
            });
        }
    });
});

describe('isInjuryFastSetScoreCorrect()', () => {
    describe('Incorrect variants', () => {
        const variants = [
            [null, null],
            [3, null],
            [null, 3],
            [2, 5],
            [4, 4],
            [6, 2],
        ];

        for (const variant of variants) {
            it(`Should return false for [${variant.join(', ')}]`, () => {
                const values = {
                    challengerPoints: variant[0],
                    acceptorPoints: variant[1],
                };
                expect(isInjuryFastSetScoreCorrect(values)).toBe(false);
            });
        }
    });

    describe('Correct variants', () => {
        const variants = [
            [1, 0],
            [4, 3],
            [2, 4],
            [3, 4],
            [4, 0],
            [3, 3],
            [2, 2],
            [0, 0],
        ];

        for (const variant of variants) {
            it(`Should return true for [${variant.join(', ')}]`, () => {
                const values = {
                    challengerPoints: variant[0],
                    acceptorPoints: variant[1],
                };
                expect(isInjuryFastSetScoreCorrect(values)).toBe(true);
            });
        }
    });
});

describe('revertScore()', () => {
    it('Should revert the score', () => {
        expect(revertScore('6-7(8) 7-6(2) 6-4')).toBe('7-6(8) 6-7(2) 4-6');
    });
});

describe('getPoints()', () => {
    const variants = [
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 3,
                acceptorRank: 4,
                score: '0-6 3-6',
            },
            result: {
                challengerPoints: 7,
                acceptorPoints: 26,
                winner: 2,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 3,
                acceptorRank: 3,
                score: '0-6 3-6',
            },
            result: {
                challengerPoints: 7,
                acceptorPoints: 26,
                winner: 2,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 4,
                acceptorRank: 3,
                score: '0-6 3-6',
            },
            result: {
                challengerPoints: 7,
                acceptorPoints: 21,
                winner: 2,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 5,
                acceptorRank: 3,
                score: '0-6 3-6',
            },
            result: {
                challengerPoints: 7,
                acceptorPoints: 21,
                winner: 2,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 4,
                acceptorRank: 51,
                score: '4-6 6-2 7-6',
            },
            result: {
                challengerPoints: 17,
                acceptorPoints: 12,
                winner: 1,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 27,
                acceptorRank: 32,
                score: '6-1 6-2',
            },
            result: {
                challengerPoints: 23,
                acceptorPoints: 5,
                winner: 1,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 15,
                acceptorRank: 5,
                score: '6-7 7-6 6-4',
            },
            result: {
                challengerPoints: 29,
                acceptorPoints: 12,
                winner: 1,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 3,
                acceptorRank: 7,
                score: '2-6 3-6',
            },
            result: {
                challengerPoints: 9,
                acceptorPoints: 31,
                winner: 2,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 2,
                acceptorRank: 9,
                score: '3-6 6-1 2-6',
            },
            result: {
                challengerPoints: 14,
                acceptorPoints: 24,
                winner: 2,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 2,
                acceptorRank: 9,
                score: '6-0 6-0',
                wonByDefault: true,
            },
            result: {
                challengerPoints: 20,
                acceptorPoints: 0,
                winner: 1,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 2,
                acceptorRank: 9,
                score: '0-6 0-6',
                wonByDefault: true,
            },
            result: {
                challengerPoints: 0,
                acceptorPoints: 20,
                winner: 2,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 2,
                acceptorRank: 9,
                score: '0-6 0-6',
                unavailable: true,
            },
            result: {
                challengerPoints: 0,
                acceptorPoints: 0,
                winner: 2,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 2,
                acceptorRank: 9,
                score: '3-6 6-1 2-0',
                winner: 2,
                wonByInjury: true,
            },
            result: {
                challengerPoints: 14,
                acceptorPoints: 24,
                winner: 2,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 3,
                acceptorRank: 4,
                score: '0-4 2-4',
                matchFormat: 2,
            },
            result: {
                challengerPoints: 6,
                acceptorPoints: 23,
                winner: 2,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 3,
                acceptorRank: 3,
                score: '0-4 2-4',
                matchFormat: 2,
            },
            result: {
                challengerPoints: 6,
                acceptorPoints: 23,
                winner: 2,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 4,
                acceptorRank: 3,
                score: '0-4 2-4',
                matchFormat: 2,
            },
            result: {
                challengerPoints: 6,
                acceptorPoints: 18,
                winner: 2,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 5,
                acceptorRank: 3,
                score: '0-4 2-4',
                matchFormat: 2,
            },
            result: {
                challengerPoints: 6,
                acceptorPoints: 18,
                winner: 2,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 4,
                acceptorRank: 51,
                score: '3-4 4-1 1-0',
                matchFormat: 2,
            },
            result: {
                challengerPoints: 17,
                acceptorPoints: 7,
                winner: 1,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 27,
                acceptorRank: 32,
                score: '4-0 4-1',
                matchFormat: 2,
            },
            result: {
                challengerPoints: 21,
                acceptorPoints: 3,
                winner: 1,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 15,
                acceptorRank: 5,
                score: '3-4 4-3 1-0',
                matchFormat: 2,
            },
            result: {
                challengerPoints: 29,
                acceptorPoints: 9,
                winner: 1,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 3,
                acceptorRank: 7,
                score: '2-4 3-4',
                matchFormat: 2,
            },
            result: {
                challengerPoints: 9,
                acceptorPoints: 23,
                winner: 2,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 2,
                acceptorRank: 9,
                score: '2-4 4-1 0-1',
                matchFormat: 2,
            },
            result: {
                challengerPoints: 10,
                acceptorPoints: 24,
                winner: 2,
            },
        },
        {
            data: {
                challengerId: 1,
                acceptorId: 2,
                challengerRank: 2,
                acceptorRank: 9,
                score: '2-4 2-1', // 2-4 2-4 - completed score
                winner: 2,
                wonByInjury: true,
                matchFormat: 2,
            },
            result: {
                challengerPoints: 8,
                acceptorPoints: 31,
                winner: 2,
            },
        },
    ];

    for (const variant of variants) {
        it(`Should return right result for score ${variant.data.score}`, () => {
            expect(getPoints(variant.data)).toEqual(variant.result);
        });
    }
});

describe('isFullScoreCorrect()', () => {
    const wrongVariants = [
        '6-4 6-4 6-4',
        '7-4 7-6',
        '6-6 7-6',
        '6-4 4-6',
        '6-4 6-4(2)',
        '7-6',
        'g-6 7-6',
        '7-6(100) 6-7 7-6',
        '5-7 6-7 3-6',
        '6-4 1-0',
        '6-4 0-1 4-6',
        '6-4 6-3 4-6',
        '6-4 7-6(4)',
        '10-8 12-6',
    ];
    const rightVariants = ['7-6 6-7 6-4', '6-4 4-6 1-0', '6-4 6-3'];

    it(`Should return false for score with match tiebreak`, () => {
        expect(isFullScoreCorrect('3-6 6-3 1-0', false)).toBe(false);
    });

    for (const variant of wrongVariants) {
        it(`Should return false for score ${variant}`, () => {
            expect(isFullScoreCorrect(variant)).toBe(false);
        });
    }

    for (const variant of rightVariants) {
        it(`Should return true for score ${variant}`, () => {
            expect(isFullScoreCorrect(variant)).toBe(true);
        });
    }
});

describe('isFastScoreCorrect()', () => {
    const wrongVariants = [
        '4-2 4-2 4-2',
        '5-3 4-3',
        '3-3 4-3',
        '4-2 2-4',
        '4-2 4-2(2)',
        '4-3',
        'g-3 4-3',
        '4-3(100) 3-4 4-3',
        '2-4 3-4 1-4',
        '4-2 1-0',
        '4-2 0-1 2-4',
        '4-2 4-1 2-4',
        '4-2 4-3(4)',
        '10-8 12-6',
        '4-3 3-4 4-2',
    ];
    const rightVariants = ['4-3 3-4 1-0', '4-2 2-4 1-0', '4-2 4-1', '4-3 4-3'];

    for (const variant of wrongVariants) {
        it(`Should return false for score ${variant}`, () => {
            expect(isFastScoreCorrect(variant)).toBe(false);
        });
    }

    for (const variant of rightVariants) {
        it(`Should return true for score ${variant}`, () => {
            expect(isFastScoreCorrect(variant)).toBe(true);
        });
    }
});

describe('completeInjuryFullScore()', () => {
    it(`Should return complete empty score`, () => {
        expect(completeInjuryFullScore('', true)).toBe('6-0 6-0');
    });

    it(`Should return complete score 0-0`, () => {
        expect(completeInjuryFullScore('0-0', true)).toBe('6-0 6-0');
    });

    it(`Should return complete score 6-0 4-4`, () => {
        expect(completeInjuryFullScore('6-0 4-4', true)).toBe('6-0 6-4');
    });

    it(`Should return complete score 6-6`, () => {
        expect(completeInjuryFullScore('6-6', false)).toBe('6-7 0-6');
    });

    it(`Should return complete score 7-5 5-5`, () => {
        expect(completeInjuryFullScore('7-5 5-5', true)).toBe('7-5 7-5');
    });

    it(`Should return complete score 7-5 6-7`, () => {
        expect(completeInjuryFullScore('7-5 6-7', false)).toBe('7-5 6-7 0-1');
    });

    it(`Should return complete score 1-6 7-6 0-0`, () => {
        expect(completeInjuryFullScore('1-6 7-6 0-0', false)).toBe('1-6 7-6 0-1');
    });

    it(`Should return complete score 7-5 6-7 0-1`, () => {
        expect(completeInjuryFullScore('7-5 6-7 0-1', false)).toBe('7-5 6-7 0-6');
    });

    it(`Should return complete score 7-5 6-7 0-1 with another winner`, () => {
        expect(completeInjuryFullScore('7-5 6-7 0-1', true)).toBe('7-5 6-7 6-1');
    });

    it(`Should return complete score 7-5 0-0`, () => {
        expect(completeInjuryFullScore('7-5 0-0', true)).toBe('7-5 6-0');
    });
});

describe('completeInjuryFastScore()', () => {
    it(`Should return complete empty score`, () => {
        expect(completeInjuryFastScore('', true)).toBe('4-0 4-0');
    });

    it(`Should return complete score 0-0`, () => {
        expect(completeInjuryFastScore('0-0', true)).toBe('4-0 4-0');
    });

    it(`Should return complete score 4-0 3-3`, () => {
        expect(completeInjuryFastScore('4-0 3-3', true)).toBe('4-0 4-3');
    });

    it(`Should return complete score 3-3`, () => {
        expect(completeInjuryFastScore('3-3', false)).toBe('3-4 0-4');
    });

    it(`Should return complete score 4-3 3-3`, () => {
        expect(completeInjuryFastScore('4-3 3-3', true)).toBe('4-3 4-3');
    });

    it(`Should return complete score 4-3 3-4`, () => {
        expect(completeInjuryFastScore('4-3 3-4', false)).toBe('4-3 3-4 0-1');
    });

    it(`Should return complete score 1-4 4-3 0-0`, () => {
        expect(completeInjuryFastScore('1-4 4-3 0-0', false)).toBe('1-4 4-3 0-1');
    });

    it(`Should return complete score 4-2 0-0`, () => {
        expect(completeInjuryFastScore('4-2 0-0', true)).toBe('4-2 4-0');
    });
});

describe('getOutcome()', () => {
    const options = {
        '0-6 1-6': 0,
        '0-6 3-6': 0,
        '6-0 6-0': 1,
        '6-1 6-1': 1,
        '6-1 6-2': 1,
        '6-2 6-2': 0.98,
        '6-3 6-3': 0.92,
        '6-4 6-4': 0.86,
        '7-5 7-5': 0.8,
        '7-5 5-5': 0.8,
        '7-6 4-4': 0.77,
        '7-6 7-1': 0.71,
        '7-6 6-6': 0.68,
        '7-6 6-5': 0.74,
        '7-5 0-6 7-5': 0.5,
        '7-6 0-6 7-6': 0.38,
        '7-6 0-6 1-0': 0.41,
        '7-6 0-6 10-5': 0.41,
        '7-6 0-6 4-3': 0.5,

        // Fast4
        '0-4 0-4': 0,
        '0-4 1-4': 0,
        '1-4 1-4': 0.02,
        '4-1 4-1': 0.98,
        '4-2 4-1': 0.92,
        '4-2 4-2': 0.86,
        '4-2 4-3': 0.77,
        '4-3 4-3': 0.68,
        '4-3 3-4 1-0': 0.62,
        '4-3 0-4 1-0': 0.41,
    };

    for (const [score, result] of Object.entries(options)) {
        it(`Should return ${result} for the score "${score}"`, () => {
            expect(getOutcome(score)).toBe(result);
        });
    }
});
