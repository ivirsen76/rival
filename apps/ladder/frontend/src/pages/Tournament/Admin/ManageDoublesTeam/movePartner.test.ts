import movePartner from './movePartner';

describe('movePartner()', () => {
    const tournament = {
        players: {
            1: {
                id: 1,
                isDoublesTeamCaptain: true,
                isDoublesTeamPartner: false,
                isDoublesTeamPlayerPool: false,
                partnerId: null,
                partnerIds: [1, 2],
                teamName: 'Challengers',
            },
            2: {
                id: 2,
                isDoublesTeamCaptain: false,
                isDoublesTeamPartner: true,
                isDoublesTeamPlayerPool: false,
                partnerId: 1,
                partnerIds: [1, 2],
            },
            3: {
                id: 3,
                isDoublesTeamCaptain: true,
                isDoublesTeamPartner: false,
                isDoublesTeamPlayerPool: false,
                partnerId: null,
                partnerIds: [3, 4],
                teamName: 'Fighters',
            },
            4: {
                id: 4,
                isDoublesTeamCaptain: false,
                isDoublesTeamPartner: true,
                isDoublesTeamPlayerPool: false,
                partnerId: 3,
                partnerIds: [3, 4],
            },
            5: {
                id: 5,
                isDoublesTeamCaptain: false,
                isDoublesTeamPartner: false,
                isDoublesTeamPlayerPool: true,
                partnerId: 999999,
            },
        },
    };

    it('Should move partner to another team', () => {
        const resultedTournament = movePartner({ tournament, playerId: 4, captainId: 1, replaceCaptain: false });

        // team 1
        expect(resultedTournament.players[1].partnerIds).toEqual([1, 2, 4]);
        expect(resultedTournament.players[2].partnerIds).toEqual([1, 2, 4]);
        expect(resultedTournament.players[4].partnerIds).toEqual([1, 2, 4]);

        // team 2
        expect(resultedTournament.players[3].partnerIds).toEqual([3]);
    });

    it('Should move partner to another team as a captain', () => {
        const resultedTournament = movePartner({ tournament, playerId: 4, captainId: 1, replaceCaptain: true });

        // team 1
        expect(resultedTournament.players[1].partnerIds).toEqual([4, 1, 2]);
        expect(resultedTournament.players[1].isDoublesTeamCaptain).toBe(false);
        expect(resultedTournament.players[1].isDoublesTeamPartner).toBe(true);
        expect(resultedTournament.players[1].teamName).toBe(null);
        expect(resultedTournament.players[2].partnerIds).toEqual([4, 1, 2]);
        expect(resultedTournament.players[4].partnerIds).toEqual([4, 1, 2]);
        expect(resultedTournament.players[4].isDoublesTeamCaptain).toBe(true);
        expect(resultedTournament.players[4].isDoublesTeamPartner).toBe(false);
        expect(resultedTournament.players[4].teamName).toBe('Challengers');

        // team 2
        expect(resultedTournament.players[3].partnerIds).toEqual([3]);
    });

    it('Should move captain to another team as partner', () => {
        const resultedTournament = movePartner({ tournament, playerId: 1, captainId: 3, replaceCaptain: false });

        // team 1
        expect(resultedTournament.players[2].partnerIds).toEqual([2]);
        expect(resultedTournament.players[2].isDoublesTeamCaptain).toBe(true);
        expect(resultedTournament.players[2].isDoublesTeamPartner).toBe(false);
        expect(resultedTournament.players[2].teamName).toBe('Challengers');

        // team 2
        expect(resultedTournament.players[3].partnerIds).toEqual([3, 1, 4]);
        expect(resultedTournament.players[4].partnerIds).toEqual([3, 1, 4]);
        expect(resultedTournament.players[1].partnerIds).toEqual([3, 1, 4]);
        expect(resultedTournament.players[1].isDoublesTeamCaptain).toBe(false);
        expect(resultedTournament.players[1].isDoublesTeamPartner).toBe(true);
        expect(resultedTournament.players[1].teamName).toBe(null);
    });

    it('Should move captain to another team as captain', () => {
        const resultedTournament = movePartner({ tournament, playerId: 1, captainId: 3, replaceCaptain: true });

        // team 1
        expect(resultedTournament.players[2].partnerIds).toEqual([2]);
        expect(resultedTournament.players[2].isDoublesTeamCaptain).toBe(true);
        expect(resultedTournament.players[2].isDoublesTeamPartner).toBe(false);
        expect(resultedTournament.players[2].teamName).toBe('Challengers');

        // team 2
        expect(resultedTournament.players[1].partnerIds).toEqual([1, 3, 4]);
        expect(resultedTournament.players[1].isDoublesTeamCaptain).toBe(true);
        expect(resultedTournament.players[1].isDoublesTeamPartner).toBe(false);
        expect(resultedTournament.players[1].teamName).toBe('Fighters');
        expect(resultedTournament.players[3].partnerIds).toEqual([1, 3, 4]);
        expect(resultedTournament.players[3].isDoublesTeamCaptain).toBe(false);
        expect(resultedTournament.players[3].isDoublesTeamPartner).toBe(true);
        expect(resultedTournament.players[3].teamName).toBe(null);
        expect(resultedTournament.players[4].partnerIds).toEqual([1, 3, 4]);
    });

    it('Should move partner to captain position in the same team', () => {
        const resultedTournament = movePartner({ tournament, playerId: 2, captainId: 1, replaceCaptain: true });

        // team 1
        expect(resultedTournament.players[1].partnerIds).toEqual([2, 1]);
        expect(resultedTournament.players[1].isDoublesTeamCaptain).toBe(false);
        expect(resultedTournament.players[1].isDoublesTeamPartner).toBe(true);
        expect(resultedTournament.players[1].teamName).toBe(null);
        expect(resultedTournament.players[2].partnerIds).toEqual([2, 1]);
        expect(resultedTournament.players[2].isDoublesTeamCaptain).toBe(true);
        expect(resultedTournament.players[2].isDoublesTeamPartner).toBe(false);
        expect(resultedTournament.players[2].teamName).toBe('Challengers');
    });

    it('Should move captain to partner position in the same team', () => {
        const resultedTournament = movePartner({ tournament, playerId: 1, captainId: 1, replaceCaptain: false });

        // team 1
        expect(resultedTournament.players[1].partnerIds).toEqual([2, 1]);
        expect(resultedTournament.players[1].isDoublesTeamCaptain).toBe(false);
        expect(resultedTournament.players[1].isDoublesTeamPartner).toBe(true);
        expect(resultedTournament.players[1].teamName).toBe(null);
        expect(resultedTournament.players[2].partnerIds).toEqual([2, 1]);
        expect(resultedTournament.players[2].isDoublesTeamCaptain).toBe(true);
        expect(resultedTournament.players[2].isDoublesTeamPartner).toBe(false);
        expect(resultedTournament.players[2].teamName).toBe('Challengers');
    });

    it('Should move partner to the player pool', () => {
        const resultedTournament = movePartner({ tournament, playerId: 2, captainId: 999999, replaceCaptain: false });

        // team 1
        expect(resultedTournament.players[1].partnerIds).toEqual([1]);
        expect(resultedTournament.players[1].partnerId).toBe(null);

        // player pool
        expect(resultedTournament.players[2].partnerId).toBe(999999);
        expect(resultedTournament.players[2].partnerIds).toBeFalsy();
        expect(resultedTournament.players[2].isDoublesTeamCaptain).toBe(false);
        expect(resultedTournament.players[2].isDoublesTeamPartner).toBe(false);
        expect(resultedTournament.players[2].isDoublesTeamPlayerPool).toBe(true);
    });

    it('Should move captain to the player pool', () => {
        const resultedTournament = movePartner({ tournament, playerId: 1, captainId: 999999, replaceCaptain: false });

        // team 1
        expect(resultedTournament.players[2].partnerIds).toEqual([2]);
        expect(resultedTournament.players[2].isDoublesTeamCaptain).toBe(true);
        expect(resultedTournament.players[2].isDoublesTeamPartner).toBe(false);
        expect(resultedTournament.players[2].isDoublesTeamPlayerPool).toBe(false);
        expect(resultedTournament.players[2].teamName).toBe('Challengers');

        // player pool
        expect(resultedTournament.players[1].partnerId).toBe(999999);
        expect(resultedTournament.players[1].partnerIds).toBeFalsy();
        expect(resultedTournament.players[1].isDoublesTeamCaptain).toBe(false);
        expect(resultedTournament.players[1].isDoublesTeamPartner).toBe(false);
        expect(resultedTournament.players[1].isDoublesTeamPlayerPool).toBe(true);
    });

    it('Should move player from the pool to the partner position', () => {
        const resultedTournament = movePartner({ tournament, playerId: 5, captainId: 1, replaceCaptain: false });

        // team 1
        expect(resultedTournament.players[1].partnerIds).toEqual([1, 2, 5]);
        expect(resultedTournament.players[2].partnerIds).toEqual([1, 2, 5]);
        expect(resultedTournament.players[5].partnerIds).toEqual([1, 2, 5]);
        expect(resultedTournament.players[5].partnerId).toBe(1);
        expect(resultedTournament.players[5].isDoublesTeamCaptain).toBe(false);
        expect(resultedTournament.players[5].isDoublesTeamPartner).toBe(true);
        expect(resultedTournament.players[5].isDoublesTeamPlayerPool).toBe(false);
    });

    it('Should move player from the pool to the captain position', () => {
        const resultedTournament = movePartner({ tournament, playerId: 5, captainId: 1, replaceCaptain: true });

        // team 1
        expect(resultedTournament.players[1].partnerIds).toEqual([5, 1, 2]);
        expect(resultedTournament.players[1].partnerId).toBe(5);
        expect(resultedTournament.players[1].isDoublesTeamCaptain).toBe(false);
        expect(resultedTournament.players[1].isDoublesTeamPartner).toBe(true);
        expect(resultedTournament.players[1].isDoublesTeamPlayerPool).toBe(false);
        expect(resultedTournament.players[2].partnerIds).toEqual([5, 1, 2]);
        expect(resultedTournament.players[5].partnerIds).toEqual([5, 1, 2]);
        expect(resultedTournament.players[5].partnerId).toBe(null);
        expect(resultedTournament.players[5].isDoublesTeamCaptain).toBe(true);
        expect(resultedTournament.players[5].isDoublesTeamPartner).toBe(false);
        expect(resultedTournament.players[5].isDoublesTeamPlayerPool).toBe(false);
    });
});
