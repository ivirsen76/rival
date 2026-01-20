import { reverseScore, getTotalGames } from './calculateElo';

describe('getTotalGames()', () => {
    it('Should get total games', () => {
        expect(getTotalGames('6-0 6-0')).toBe(12);
        expect(getTotalGames('0-0')).toBe(0);
        expect(getTotalGames('')).toBe(0);
        expect(getTotalGames('7-6 6-7 7-6')).toBe(39);
    });
});

describe('reverseScore()', () => {
    it('Should reverse the score', () => {
        expect(reverseScore('6-0 6-0')).toBe('0-6 0-6');
    });
});
