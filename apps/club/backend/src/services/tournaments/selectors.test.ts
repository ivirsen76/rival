import { getPlayerPoints, getSeeds, shuffleRange } from './selectors';

describe('shuffleRange()', () => {
    it('Should shuffle the range in array', () => {
        const result = shuffleRange([1, 2, 3, 4, 5, 6], [[1, 4]]);

        expect(result.length).toBe(6);
        expect(result[0]).toBe(1);
        expect(result[5]).toBe(6);
        expect(result.reduce((sum, num) => sum + num, 0)).toBe(21);
    });
});

describe('getSeeds()', () => {
    const one = 1;
    const two = 2;
    const three = 3;
    const four = 4;
    const five = 5;
    const six = 6;
    const seven = 7;
    const eight = 8;
    const nine = 9;
    const ten = 10;
    const eleven = 11;
    const twelve = 12;
    const thirteen = 13;
    const fourteen = 14;
    const fifteen = 15;
    const sixteen = 16;

    it('Should return nothing for nothing or one player', () => {
        expect(getSeeds([])).toEqual([]);
        expect(getSeeds([{}])).toEqual([]);
    });

    it('Should return matches for 2 players', () => {
        expect(getSeeds([one, two])).toEqual([{ finalSpot: 1, challenger: one, acceptor: two }]);
    });

    it('Should return matches for 3 players', () => {
        expect(getSeeds([one, two, three])).toEqual([
            { finalSpot: 1, challenger: one },
            { finalSpot: 2, challenger: three, acceptor: two },
        ]);
    });

    it('Should return matches for 4 players', () => {
        expect(getSeeds([one, two, three, four])).toEqual([
            { finalSpot: 3, challenger: one, acceptor: four },
            { finalSpot: 2, challenger: three, acceptor: two },
        ]);
    });

    it('Should return matches for 5 players', () => {
        expect(getSeeds([one, two, three, four, five])).toEqual([
            { finalSpot: 3, challenger: one },
            { finalSpot: 2, challenger: three, acceptor: two },
            { finalSpot: 6, challenger: five, acceptor: four },
        ]);
    });

    it('Should return matches for 6 players', () => {
        expect(getSeeds([one, two, three, four, five, six])).toEqual([
            { finalSpot: 3, challenger: one },
            { finalSpot: 2, acceptor: two },
            { finalSpot: 6, challenger: five, acceptor: four },
            { finalSpot: 5, challenger: three, acceptor: six },
        ]);
    });

    it('Should return matches for 7 players', () => {
        expect(getSeeds([one, two, three, four, five, six, seven])).toEqual([
            { finalSpot: 3, challenger: one },
            { finalSpot: 6, challenger: five, acceptor: four },
            { finalSpot: 5, challenger: three, acceptor: six },
            { finalSpot: 4, challenger: seven, acceptor: two },
        ]);
    });

    it('Should return matches for 8 players', () => {
        expect(getSeeds([one, two, three, four, five, six, seven, eight])).toEqual([
            { finalSpot: 7, challenger: one, acceptor: eight },
            { finalSpot: 6, challenger: five, acceptor: four },
            { finalSpot: 5, challenger: three, acceptor: six },
            { finalSpot: 4, challenger: seven, acceptor: two },
        ]);
    });

    it('Should return matches for 9 players', () => {
        expect(getSeeds([one, two, three, four, five, six, seven, eight, nine])).toEqual([
            { finalSpot: 7, challenger: one },
            { finalSpot: 6, challenger: five, acceptor: four },
            { finalSpot: 5, challenger: three, acceptor: six },
            { finalSpot: 4, challenger: seven, acceptor: two },
            { finalSpot: 14, challenger: nine, acceptor: eight },
        ]);
    });

    it('Should return matches for 10 players', () => {
        expect(getSeeds([one, two, three, four, five, six, seven, eight, nine, ten])).toEqual([
            { finalSpot: 7, challenger: one },
            { finalSpot: 4, acceptor: two },
            { finalSpot: 6, challenger: five, acceptor: four },
            { finalSpot: 5, challenger: three, acceptor: six },
            { finalSpot: 14, challenger: nine, acceptor: eight },
            { finalSpot: 9, challenger: seven, acceptor: ten },
        ]);
    });

    it('Should return matches for 11 players', () => {
        expect(getSeeds([one, two, three, four, five, six, seven, eight, nine, ten, eleven])).toEqual([
            { finalSpot: 7, challenger: one },
            { finalSpot: 5, challenger: three },
            { finalSpot: 4, acceptor: two },
            { finalSpot: 6, challenger: five, acceptor: four },
            { finalSpot: 14, challenger: nine, acceptor: eight },
            { finalSpot: 10, challenger: eleven, acceptor: six },
            { finalSpot: 9, challenger: seven, acceptor: ten },
        ]);
    });

    it('Should return matches for 12 players', () => {
        expect(getSeeds([one, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve])).toEqual([
            { finalSpot: 7, challenger: one },
            { finalSpot: 6, acceptor: four },
            { finalSpot: 5, challenger: three },
            { finalSpot: 4, acceptor: two },
            { finalSpot: 14, challenger: nine, acceptor: eight },
            { finalSpot: 13, challenger: five, acceptor: twelve },
            { finalSpot: 10, challenger: eleven, acceptor: six },
            { finalSpot: 9, challenger: seven, acceptor: ten },
        ]);
    });

    it('Should return matches for 13 players', () => {
        expect(getSeeds([one, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve, thirteen])).toEqual(
            [
                { finalSpot: 7, challenger: one },
                { finalSpot: 5, challenger: three },
                { finalSpot: 4, acceptor: two },
                { finalSpot: 14, challenger: nine, acceptor: eight },
                { finalSpot: 13, challenger: five, acceptor: twelve },
                { finalSpot: 12, challenger: thirteen, acceptor: four },
                { finalSpot: 10, challenger: eleven, acceptor: six },
                { finalSpot: 9, challenger: seven, acceptor: ten },
            ]
        );
    });

    it('Should return matches for 14 players', () => {
        expect(
            getSeeds([one, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve, thirteen, fourteen])
        ).toEqual([
            { finalSpot: 7, challenger: one },
            { finalSpot: 4, acceptor: two },
            { finalSpot: 14, challenger: nine, acceptor: eight },
            { finalSpot: 13, challenger: five, acceptor: twelve },
            { finalSpot: 12, challenger: thirteen, acceptor: four },
            { finalSpot: 11, challenger: three, acceptor: fourteen },
            { finalSpot: 10, challenger: eleven, acceptor: six },
            { finalSpot: 9, challenger: seven, acceptor: ten },
        ]);
    });

    it('Should return matches for 15 players', () => {
        expect(
            getSeeds([
                one,
                two,
                three,
                four,
                five,
                six,
                seven,
                eight,
                nine,
                ten,
                eleven,
                twelve,
                thirteen,
                fourteen,
                fifteen,
            ])
        ).toEqual([
            { finalSpot: 7, challenger: one },
            { finalSpot: 14, challenger: nine, acceptor: eight },
            { finalSpot: 13, challenger: five, acceptor: twelve },
            { finalSpot: 12, challenger: thirteen, acceptor: four },
            { finalSpot: 11, challenger: three, acceptor: fourteen },
            { finalSpot: 10, challenger: eleven, acceptor: six },
            { finalSpot: 9, challenger: seven, acceptor: ten },
            { finalSpot: 8, challenger: fifteen, acceptor: two },
        ]);
    });

    it('Should return matches for 16 players', () => {
        expect(
            getSeeds([
                one,
                two,
                three,
                four,
                five,
                six,
                seven,
                eight,
                nine,
                ten,
                eleven,
                twelve,
                thirteen,
                fourteen,
                fifteen,
                sixteen,
            ])
        ).toEqual([
            { finalSpot: 15, challenger: one, acceptor: sixteen },
            { finalSpot: 14, challenger: nine, acceptor: eight },
            { finalSpot: 13, challenger: five, acceptor: twelve },
            { finalSpot: 12, challenger: thirteen, acceptor: four },
            { finalSpot: 11, challenger: three, acceptor: fourteen },
            { finalSpot: 10, challenger: eleven, acceptor: six },
            { finalSpot: 9, challenger: seven, acceptor: ten },
            { finalSpot: 8, challenger: fifteen, acceptor: two },
        ]);
    });
});

