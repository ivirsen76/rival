import { isInjuryFullSetScoreIncomplete, isInjuryFastSetScoreIncomplete } from './utils';
import {
    isFullSetScoreCorrect,
    isFastSetScoreCorrect,
    isInjuryFullSetScoreCorrect,
    isInjuryFastSetScoreCorrect,
} from '@rival/ladder.backend/src/services/matches/helpers';

export default (values) => {
    const isFast4 = values.matchFormat === 2;
    const isSetScoreCorrect = isFast4 ? isFastSetScoreCorrect : isFullSetScoreCorrect;
    const isInjurySetScoreCorrect = isFast4 ? isInjuryFastSetScoreCorrect : isInjuryFullSetScoreCorrect;
    const isInjurySetScoreIncomplete = isFast4 ? isInjuryFastSetScoreIncomplete : isInjuryFullSetScoreIncomplete;
    let foundIncorrect = false;
    let foundIncomplete = false;
    let challengerSetWonCount = 0;
    let acceptorSetWonCount = 0;
    let result = values.score.filter((item, index) => {
        if (values.wonByInjury) {
            if (isSetScoreCorrect({ challengerPoints: item[0], acceptorPoints: item[1] })) {
                if (item[0] > item[1]) {
                    challengerSetWonCount++;
                } else {
                    acceptorSetWonCount++;
                }
            }

            if (challengerSetWonCount >= 2 || acceptorSetWonCount >= 2) {
                return false;
            }
            if (foundIncomplete) {
                return false;
            }
            if (!foundIncorrect) {
                foundIncorrect = !isInjurySetScoreCorrect({ challengerPoints: item[0], acceptorPoints: item[1] });
            }
            if (foundIncorrect) {
                return false;
            }

            foundIncomplete = isInjurySetScoreIncomplete({ challengerPoints: item[0], acceptorPoints: item[1] });

            return true;
        }

        if (!foundIncorrect) {
            foundIncorrect = !isSetScoreCorrect({
                challengerPoints: item[0],
                acceptorPoints: item[1],
                isMatchTieBreak: index === 2 && values.isMatchTieBreak,
            });
        }
        if (foundIncorrect) {
            return false;
        }

        return true;
    });

    if (result.length === 3) {
        const games = result.map(([num1, num2]) => {
            return num1 - num2;
        });
        if (games[0] * games[1] >= 0) {
            result = result.slice(0, 2);
        }
    }

    if (
        values.wonByInjury &&
        result.length < 3 &&
        result.every((item) => isSetScoreCorrect({ challengerPoints: item[0], acceptorPoints: item[1] }))
    ) {
        result.push([0, 0]);
    }

    return result.map((item) => item.join('-')).join(' ');
};
