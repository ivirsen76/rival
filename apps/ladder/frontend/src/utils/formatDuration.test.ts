import formatDuration from './formatDuration';

describe('formatDuration()', () => {
    const variants = {
        12: '12 s',
        1: '1 s',
        0: '0 s',
        60: '1 min 0 s',
        61: '1 min 1 s',
        3600: '1 hour',
        3661: '1 hour 1 min',
        36000: '10 hours',
    };

    for (const [num, expectedResult] of Object.entries(variants)) {
        it(`Should format ${num} seconds`, () => {
            expect(formatDuration(Number(num))).toBe(expectedResult);
        });
    }
});
