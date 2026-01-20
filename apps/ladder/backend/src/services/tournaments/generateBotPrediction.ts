import { relationsUp } from '../matches/relations';
import { BYE_ID } from '../../constants';

export default (matches, players) => {
    let total = Math.max(...matches.map(item => item.finalSpot));
    total = total > 7 ? 15 : total > 3 ? 7 : 3;

    const matchesObj = matches.reduce((obj, item) => {
        obj[item.finalSpot] = item;
        return obj;
    }, {});

    const result = new Array(total)
        .fill(0)
        .map((_, index) => index + 1)
        .reduce((obj, finalSpot) => {
            const match = matchesObj[finalSpot];
            if (match) {
                obj[finalSpot] = {
                    finalSpot,
                    challengerId: match.challengerId,
                    acceptorId: match.acceptorId,
                };
            } else {
                const relation = relationsUp[finalSpot];
                const relatedMatch = matchesObj[relation?.finalSpot];
                if (relatedMatch) {
                    obj[finalSpot] = {
                        finalSpot,
                        challengerId: relatedMatch.challengerId || BYE_ID,
                        acceptorId: relatedMatch.acceptorId || BYE_ID,
                    };
                }
            }

            return obj;
        }, {});

    const generateMatchPrediction = finalSpot => {
        const prediction = result[finalSpot];

        if (!prediction) {
            return;
        }
        if (prediction?.winner) {
            return;
        }
        if (!prediction.challengerId || !prediction.acceptorId) {
            return;
        }
        if (prediction.challengerId === BYE_ID || prediction.acceptorId === BYE_ID) {
            return;
        }

        const challenger = players[prediction.challengerId];
        const acceptor = players[prediction.acceptorId];
        const eloDiff = challenger.elo.elo - acceptor.elo.elo;

        prediction.winner = eloDiff >= 0 ? prediction.challengerId : prediction.acceptorId;
        prediction.sets = Math.abs(eloDiff) <= 25 ? 3 : 2;

        const relation = relationsUp[finalSpot];
        if (relation) {
            const nextPrediction = result[relation.finalSpot] || {
                finalSpot: relation.finalSpot,
            };
            nextPrediction[relation.player] = prediction.winner;
            result[relation.finalSpot] = nextPrediction;

            generateMatchPrediction(relation.finalSpot);
        }
    };

    for (const match of matches) {
        generateMatchPrediction(match.finalSpot);
    }

    return Object.values(result).sort((a, b) => b.finalSpot - a.finalSpot);
};
