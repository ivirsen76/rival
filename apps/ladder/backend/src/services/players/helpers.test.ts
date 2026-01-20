import { teamNames, formatTeamName, getPlayersUpdates, splitAddress } from './helpers';

describe('formatTeamName()', () => {
    it('Should return right values', () => {
        expect(formatTeamName('SOME-MORE THEN')).toBe('Some-More Then');
        expect(formatTeamName(' servebots ')).toBe('Servebots');
        expect(formatTeamName('play  worms')).toBe('Play Worms');
        expect(formatTeamName('play OF worms')).toBe('Play of Worms');
        expect(formatTeamName('THE boys')).toBe('The Boys');
        expect(formatTeamName('Not THE players')).toBe('Not the Players');
    });
});

describe('teamNames', () => {
    for (const teamName of teamNames) {
        it(`"${teamName}" should fit to the length limits`, () => {
            expect(teamName.length).toBeGreaterThanOrEqual(5);
            expect(teamName.length).toBeLessThanOrEqual(16);
        });
    }
});

describe('getPlayersUpdates()', () => {
    const players = [
        { id: 1, partnerId: null, teamName: 'Challengers' },
        { id: 2, partnerId: 1, teamName: null },
        { id: 3, partnerId: 1, teamName: null },
        { id: 4, partnerId: null, teamName: 'Fighters' },
        { id: 5, partnerId: 4, teamName: null },
        { id: 6, partnerId: 999999, teamName: null },
    ];

    it('Should move partner to another team', () => {
        const result = getPlayersUpdates({ players, playerId: 3, captainId: 4, replaceCaptain: false });
        const expectedResult = [{ id: 3, partnerId: 4, teamName: null }];

        expect(result).toEqual(expectedResult);
    });

    it('Should move partner to another team as a captain', () => {
        const result = getPlayersUpdates({ players, playerId: 3, captainId: 4, replaceCaptain: true });
        const expectedResult = [
            { id: 3, partnerId: null, teamName: 'Fighters' },
            { id: 4, partnerId: 3, teamName: null },
            { id: 5, partnerId: 3, teamName: null },
        ];

        expect(result).toEqual(expectedResult);
    });

    it('Should move captain to another team as partner', () => {
        const result = getPlayersUpdates({ players, playerId: 1, captainId: 4, replaceCaptain: false });
        const expectedResult = [
            { id: 1, partnerId: 4, teamName: null },
            { id: 2, partnerId: null, teamName: 'Challengers' },
            { id: 3, partnerId: 2, teamName: null },
        ];

        expect(result).toEqual(expectedResult);
    });

    it('Should move captain to another team as captain', () => {
        const result = getPlayersUpdates({ players, playerId: 1, captainId: 4, replaceCaptain: true });
        const expectedResult = [
            { id: 1, partnerId: null, teamName: 'Fighters' },
            { id: 2, partnerId: null, teamName: 'Challengers' },
            { id: 3, partnerId: 2, teamName: null },
            { id: 4, partnerId: 1, teamName: null },
            { id: 5, partnerId: 1, teamName: null },
        ];

        expect(result).toEqual(expectedResult);
    });

    it('Should move partner to captain position in the same team', () => {
        const result = getPlayersUpdates({ players, playerId: 2, captainId: 1, replaceCaptain: true });
        const expectedResult = [
            { id: 1, partnerId: 2, teamName: null },
            { id: 2, partnerId: null, teamName: 'Challengers' },
            { id: 3, partnerId: 2, teamName: null },
        ];

        expect(result).toEqual(expectedResult);
    });

    it('Should move captain to partner position in the same team', () => {
        const result = getPlayersUpdates({ players, playerId: 1, captainId: 1, replaceCaptain: false });
        const expectedResult = [
            { id: 1, partnerId: 2, teamName: null },
            { id: 2, partnerId: null, teamName: 'Challengers' },
            { id: 3, partnerId: 2, teamName: null },
        ];

        expect(result).toEqual(expectedResult);
    });

    it('Should move partner to the player pool', () => {
        const result = getPlayersUpdates({ players, playerId: 2, captainId: 999999, replaceCaptain: false });
        const expectedResult = [{ id: 2, partnerId: 999999, teamName: null }];

        expect(result).toEqual(expectedResult);
    });

    it('Should move partner to the player pool and ignore replaceCaptain=true', () => {
        const result = getPlayersUpdates({ players, playerId: 2, captainId: 999999, replaceCaptain: true });
        const expectedResult = [{ id: 2, partnerId: 999999, teamName: null }];

        expect(result).toEqual(expectedResult);
    });

    it('Should move captain to the player pool', () => {
        const result = getPlayersUpdates({ players, playerId: 1, captainId: 999999, replaceCaptain: false });
        const expectedResult = [
            { id: 1, partnerId: 999999, teamName: null },
            { id: 2, partnerId: null, teamName: 'Challengers' },
            { id: 3, partnerId: 2, teamName: null },
        ];

        expect(result).toEqual(expectedResult);
    });

    it('Should move player from the pool to the partner position', () => {
        const result = getPlayersUpdates({ players, playerId: 6, captainId: 4, replaceCaptain: false });
        const expectedResult = [{ id: 6, partnerId: 4, teamName: null }];

        expect(result).toEqual(expectedResult);
    });

    it('Should move player from the pool to the captain position', () => {
        const result = getPlayersUpdates({ players, playerId: 6, captainId: 4, replaceCaptain: true });
        const expectedResult = [
            { id: 4, partnerId: 6, teamName: null },
            { id: 5, partnerId: 6, teamName: null },
            { id: 6, partnerId: null, teamName: 'Fighters' },
        ];

        expect(result).toEqual(expectedResult);
    });

    it('Should not affect players', () => {
        const result = getPlayersUpdates({ players, playerId: 1, captainId: 1, replaceCaptain: true });
        const expectedResult = [];

        expect(result).toEqual(expectedResult);
    });
});

