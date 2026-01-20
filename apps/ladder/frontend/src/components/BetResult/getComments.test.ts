import getComments from './getComments';

describe('getComments()', () => {
    const matches = {
        3: {
            finalSpot: 3,
            challengerId: 1,
            acceptorId: 2,
            score: '6-3 6-3',
            winner: 1,
        },
        2: {
            finalSpot: 2,
            challengerId: 3,
            acceptorId: 4,
            score: '6-0 6-0',
            winner: 3,
            wonByDefault: 1,
        },
    };
    const players = {
        1: { firstName: 'Sam', lastName: 'First' },
        2: { firstName: 'Ben', lastName: 'Second' },
        3: { firstName: 'Andy', lastName: 'Third' },
        4: { firstName: 'Scott', lastName: 'Fourth' },
        22: { firstName: 'Pit', lastName: 'Twenty' },
        44: { firstName: 'Bob', lastName: 'Forty' },
    };

    it('Should return comments', () => {
        const prediction = [
            { finalSpot: 1, challengerId: 1, acceptorId: 4, winner: 4, sets: 3 },
            { finalSpot: 2, challengerId: 3, acceptorId: 4, winner: 4, sets: 3 },
            { finalSpot: 3, challengerId: 1, acceptorId: 2, winner: 1, sets: 3 },
        ];
        const expectedResult = {
            3: 'Sam First beat Ben Second<div class="mt-1 fw-bold">6-3 6-3</div>',
            2: 'Scott Fourth lost to Andy Third by default.',
            1: 'Scott Fourth lost in the Semifinal.',
        };
        expect(getComments(matches, prediction, players)).toEqual(expectedResult);
    });

    it('Should return comments with substitution', () => {
        const prediction = [
            { finalSpot: 1, challengerId: 1, acceptorId: 44, winner: 44, sets: 3 },
            { finalSpot: 2, challengerId: 3, acceptorId: 44, winner: 44, sets: 3 },
            { finalSpot: 3, challengerId: 1, acceptorId: 22, winner: 1, sets: 3 },
        ];
        const expectedResult = {
            3: 'Sam First beat Ben Second<div class="mt-1 fw-bold">6-3 6-3</div>',
            2: 'Bob Forty was replaced by Scott Fourth.',
            1: 'Bob Forty was replaced by Scott Fourth.',
        };
        expect(getComments(matches, prediction, players)).toEqual(expectedResult);
    });
});
