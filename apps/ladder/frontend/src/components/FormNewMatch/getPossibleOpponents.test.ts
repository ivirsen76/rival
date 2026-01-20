import getPossibleOpponents from './getPossibleOpponents';

describe('getPossibleOpponents()', () => {
    global.window = global.window || {};

    const possibleMatches = [
        { playedAt: '2022-03-14 12:00:00', challengerId: 3, acceptorId: 1 },
        { playedAt: '2022-03-15 12:00:00', challengerId: 2, acceptorId: 1 },
        { playedAt: '2022-03-15 13:00:00', challengerId: 1, acceptorId: 2 },
        { playedAt: '2022-03-16 12:00:00', challengerId: 1, acceptorId: 4 },
    ];
    const currentPlayerId = 1;

    it('Should return nothing', () => {
        const result = getPossibleOpponents(possibleMatches, currentPlayerId, '2022-03-13 12:00:00');
        expect(result).toEqual([]);
    });

    it('Should not return duplicated players', () => {
        const result = getPossibleOpponents(possibleMatches, currentPlayerId, '2022-03-18 12:00:00');
        expect(result).toEqual([
            { playedAt: '2022-03-16 12:00:00', challengerId: 1, acceptorId: 4 },
            { playedAt: '2022-03-15 13:00:00', challengerId: 1, acceptorId: 2 },
            { playedAt: '2022-03-14 12:00:00', challengerId: 3, acceptorId: 1 },
        ]);
    });

    it('Should return only one match', () => {
        const result = getPossibleOpponents(possibleMatches, currentPlayerId, '2022-03-14 10:00:00');
        expect(result).toEqual([{ playedAt: '2022-03-14 12:00:00', challengerId: 3, acceptorId: 1 }]);
    });

    it('Should return matches for the same day', () => {
        const result = getPossibleOpponents(possibleMatches, currentPlayerId, '2022-03-15 10:00:00');
        expect(result).toEqual([
            { playedAt: '2022-03-15 13:00:00', challengerId: 1, acceptorId: 2 },
            { playedAt: '2022-03-14 12:00:00', challengerId: 3, acceptorId: 1 },
        ]);
    });
});
