import { getUserMilestone } from './helpers';

describe('getUserMilestone', () => {
    it('Should return right numbers', () => {
        expect(getUserMilestone(150)).toBe(150);
        expect(getUserMilestone(99)).toBe(50);
        expect(getUserMilestone(101)).toBe(100);
        expect(getUserMilestone(199)).toBe(150);
        expect(getUserMilestone(4)).toBe(4);
        expect(getUserMilestone(6)).toBe(5);
        expect(getUserMilestone(15)).toBe(10);
        expect(getUserMilestone(49)).toBe(40);
    });
});
