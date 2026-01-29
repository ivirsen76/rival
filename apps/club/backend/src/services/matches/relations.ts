export const relationsUp: Record<number, { finalSpot: number; player: 'challengerId' | 'acceptorId' }> = {
    15: { finalSpot: 7, player: 'challengerId' },
    14: { finalSpot: 7, player: 'acceptorId' },
    13: { finalSpot: 6, player: 'challengerId' },
    12: { finalSpot: 6, player: 'acceptorId' },
    11: { finalSpot: 5, player: 'challengerId' },
    10: { finalSpot: 5, player: 'acceptorId' },
    9: { finalSpot: 4, player: 'challengerId' },
    8: { finalSpot: 4, player: 'acceptorId' },
    7: { finalSpot: 3, player: 'challengerId' },
    6: { finalSpot: 3, player: 'acceptorId' },
    5: { finalSpot: 2, player: 'challengerId' },
    4: { finalSpot: 2, player: 'acceptorId' },
    3: { finalSpot: 1, player: 'challengerId' },
    2: { finalSpot: 1, player: 'acceptorId' },
};

export const relationsDown: Record<number, { challengerFinalSpot: number; acceptorFinalSpot: number }> = {
    7: {
        challengerFinalSpot: 15,
        acceptorFinalSpot: 14,
    },
    6: {
        challengerFinalSpot: 13,
        acceptorFinalSpot: 12,
    },
    5: {
        challengerFinalSpot: 11,
        acceptorFinalSpot: 10,
    },
    4: {
        challengerFinalSpot: 9,
        acceptorFinalSpot: 8,
    },
    3: {
        challengerFinalSpot: 7,
        acceptorFinalSpot: 6,
    },
    2: {
        challengerFinalSpot: 5,
        acceptorFinalSpot: 4,
    },
    1: {
        challengerFinalSpot: 3,
        acceptorFinalSpot: 2,
    },
};
