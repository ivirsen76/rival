import getBetPoints from './getBetPoints';

describe('getBetPoints()', () => {
    const matches = [
        { finalSpot: 3, challengerId: 1, acceptorId: 2, winner: 1, score: '6-3 6-3' },
        { finalSpot: 2, challengerId: 3, acceptorId: 4, winner: 4, score: '3-5', wonByInjure: true },
        { finalSpot: 1, challengerId: 1, acceptorId: 4 },
    ];

    it('Should return points for all results guessed', () => {
        const prediction = [
            { finalSpot: 3, challengerId: 1, acceptorId: 2, winner: 1, sets: 2 },
            { finalSpot: 2, challengerId: 3, acceptorId: 4, winner: 4, sets: 2 },
            { finalSpot: 1, challengerId: 1, acceptorId: 4, winner: 1, sets: 3 },
        ];
        const result = getBetPoints(matches, prediction);
        expect(result.points).toBe(6);
        expect(result.maxPoints).toBe(9);
    });

    it('Should return points for all results missed', () => {
        const prediction = [
            { finalSpot: 3, challengerId: 1, acceptorId: 2, winner: 2, sets: 2 },
            { finalSpot: 2, challengerId: 3, acceptorId: 4, winner: 3, sets: 2 },
            { finalSpot: 1, challengerId: 2, acceptorId: 3, winner: 2, sets: 3 },
        ];
        const result = getBetPoints(matches, prediction);
        expect(result.points).toBe(0);
        expect(result.maxPoints).toBe(0);
    });

    it('Should return points for mixed result', () => {
        const prediction = [
            { finalSpot: 3, challengerId: 1, acceptorId: 2, winner: 1, sets: 2 },
            { finalSpot: 2, challengerId: 3, acceptorId: 4, winner: 4, sets: 3 },
            { finalSpot: 1, challengerId: 1, acceptorId: 4, winner: 1, sets: 3 },
        ];
        const result = getBetPoints(matches, prediction);
        expect(result.points).toBe(5);
        expect(result.maxPoints).toBe(8);
    });

    it('Should return points for max points fail', () => {
        const matches1 = [
            { finalSpot: 3, challengerId: 1, acceptorId: 2, winner: 1, score: '6-3 6-3' },
            { finalSpot: 2, challengerId: 3, acceptorId: 4 },
            { finalSpot: 1, challengerId: 1 },
        ];
        const prediction = [
            { finalSpot: 3, challengerId: 1, acceptorId: 2, winner: 2, sets: 2 },
            { finalSpot: 2, challengerId: 3, acceptorId: 4, winner: 4, sets: 2 },
            { finalSpot: 1, challengerId: 2, acceptorId: 4, winner: 2, sets: 3 },
        ];
        const result = getBetPoints(matches1, prediction);
        expect(result.points).toBe(0);
        expect(result.maxPoints).toBe(3);
    });

    it('Should return max points for no matches bracket', () => {
        const matches1 = [
            { finalSpot: 3, challengerId: 1, acceptorId: 2 },
            { finalSpot: 2, challengerId: 3, acceptorId: 4 },
        ];
        const prediction = [
            { finalSpot: 4, challengerId: 99999, acceptorId: 1 },
            { finalSpot: 3, challengerId: 1, acceptorId: 2, winner: 2, sets: 2 },
            { finalSpot: 2, challengerId: 3, acceptorId: 4, winner: 4, sets: 2 },
            { finalSpot: 1, challengerId: 2, acceptorId: 4, winner: 2, sets: 3 },
        ];
        const result = getBetPoints(matches1, prediction);
        expect(result.points).toBe(0);
        expect(result.maxPoints).toBe(9);
    });
});
