// @ts-nocheck
import getScore from './getScore';
import pointsExample from './pointsExample.json';
import tiebreakExample from './tiebreakExample.json';
import matchTiebreakExample from './matchTiebreakExample.json';
import thirdSetTiebreakExample from './thirdSetTiebreakExample.json';

describe('getScore()', () => {
    it('Should return right result', () => {
        expect(getScore(pointsExample)).toBe('7-5 6-2');
    });

    it('Should return right result for tiebreak', () => {
        expect(getScore(tiebreakExample)).toBe('1-6 6-7');
    });

    it('Should return right result for the match tiebreak', () => {
        expect(getScore(matchTiebreakExample)).toBe('6-4 4-6 1-0');
    });

    it('Should return right result for the third set tiebreak', () => {
        expect(getScore(thirdSetTiebreakExample)).toBe('4-6 6-0 7-6');
    });
});