describe('getPlayerPoints()', () => {
    it('Should calculate players points', () => {
        const data = {
            'season.startDate': '2021-03-29 00:00:00',
            'season.endDate': '2021-05-03 00:00:00',
            users: [
                { id: 11, players: { id: 1 } },
                { id: 22, players: { id: 2 } },
                { id: 33, players: { id: 3 } },
            ],
            matches: [
                {
                    id: 1,
                    challengerId: 2,
                    acceptorId: 1,
                    challengerPoints: 27,
                    acceptorPoints: 11,
                    winner: 2,
                    score: '6-4 6-4',
                    type: 'regular',
                    playedAt: '2021-04-30 10:22:47',
                },
                {
                    id: 1,
                    challengerId: 1,
                    acceptorId: 2,
                    challengerPoints: 16,
                    acceptorPoints: 14,
                    winner: 1,
                    score: '6-4 6-4',
                    type: 'regular',
                    playedAt: '2021-04-27 10:22:47',
                },
                {
                    id: 1,
                    challengerId: 1,
                    acceptorId: 2,
                    challengerPoints: 24,
                    acceptorPoints: 13,
                    winner: 1,
                    score: '6-4 6-4',
                    type: 'regular',
                    playedAt: '2021-04-24 10:22:47',
                },
                {
                    id: 1,
                    challengerId: 3,
                    acceptorId: 2,
                    challengerPoints: 25,
                    acceptorPoints: 12,
                    winner: 3,
                    score: '6-4 6-4',
                    type: 'regular',
                    playedAt: '2021-04-22 14:22:47',
                },
                {
                    id: 1,
                    challengerId: 1,
                    acceptorId: 2,
                    challengerPoints: 25,
                    acceptorPoints: 12,
                    winner: 1,
                    score: '6-4 6-4',
                    type: 'regular',
                    playedAt: '2021-04-22 10:22:47',
                },
            ],
        };
        const expectedResult = {
            1: {
                matches: 4,
                matchesWon: 3,
                matchesLost: 1,
                rank: 2,
                points: 76,
                matchesWonChange: 1,
                matchesLostChange: 1,
                rankChange: -1,
                pointsChange: 27,
                total: {
                    matches: 4,
                    proposals: 0,
                },
                live: {
                    matchesWon: 0,
                    matchesLost: 0,
                    points: 0,
                },
            },
            2: {
                matches: 5,
                matchesWon: 1,
                matchesLost: 4,
                rank: 1,
                points: 78,
                matchesWonChange: 1,
                matchesLostChange: 1,
                rankChange: 1,
                pointsChange: 41,
                total: {
                    matches: 5,
                    proposals: 0,
                },
                live: {
                    matchesWon: 0,
                    matchesLost: 0,
                    points: 0,
                },
            },
            3: {
                matches: 1,
                matchesWon: 1,
                matchesLost: 0,
                rank: 3,
                points: 25,
                matchesWonChange: 0,
                matchesLostChange: 0,
                rankChange: 0,
                pointsChange: 0,
                total: {
                    matches: 1,
                    proposals: 0,
                },
                live: {
                    matchesWon: 0,
                    matchesLost: 0,
                    points: 0,
                },
            },
        };
        expect(getPlayerPoints(data, '2021-05-20 00:00:00')).toEqual(expectedResult);
    });

    it('Should start rank from 1', () => {
        const data = {
            'season.startDate': '2021-03-29 00:00:00',
            'season.endDate': '2021-05-03 00:00:00',
            users: [
                { id: 11, players: { id: 1 } },
                { id: 22, players: { id: 2 } },
                { id: 33, players: { id: 3 } },
            ],
            matches: [
                {
                    id: 1,
                    challengerId: 1,
                    acceptorId: 2,
                    challengerPoints: 25,
                    acceptorPoints: 12,
                    winner: 1,
                    score: '6-4 6-4',
                    type: 'regular',
                    playedAt: '2021-04-02 10:22:47',
                },
            ],
        };
        const expectedResult = {
            1: {
                matches: 1,
                matchesWon: 1,
                matchesLost: 0,
                rank: 1,
                points: 25,
                matchesWonChange: 1,
                matchesLostChange: 0,
                rankChange: 0,
                pointsChange: 25,
                total: {
                    matches: 1,
                    proposals: 0,
                },
                live: {
                    rank: 1,
                    rankChange: 0,
                    points: 25,
                    pointsChange: 0,
                    matches: 1,
                    matchesWon: 1,
                    matchesWonChange: 0,
                    matchesLost: 0,
                    matchesLostChange: 0,
                },
            },
            2: {
                matches: 1,
                matchesWon: 0,
                matchesLost: 1,
                rank: 2,
                points: 12,
                matchesWonChange: 0,
                matchesLostChange: 1,
                rankChange: -1,
                pointsChange: 12,
                total: {
                    matches: 1,
                    proposals: 0,
                },
                live: {
                    rank: 2,
                    rankChange: 0,
                    points: 12,
                    pointsChange: 0,
                    matches: 1,
                    matchesWon: 0,
                    matchesWonChange: 0,
                    matchesLost: 1,
                    matchesLostChange: 0,
                },
            },
            3: {
                matches: 0,
                matchesWon: 0,
                matchesLost: 0,
                rank: 3,
                points: 0,
                matchesWonChange: 0,
                matchesLostChange: 0,
                rankChange: -2,
                pointsChange: 0,
                total: {
                    matches: 0,
                    proposals: 0,
                },
                live: {
                    rank: 3,
                    rankChange: 0,
                    points: 0,
                    pointsChange: 0,
                    matches: 0,
                    matchesWon: 0,
                    matchesWonChange: 0,
                    matchesLost: 0,
                    matchesLostChange: 0,
                },
            },
        };
        expect(getPlayerPoints(data, '2021-04-09 00:00:00')).toEqual(expectedResult);
    });

    describe('Edge dates', () => {
        const data = {
            'season.startDate': '2021-03-29 00:00:00',
            'season.endDate': '2021-05-03 00:00:00',
            users: [
                { id: 11, players: { id: 1 } },
                { id: 22, players: { id: 2 } },
            ],
            matches: [
                {
                    id: 2,
                    challengerId: 1,
                    acceptorId: 2,
                    challengerPoints: 25,
                    acceptorPoints: 12,
                    winner: 1,
                    score: '6-4 6-4',
                    type: 'regular',
                    playedAt: '2021-05-02 23:59:59',
                },
                {
                    id: 1,
                    challengerId: 1,
                    acceptorId: 2,
                    challengerPoints: 25,
                    acceptorPoints: 12,
                    winner: 1,
                    score: '6-4 6-4',
                    type: 'regular',
                    playedAt: '2021-04-02 10:00:00',
                },
            ],
        };

        it('Should get right result for first week', () => {
            const result = getPlayerPoints(data, '2021-04-04 23:59:59');
            expect(result[1].matchesWon).toBe(0);
            expect(result[1].rank).toBe(1);
            expect(result[2].matchesWon).toBe(0);
            expect(result[2].rank).toBe(1);
        });

        it('Should get right result for the second week', () => {
            const result = getPlayerPoints(data, '2021-04-05 00:00:00');
            expect(result[1].matchesWon).toBe(1);
            expect(result[1].rank).toBe(1);
            expect(result[2].matchesWon).toBe(0);
            expect(result[2].rank).toBe(2);
        });

        it('Should get right result for the last week', () => {
            const result = getPlayerPoints(data, '2021-05-02 23:59:59');
            expect(result[1].matchesWon).toBe(1);
        });

        it('Should get right result for the next week after season', () => {
            const result = getPlayerPoints(data, '2021-05-03 00:00:00');
            expect(result[1].matchesWon).toBe(2);
            expect(result[1].matchesWonChange).toBe(1);
        });

        it('Should get right result for the future', () => {
            const result = getPlayerPoints(data, '2021-12-12 00:00:00');
            expect(result[1].matchesWon).toBe(2);
            expect(result[1].matchesWonChange).toBe(1);
        });

        it('Should get extend week properly', () => {
            const result = getPlayerPoints(
                {
                    ...data,
                    'season.endDate': '2021-05-03 00:00:01',
                },
                '2021-12-12 00:00:00'
            );
            expect(result[1].matchesWon).toBe(2);
            expect(result[1].matchesWonChange).toBe(0);
        });
    });
});
