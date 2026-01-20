import { getPercentile } from './helpers';

describe('getPercentile()', () => {
    const total = 40;
    const variants = [
        [1, 3],
        [2, 5],
        [20, 50],
        [39, 98],
        [40, 100],
    ];

    for (const [pos, result] of variants) {
        it(`Should return right percentile for ${pos} position`, () => {
            expect(getPercentile(pos, total)).toBe(result);
        });
    }
});
