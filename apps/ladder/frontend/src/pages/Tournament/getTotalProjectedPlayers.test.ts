import getTotalProjectedPlayers from './getTotalProjectedPlayers';

describe('getTotalProjectedPlayers()', () => {
    const tournament = {
        isStarted: false,
        isOver: false,
        prevTournament: null,
        levelBaseTlr: 350,
        players: {},
    };

    it('Should return 0 because the tournament is started', () => {
        expect(getTotalProjectedPlayers({ ...tournament, isStarted: true })).toBe(0);
    });

    it('Should return 0 because the tournament is over', () => {
        expect(getTotalProjectedPlayers({ ...tournament, isOver: true })).toBe(0);
    });

    it('Should return 0 because this is not the first tournament', () => {
        expect(getTotalProjectedPlayers({ ...tournament, prevTournament: {} })).toBe(0);
    });

    it('Should return 0 if levelBaseTlr is not provided', () => {
        expect(getTotalProjectedPlayers({ ...tournament, levelBaseTlr: null })).toBe(0);
    });

    it('Should return 0 if levelBaseTlr is too low', () => {
        expect(getTotalProjectedPlayers({ ...tournament, levelBaseTlr: 200 })).toBe(0);
    });

    it('Should return 23 for levelBaseTlr=250', () => {
        expect(getTotalProjectedPlayers({ ...tournament, levelBaseTlr: 250 })).toBe(23);
    });

    it('Should return 41 for levelBaseTlr=300', () => {
        expect(getTotalProjectedPlayers({ ...tournament, levelBaseTlr: 300 })).toBe(41);
    });

    it('Should return 50 for levelBaseTlr=350', () => {
        expect(getTotalProjectedPlayers({ ...tournament, levelBaseTlr: 350 })).toBe(50);
    });

    it('Should return 41 for levelBaseTlr=400', () => {
        expect(getTotalProjectedPlayers({ ...tournament, levelBaseTlr: 400 })).toBe(41);
    });

    it('Should return 23 for levelBaseTlr=450', () => {
        expect(getTotalProjectedPlayers({ ...tournament, levelBaseTlr: 450 })).toBe(23);
    });

    it('Should return 0 if levelBaseTlr is too high', () => {
        expect(getTotalProjectedPlayers({ ...tournament, levelBaseTlr: 500 })).toBe(0);
    });

    it('Should return 0 if already many players', () => {
        expect(
            getTotalProjectedPlayers({
                ...tournament,
                players: new Array(50).fill(0).reduce((obj, _, index) => {
                    obj[`player${index}`] = {};
                    return obj;
                }, {}),
            })
        ).toBe(0);
    });
});
