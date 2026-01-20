import { validate } from './index';

describe('validate()', () => {
    const variants = [
        {
            score: [
                [6, 6],
                [null, null],
                [null, null],
            ],
            currentSetNumber: 1,
            wonByInjury: false,
            errors: {
                score: 'The score is incorrect.',
            },
        },
        {
            score: [
                [7, 6],
                [6, 4],
                [null, null],
            ],
            currentSetNumber: 2,
            wonByInjury: true,
            errors: {
                score: 'Retirement score should be incomplete.',
            },
        },
        {
            score: [
                [7, 6],
                [4, 6],
                [1, 0],
            ],
            currentSetNumber: 3,
            wonByInjury: false,
            isMatchTieBreak: false,
            errors: {
                score: 'The score is incorrect.',
            },
        },
        {
            score: [
                [7, 6],
                [1, 0],
                [null, null],
            ],
            currentSetNumber: 2,
            wonByInjury: false,
            isMatchTieBreak: true,
            errors: {
                score: 'The score is incorrect.',
            },
        },
        {
            score: [
                [7, 6],
                [2, 6],
                [null, null],
            ],
            currentSetNumber: 2,
            wonByInjury: false,
            isMatchTieBreak: false,
            errors: {},
        },
        {
            score: [
                [3, 6],
                [6, 3],
                [1, 0],
            ],
            currentSetNumber: 3,
            wonByInjury: true,
            isMatchTieBreak: false,
            errors: {},
        },
        {
            score: [
                [2, 6],
                [6, 3],
                [null, null],
            ],
            currentSetNumber: 3,
            wonByInjury: true,
            isMatchTieBreak: false,
            errors: {},
        },
        {
            score: [
                [7, 6],
                [4, 6],
                [1, 0],
            ],
            currentSetNumber: 2,
            wonByInjury: false,
            isMatchTieBreak: false,
            errors: {},
        },
        {
            score: [
                [7, 6],
                [4, 6],
                [1, 0],
            ],
            currentSetNumber: 3,
            wonByInjury: false,
            isMatchTieBreak: true,
            errors: {},
        },
        {
            score: [
                [7, 6],
                [6, 4],
                [null, null],
            ],
            currentSetNumber: 1,
            wonByInjury: true,
            errors: {},
        },
        {
            score: [
                [6, 6],
                [null, null],
                [null, null],
            ],
            currentSetNumber: 1,
            wonByInjury: true,
            errors: {},
        },
        {
            score: [
                [7, 6],
                [6, 4],
                [null, null],
            ],
            currentSetNumber: 2,
            wonByInjury: false,
            errors: {},
        },
    ];

    for (const { errors, ...values } of variants) {
        const scoreStr = JSON.stringify(values.score);

        it(`Should match errors for score ${scoreStr} (isInjury = ${values.wonByInjury})`, () => {
            expect(validate(values)).toEqual(errors);
        });
    }
});
