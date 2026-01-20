import { completeInjuryFullScore, completeInjuryFastScore } from '../matches/helpers';
import { BYE_ID } from '../../constants';

export default (matches, prediction) => {
    const matchesObj = matches.reduce((obj, item) => {
        obj[item.finalSpot] = item;
        return obj;
    }, {});
    const possibleWinners = matches.reduce((set, item) => {
        if (item.challengerId) {
            set.add(item.challengerId);
        }
        if (item.acceptorId) {
            set.add(item.acceptorId);
        }
        return set;
    }, new Set());

    let points = 0;
    let possiblePoints = 0;
    prediction
        .filter((item) => item.challengerId !== BYE_ID && item.acceptorId !== BYE_ID)
        .sort((a, b) => b.finalSpot - a.finalSpot)
        .forEach((matchPrediction) => {
            const match = matchesObj[matchPrediction.finalSpot];

            if (!match?.score) {
                if (possibleWinners.has(matchPrediction.winner)) {
                    possiblePoints += 3;
                }
                return;
            }

            possibleWinners.delete(match.challengerId === match.winner ? match.acceptorId : match.challengerId);

            if (match.winner !== matchPrediction?.winner) {
                return;
            }

            const isFast4 = match.matchFormat === 2;
            const completeInjuryScore = isFast4 ? completeInjuryFastScore : completeInjuryFullScore;

            // for the right winner
            points += 2;

            const score = completeInjuryScore(match.score, match.winner === match.challengerId);
            const sets = score.split(' ').length;

            // for the right number of sets
            if (matchPrediction.sets === sets) {
                points++;
            }
        });

    return { points, maxPoints: points + possiblePoints };
};
