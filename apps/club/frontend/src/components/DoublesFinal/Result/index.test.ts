import { getPoints } from './index';

describe('getPoints()', () => {
    it('Should return 0 points', () => {
        const score = [[], [], []];
        expect(getPoints(score)).toEqual([0, 0, 0, 0]);
    });

    it('Should return points for missing result', () => {
        const score = [[3, 5], [2, 6], []];
        expect(getPoints(score)).toEqual([5, 9, 7, 11]);
    });

    it('Should return points for all results', () => {
        const score = [
            [3, 5],
            [2, 6],
            [1, 7],
        ];
        expect(getPoints(score)).toEqual([6, 16, 14, 12]);
    });
});