describe('splitAddress()', () => {
    test('splits Unit correctly', () => {
        const input = '326 Nelson St SW Unit 301';
        const { line1, line2 } = splitAddress(input);
        expect(line1).toBe('326 Nelson St SW');
        expect(line2).toBe('Unit 301');
    });

    test('splits Apt correctly', () => {
        const input = '123 Main St Apt 5B';
        const { line1, line2 } = splitAddress(input);
        expect(line1).toBe('123 Main St');
        expect(line2).toBe('Apt 5B');
    });

    test('splits Suite correctly', () => {
        const input = '456 Oak Rd Ste 12';
        const { line1, line2 } = splitAddress(input);
        expect(line1).toBe('456 Oak Rd');
        expect(line2).toBe('Ste 12');
    });

    test('splits Floor with abbreviation', () => {
        const input = '789 Pine Ave Fl 3';
        const { line1, line2 } = splitAddress(input);
        expect(line1).toBe('789 Pine Ave');
        expect(line2).toBe('Fl 3');
    });

    test('no unit returns line2 empty', () => {
        const input = '555 Broadway Blvd';
        const { line1, line2 } = splitAddress(input);
        expect(line1).toBe('555 Broadway Blvd');
        expect(line2).toBe('');
    });

    test('handles # symbol before unit number', () => {
        const input = '100 Elm St Apt #4';
        const { line1, line2 } = splitAddress(input);
        expect(line1).toBe('100 Elm St');
        expect(line2).toBe('Apt 4');
    });

    test('case insensitive matching', () => {
        const input = '222 Maple Dr suite 7A';
        const { line1, line2 } = splitAddress(input);
        expect(line1).toBe('222 Maple Dr');
        expect(line2).toBe('Suite 7A');
    });

    test('handles unit designator in the middle of address', () => {
        const input = '12 Unit 3A Nelson St';
        const { line1, line2 } = splitAddress(input);
        expect(line1).toBe('12 Unit 3A Nelson St');
        expect(line2).toBe('');
    });
});
