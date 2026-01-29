import getScoreAsString from './getScoreAsString';

describe('getScoreAsString()', () => {
    const variants = [
        {
            score: [],
            wonByInjury: false,
            result: '',
        },
        {
            score: [[4, 7]],
            wonByInjury: false,
            result: '',
        },
        {
            score: [
                [6, 4],
                [3, 5],
                [4, 6],
            ],
            wonByInjury: false,
            result: '6-4',
        },
        {
            score: [
                [6, 4],
                [4, 6],
                [2, 2],
            ],
            wonByInjury: false,
            result: '6-4 4-6',
        },
        {
            score: [
                [6, 4],
                [6, 4],
                [4, 6],
            ],
            wonByInjury: false,
            result: '6-4 6-4',
        },
        {
            score: [
                [6, 4],
                [3, 6],
                [7, 6],
            ],
            wonByInjury: false,
            result: '6-4 3-6 7-6',
        },
        {
            score: [
                [6, 4],
                [3, 6],
                [1, 0],
            ],
            wonByInjury: false,
            result: '6-4 3-6',
        },
        {
            score: [
                [6, 4],
                [3, 6],
                [1, 0],
            ],
            wonByInjury: false,
            isMatchTieBreak: true,
            result: '6-4 3-6 1-0',
        },
        {
            score: [
                [6, 4],
                [2, 2],
                [7, 6],
            ],
            wonByInjury: true,
            result: '6-4 2-2',
        },
        {
            score: [
                [1, 1],
                [2, 2],
                [7, 6],
            ],
            wonByInjury: true,
            result: '1-1',
        },
        {
            score: [
                [6, 3],
                [6, 4],
                [3, 3],
            ],
            wonByInjury: true,
            result: '6-3 0-0',
        },
        {
            score: [
                [6, 3],
                [6, 4],
                [4, 6],
            ],
            wonByInjury: true,
            result: '6-3 0-0',
        },
        {
            score: [
                [0, 6],
                [0, 6],
                [0, 0],
            ],
            wonByInjury: true,
            result: '0-6 0-0',
        },
        {
            score: [
                [6, 3],
                [4, 6],
                [6, 2],
            ],
            wonByInjury: true,
            result: '6-3 4-6 0-0',
        },
        {
            score: [
                [6, 3],
                [4, 7],
            ],
            wonByInjury: true,
            result: '6-3 0-0',
        },
        {
            score: [
                [6, 3],
                [3, 6],
            ],
            wonByInjury: true,
            result: '6-3 3-6 0-0',
        },
        {
            score: [[6, 3]],
            wonByInjury: true,
            result: '6-3 0-0',
        },
        {
            score: [
                [6, 3],
                [0, 0],
            ],
            wonByInjury: true,
            result: '6-3 0-0',
        },
        {
            score: [
                [0, 0],
                [4, 4],
            ],
            wonByInjury: true,
            result: '0-0',
        },
        {
            score: [
                [null, null],
                [null, null],
                [null, null],
            ],
            wonByInjury: true,
            result: '0-0',
        },
        {
            score: [
                [0, null],
                [null, null],
                [null, null],
            ],
            wonByInjury: true,
            result: '0-0',
        },
        {
            score: [
                [6, 4],
                [null, null],
                [null, null],
            ],
            wonByInjury: true,
            result: '6-4 0-0',
        },
        {
            score: [
                [6, 4],
                [0, null],
                [null, null],
            ],
            wonByInjury: true,
            result: '6-4 0-0',
        },
        {
            score: [[4, 7]],
            wonByInjury: true,
            result: '0-0',
        },
        {
            score: [],
            wonByInjury: true,
            result: '0-0',
        },
    ];

    for (const { result, ...values } of variants) {
        const scoreStr = values.score.map((item) => item.join('-')).join(' ');

        it(`Should convert ${scoreStr} (isInjury = ${values.wonByInjury}) to ${result}`, () => {
            expect(getScoreAsString(values)).toBe(result);
        });
    }
});
