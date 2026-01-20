import { getSlug, getMedian } from './helpers';

describe('getSlug()', () => {
    it('Should return slug', () => {
        expect(getSlug(" Men's  3.5---more ")).toBe('mens-35-more');
    });
});

describe('getMedian()', () => {
    it('Should return median value', () => {
        expect(getMedian([22, 0, 1])).toBe(1);
        expect(getMedian([22, 0, 1, 9])).toBe(5);
    });
});
