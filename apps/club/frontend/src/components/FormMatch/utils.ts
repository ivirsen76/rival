import { isFullSetScoreCorrect, isFastSetScoreCorrect } from '@rival/club.backend/src/services/matches/helpers';

export const isInjuryFullSetScoreIncomplete = (values) => {
    return !isFullSetScoreCorrect(values);
};

export const isInjuryFastSetScoreIncomplete = (values) => {
    return !isFastSetScoreCorrect(values);
};

export const getAvailableSets = (score, isFast4 = false, wonByInjury = false) => {
    const isSetScoreCorrect = isFast4 ? isFastSetScoreCorrect : isFullSetScoreCorrect;

    const firstIncorrectSet = score.findIndex(
        (item) =>
            !isSetScoreCorrect({
                challengerPoints: item[0],
                acceptorPoints: item[1],
            })
    );

    const isCompleteTwoSets = (() => {
        if (firstIncorrectSet !== -1 && firstIncorrectSet !== 2) {
            return false;
        }

        const result = (score[0][0] > score[0][1] ? 1 : -1) + (score[1][0] > score[1][1] ? 1 : -1);
        return Math.abs(result) === 2;
    })();

    if (isCompleteTwoSets) {
        return [1, 2];
    }

    const result = [1, 2, 3].filter((num) => firstIncorrectSet === -1 || num <= firstIncorrectSet + 1);

    // remove third set for fast4 and injury
    if (isFast4 && wonByInjury && result.length === 3) {
        return [1, 2];
    }

    return result;
};
