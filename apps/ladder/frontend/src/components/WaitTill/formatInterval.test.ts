import formatInterval from './formatInterval';

describe('formatInterval', () => {
    it('Should return right values', () => {
        expect(formatInterval(45)).toBe('45s');
        expect(formatInterval(60)).toBe('1m 0s');
        expect(formatInterval(61)).toBe('1m 1s');
        expect(formatInterval(120)).toBe('2m 0s');
        expect(formatInterval(305)).toBe('5m 5s');
    });
});
