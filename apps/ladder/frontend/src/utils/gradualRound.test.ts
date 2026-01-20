import gradualRound from './gradualRound';

describe('gradualRound()', () => {
    it(`Should return right result`, () => {
        expect(gradualRound(99)).toBe(50);
        expect(gradualRound(149)).toBe(100);
        expect(gradualRound(499)).toBe(450);
        expect(gradualRound(720)).toBe(700);
        expect(gradualRound(1299)).toBe(1200);
        expect(gradualRound(4299)).toBe(4200);
        expect(gradualRound(9800)).toBe(9500);
        expect(gradualRound(11999)).toBe(11000);
        expect(gradualRound(54999)).toBe(50000);
    });
});
