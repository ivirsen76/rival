import sum from './formatSum';

describe('sum()', () => {
    const variants = [
        { value: -0, expectedResult: '$0.00' },
        { value: 0, expectedResult: '$0.00' },
        { value: 140, expectedResult: '$1.40' },
        { value: -1400, expectedResult: '-$14.00' },
        { value: 5100, expectedResult: '$51.00' },
        { value: 1167300, expectedResult: '$11,673.00' },
    ];

    for (const { value, expectedResult } of variants) {
        it(`Should format ${value}`, () => {
            expect(sum(value)).toBe(expectedResult);
        });
    }
});
