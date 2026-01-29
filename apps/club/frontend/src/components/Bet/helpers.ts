import _cloneDeep from 'lodash/cloneDeep';
import _pick from 'lodash/pick';
import { relationsUp } from '@rival/club.backend/src/services/matches/relations';
import { BYE_ID } from '@rival/club.backend/src/constants';

export const getInitialPrediction = (matches) => {
    const spots = matches.reduce((obj, match) => {
        obj[match.finalSpot] = match;
        return obj;
    }, {});

    let total = Math.max(...matches.map((item) => item.finalSpot));
    total = total > 7 ? 15 : total > 3 ? 7 : 3;

    return new Array(total)
        .fill(0)
        .map((_, index) => index + 1)
        .reduce((obj, finalSpot) => {
            {
                const match = spots[finalSpot];
                if (match) {
                    obj[finalSpot] = {
                        finalSpot,
                        challengerId: match.challengerId || 0,
                        acceptorId: match.acceptorId || 0,
                        winner: 0,
                        sets: 0,
                    };
                    return obj;
                }
            }

            {
                const relation = relationsUp[finalSpot];
                const match = spots[relation?.finalSpot];
                if (match) {
                    obj[finalSpot] = {
                        finalSpot,
                        challengerId: match.challengerId || BYE_ID,
                        acceptorId: match.acceptorId || BYE_ID,
                        winner: 0,
                        sets: 0,
                    };
                    return obj;
                }
            }

            obj[finalSpot] = {
                finalSpot,
                challengerId: 0,
                acceptorId: 0,
                winner: 0,
                sets: 0,
            };

            return obj;
        }, {});
};

export const setWinner = (prediction, finalSpot, winner, sets) => {
    const result = _cloneDeep(prediction);
    const prevWinner = result[finalSpot].winner;

    if (prevWinner && prevWinner !== winner) {
        for (let i = finalSpot - 1; i >= 1; i--) {
            const match = result[i];

            if (match.challengerId === prevWinner) {
                match.challengerId = winner;
            }
            if (match.acceptorId === prevWinner) {
                match.acceptorId = winner;
            }
            if (match.winner === prevWinner) {
                match.winner = winner;
            }
        }
    }

    if (!prevWinner) {
        const relation = relationsUp[finalSpot];
        if (relation) {
            result[relation.finalSpot][relation.player] = winner;
        }
    }

    result[finalSpot].winner = winner;
    result[finalSpot].sets = sets;

    return result;
};

export const preparePredictionToSave = (prediction) => {
    return Object.values(prediction)
        .map((item) => ({
            ..._pick(item, ['finalSpot', 'challengerId', 'acceptorId']),
            ...(item.winner ? { winner: item.winner } : {}),
            ...(item.sets ? { sets: item.sets } : {}),
        }))
        .sort((a, b) => a.finalSpot - b.finalSpot);
};
