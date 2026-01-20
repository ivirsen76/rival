import getStat from './getStat';
import pointsExample from './pointsExample.json';

describe('getStat()', () => {
    it('Should return right result', () => {
        const expectedResult = {
            timeTotal: 111,
            challenger: {
                aces: 0,
                backhandForced: 9,
                backhandUnforced: 12,
                backhandWinners: 6,
                breakpointsTotal: 10,
                breakpointsWon: 6,
                firstServeIn: 62,
                firstServeWon: 37,
                forehandForced: 11,
                forehandUnforced: 22,
                forehandWinners: 10,
                normal: 0,
                secondServeWon: 8,
                serveTotal: 79,
                serveUnforced: 2,
                serveWinners: 0,
            },
            acceptor: {
                aces: 0,
                backhandForced: 15,
                backhandUnforced: 8,
                backhandWinners: 0,
                breakpointsTotal: 12,
                breakpointsWon: 3,
                firstServeIn: 36,
                firstServeWon: 19,
                forehandForced: 19,
                forehandUnforced: 17,
                forehandWinners: 6,
                normal: 0,
                secondServeWon: 9,
                serveTotal: 61,
                serveUnforced: 3,
                serveWinners: 0,
            },
        };

        expect(getStat(pointsExample)).toEqual(expectedResult);
    });

    it('Should return right reversed result', () => {
        const expectedResult = {
            timeTotal: 111,
            challenger: {
                aces: 0,
                backhandForced: 15,
                backhandUnforced: 8,
                backhandWinners: 0,
                breakpointsTotal: 12,
                breakpointsWon: 3,
                firstServeIn: 36,
                firstServeWon: 19,
                forehandForced: 19,
                forehandUnforced: 17,
                forehandWinners: 6,
                normal: 0,
                secondServeWon: 9,
                serveTotal: 61,
                serveUnforced: 3,
                serveWinners: 0,
            },
            acceptor: {
                aces: 0,
                backhandForced: 9,
                backhandUnforced: 12,
                backhandWinners: 6,
                breakpointsTotal: 10,
                breakpointsWon: 6,
                firstServeIn: 62,
                firstServeWon: 37,
                forehandForced: 11,
                forehandUnforced: 22,
                forehandWinners: 10,
                normal: 0,
                secondServeWon: 8,
                serveTotal: 79,
                serveUnforced: 2,
                serveWinners: 0,
            },
        };

        expect(getStat(pointsExample, true)).toEqual(expectedResult);
    });
});
