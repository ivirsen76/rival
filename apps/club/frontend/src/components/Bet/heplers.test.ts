import { getInitialPrediction, setWinner, preparePredictionToSave } from './helpers';

describe('getInitialPrediction()', () => {
    it('Should return initial prediction for top 8', () => {
        const matches = [
            { finalSpot: 7, challengerId: 101, acceptorId: 102 },
            { finalSpot: 6, challengerId: 103, acceptorId: 104 },
            { finalSpot: 5, challengerId: 105, acceptorId: 106 },
            { finalSpot: 4, challengerId: 107, acceptorId: 108 },
        ];

        const expectedResult = {
            7: { finalSpot: 7, challengerId: 101, acceptorId: 102, winner: 0, sets: 0 },
            6: { finalSpot: 6, challengerId: 103, acceptorId: 104, winner: 0, sets: 0 },
            5: { finalSpot: 5, challengerId: 105, acceptorId: 106, winner: 0, sets: 0 },
            4: { finalSpot: 4, challengerId: 107, acceptorId: 108, winner: 0, sets: 0 },
            3: { finalSpot: 3, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
            2: { finalSpot: 2, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
            1: { finalSpot: 1, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
        };

        expect(getInitialPrediction(matches)).toEqual(expectedResult);
    });

    it('Should return initial prediction for top 12', () => {
        const matches = [
            { finalSpot: 14, challengerId: 101, acceptorId: 102 },
            { finalSpot: 13, challengerId: 103, acceptorId: 104 },
            { finalSpot: 10, challengerId: 105, acceptorId: 106 },
            { finalSpot: 9, challengerId: 107, acceptorId: 108 },
            { finalSpot: 7, challengerId: 109, acceptorId: null },
            { finalSpot: 6, challengerId: null, acceptorId: 110 },
            { finalSpot: 5, challengerId: 111, acceptorId: null },
            { finalSpot: 4, challengerId: null, acceptorId: 112 },
        ];

        const expectedResult = {
            15: { finalSpot: 15, challengerId: 109, acceptorId: 99999, winner: 0, sets: 0 },
            14: { finalSpot: 14, challengerId: 101, acceptorId: 102, winner: 0, sets: 0 },
            13: { finalSpot: 13, challengerId: 103, acceptorId: 104, winner: 0, sets: 0 },
            12: { finalSpot: 12, challengerId: 99999, acceptorId: 110, winner: 0, sets: 0 },
            11: { finalSpot: 11, challengerId: 111, acceptorId: 99999, winner: 0, sets: 0 },
            10: { finalSpot: 10, challengerId: 105, acceptorId: 106, winner: 0, sets: 0 },
            9: { finalSpot: 9, challengerId: 107, acceptorId: 108, winner: 0, sets: 0 },
            8: { finalSpot: 8, challengerId: 99999, acceptorId: 112, winner: 0, sets: 0 },
            7: { finalSpot: 7, challengerId: 109, acceptorId: 0, winner: 0, sets: 0 },
            6: { finalSpot: 6, challengerId: 0, acceptorId: 110, winner: 0, sets: 0 },
            5: { finalSpot: 5, challengerId: 111, acceptorId: 0, winner: 0, sets: 0 },
            4: { finalSpot: 4, challengerId: 0, acceptorId: 112, winner: 0, sets: 0 },
            3: { finalSpot: 3, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
            2: { finalSpot: 2, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
            1: { finalSpot: 1, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
        };

        expect(getInitialPrediction(matches)).toEqual(expectedResult);
    });

    it('Should return initial prediction for top 16', () => {
        const matches = [
            { finalSpot: 15, challengerId: 101, acceptorId: 102 },
            { finalSpot: 14, challengerId: 103, acceptorId: 104 },
            { finalSpot: 13, challengerId: 105, acceptorId: 106 },
            { finalSpot: 12, challengerId: 107, acceptorId: 108 },
            { finalSpot: 11, challengerId: 109, acceptorId: 110 },
            { finalSpot: 10, challengerId: 111, acceptorId: 112 },
            { finalSpot: 9, challengerId: 113, acceptorId: 114 },
            { finalSpot: 8, challengerId: 115, acceptorId: 116 },
        ];

        const expectedResult = {
            15: { finalSpot: 15, challengerId: 101, acceptorId: 102, winner: 0, sets: 0 },
            14: { finalSpot: 14, challengerId: 103, acceptorId: 104, winner: 0, sets: 0 },
            13: { finalSpot: 13, challengerId: 105, acceptorId: 106, winner: 0, sets: 0 },
            12: { finalSpot: 12, challengerId: 107, acceptorId: 108, winner: 0, sets: 0 },
            11: { finalSpot: 11, challengerId: 109, acceptorId: 110, winner: 0, sets: 0 },
            10: { finalSpot: 10, challengerId: 111, acceptorId: 112, winner: 0, sets: 0 },
            9: { finalSpot: 9, challengerId: 113, acceptorId: 114, winner: 0, sets: 0 },
            8: { finalSpot: 8, challengerId: 115, acceptorId: 116, winner: 0, sets: 0 },
            7: { finalSpot: 7, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
            6: { finalSpot: 6, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
            5: { finalSpot: 5, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
            4: { finalSpot: 4, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
            3: { finalSpot: 3, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
            2: { finalSpot: 2, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
            1: { finalSpot: 1, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
        };

        expect(getInitialPrediction(matches)).toEqual(expectedResult);
    });
});

describe('setWinner()', () => {
    it('Should set winner', () => {
        const prediction = {
            7: { finalSpot: 7, challengerId: 101, acceptorId: 102, winner: 0, sets: 0 },
            6: { finalSpot: 6, challengerId: 103, acceptorId: 104, winner: 0, sets: 0 },
            5: { finalSpot: 5, challengerId: 105, acceptorId: 106, winner: 0, sets: 0 },
            4: { finalSpot: 4, challengerId: 107, acceptorId: 108, winner: 0, sets: 0 },
            3: { finalSpot: 3, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
            2: { finalSpot: 2, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
            1: { finalSpot: 1, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
        };

        const expectedResult = {
            7: { finalSpot: 7, challengerId: 101, acceptorId: 102, winner: 101, sets: 2 },
            6: { finalSpot: 6, challengerId: 103, acceptorId: 104, winner: 0, sets: 0 },
            5: { finalSpot: 5, challengerId: 105, acceptorId: 106, winner: 0, sets: 0 },
            4: { finalSpot: 4, challengerId: 107, acceptorId: 108, winner: 0, sets: 0 },
            3: { finalSpot: 3, challengerId: 101, acceptorId: 0, winner: 0, sets: 0 },
            2: { finalSpot: 2, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
            1: { finalSpot: 1, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
        };
        expect(setWinner(prediction, 7, 101, 2)).toEqual(expectedResult);
    });

    it('Should set winner and affect later matches', () => {
        const prediction = {
            7: { finalSpot: 7, challengerId: 101, acceptorId: 102, winner: 101, sets: 2 },
            6: { finalSpot: 6, challengerId: 103, acceptorId: 104, winner: 103, sets: 3 },
            5: { finalSpot: 5, challengerId: 105, acceptorId: 106, winner: 0, sets: 0 },
            4: { finalSpot: 4, challengerId: 107, acceptorId: 108, winner: 0, sets: 0 },
            3: { finalSpot: 3, challengerId: 101, acceptorId: 103, winner: 0, sets: 0 },
            2: { finalSpot: 2, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
            1: { finalSpot: 1, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
        };

        const expectedResult = {
            7: { finalSpot: 7, challengerId: 101, acceptorId: 102, winner: 102, sets: 3 },
            6: { finalSpot: 6, challengerId: 103, acceptorId: 104, winner: 103, sets: 3 },
            5: { finalSpot: 5, challengerId: 105, acceptorId: 106, winner: 0, sets: 0 },
            4: { finalSpot: 4, challengerId: 107, acceptorId: 108, winner: 0, sets: 0 },
            3: { finalSpot: 3, challengerId: 102, acceptorId: 103, winner: 0, sets: 0 },
            2: { finalSpot: 2, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
            1: { finalSpot: 1, challengerId: 0, acceptorId: 0, winner: 0, sets: 0 },
        };
        expect(setWinner(prediction, 7, 102, 3)).toEqual(expectedResult);
    });
});

describe('preparePredictionToSave()', () => {
    it('Should prepare predictions', () => {
        const prediction = {
            1: {
                finalSpot: 1,
                challengerId: 14254,
                acceptorId: 14273,
                winner: 14254,
                sets: 2,
                challengerRank: 1,
                acceptorRank: 3,
            },
            2: {
                finalSpot: 2,
                challengerId: 14273,
                acceptorId: 14171,
                winner: 14171,
                sets: 3,
                challengerRank: 3,
                acceptorRank: 8,
            },
            3: {
                finalSpot: 3,
                challengerId: 99999,
                acceptorId: 14171,
                winner: null,
                sets: null,
                challengerRank: 3,
                acceptorRank: 8,
            },
        };
        const expectedResult = [
            { finalSpot: 1, challengerId: 14254, acceptorId: 14273, winner: 14254, sets: 2 },
            { finalSpot: 2, challengerId: 14273, acceptorId: 14171, winner: 14171, sets: 3 },
            { finalSpot: 3, challengerId: 99999, acceptorId: 14171 },
        ];

        expect(preparePredictionToSave(prediction)).toEqual(expectedResult);
    });
});
