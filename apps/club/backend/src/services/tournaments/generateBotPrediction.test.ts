import type { Match } from '../../types';
import generateBotPrediction from './generateBotPrediction';

describe('generateBotPrediction()', () => {
    it('Should return bot prediction', () => {
        const matches = [
            { finalSpot: 3, challengerId: 1, acceptorId: 2 },
            { finalSpot: 2, challengerId: 3, acceptorId: 4 },
        ] as Match[];
        const players = {
            1: { elo: { elo: 420 } },
            2: { elo: { elo: 400 } },
            3: { elo: { elo: 415 } },
            4: { elo: { elo: 350 } },
        };
        const expectedResult = [
            { finalSpot: 3, challengerId: 1, acceptorId: 2, winner: 1, sets: 3 },
            { finalSpot: 2, challengerId: 3, acceptorId: 4, winner: 3, sets: 2 },
            { finalSpot: 1, challengerId: 1, acceptorId: 3, winner: 1, sets: 3 },
        ];

        expect(generateBotPrediction(matches, players)).toEqual(expectedResult);
    });

    it('Should return bot prediction with bye matches', () => {
        const matches = [
            { finalSpot: 3, challengerId: 1, acceptorId: 2 },
            { finalSpot: 1, challengerId: 0, acceptorId: 3 },
        ] as Match[];
        const players = {
            1: { elo: { elo: 420 } },
            2: { elo: { elo: 400 } },
            3: { elo: { elo: 415 } },
        };
        const expectedResult = [
            { finalSpot: 3, challengerId: 1, acceptorId: 2, winner: 1, sets: 3 },
            { finalSpot: 2, challengerId: 99999, acceptorId: 3 },
            { finalSpot: 1, challengerId: 1, acceptorId: 3, winner: 1, sets: 3 },
        ];

        expect(generateBotPrediction(matches, players)).toEqual(expectedResult);
    });
});
