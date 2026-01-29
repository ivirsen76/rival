import formatSize from './formatSize';

describe('formatSize()', () => {
    const variants = [
        [99 * 1024, '99 KB'],
        [99 * 1000, '97 KB'],
        [10 * 1024 * 1024, '10 MB'],
        [10 * 1000 * 1000, '10 MB'],
        [0, '0 B'],
    ];

    for (const [value, expectedResult] of variants) {
        it(`Should format ${value}`, () => {
            expect(formatSize(value)).toBe(expectedResult);
        });
    }
});
