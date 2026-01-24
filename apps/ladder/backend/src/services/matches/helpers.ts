import type { Match } from '../../types';
import dayjs from '../../utils/dayjs';
import _round from 'lodash/round';

export const isDateThisWeek = (dateAsUtcString: string) => {
    if (!dateAsUtcString) {
        return false;
    }

    const currentDate = dayjs.tz();
    const date = dayjs.tz(dateAsUtcString);

    return date.isValid() && date.isSame(currentDate, 'isoWeek');
};

export const getLocalDateThisWeek = (desiredDateAsUtcString: string) => {
    const currentDate = dayjs.tz();
    const minutes = Math.floor(currentDate.minute() / 15) * 15;
    const closestDate = currentDate.minute(minutes).second(0).format('YYYY-MM-DD HH:mm:ss');

    if (!isDateThisWeek(desiredDateAsUtcString)) {
        return closestDate;
    }

    return closestDate < desiredDateAsUtcString ? closestDate : desiredDateAsUtcString;
};

export const revertScore = (score: string) => {
    return score
        .split(' ')
        .map((set) => set.replace(/(\d+)-(\d+)/, '$2-$1'))
        .join(' ');
};

type SetValues = {
    challengerPoints: number;
    acceptorPoints: number;
    isMatchTieBreak?: boolean;
};
export const isFullSetScoreCorrect = (values: SetValues) => {
    if (values.challengerPoints === null || values.acceptorPoints === null) {
        return false;
    }

    const diff = Math.abs(values.challengerPoints - values.acceptorPoints);
    const sum = values.challengerPoints + values.acceptorPoints;
    const max = Math.max(values.challengerPoints, values.acceptorPoints);

    if (values.isMatchTieBreak && max === 1 && sum === 1) {
        return true;
    }

    if (max < 6) {
        return false;
    }

    if (diff === 0) {
        return false;
    }

    if (diff === 1 && sum !== 13) {
        return false;
    }

    if (max === 7 && diff > 2) {
        return false;
    }

    return true;
};

export const isFastSetScoreCorrect = (values: SetValues) => {
    if (values.challengerPoints === null || values.acceptorPoints === null) {
        return false;
    }

    const diff = Math.abs(values.challengerPoints - values.acceptorPoints);
    const sum = values.challengerPoints + values.acceptorPoints;
    const max = Math.max(values.challengerPoints, values.acceptorPoints);

    if (values.isMatchTieBreak && max === 1 && sum === 1) {
        return true;
    }

    if (max !== 4) {
        return false;
    }

    if (diff === 0) {
        return false;
    }

    return true;
};

export const isInjuryFullSetScoreCorrect = (values: SetValues) => {
    if (values.challengerPoints === null || values.acceptorPoints === null) {
        return false;
    }

    const diff = Math.abs(values.challengerPoints - values.acceptorPoints);
    const sum = values.challengerPoints + values.acceptorPoints;
    const max = Math.max(values.challengerPoints, values.acceptorPoints);

    if (max > 7) {
        return false;
    }

    if (sum > 13) {
        return false;
    }

    if (max === 7 && diff > 2) {
        return false;
    }

    return true;
};

export const isInjuryFastSetScoreCorrect = (values: SetValues) => {
    if (values.challengerPoints === null || values.acceptorPoints === null) {
        return false;
    }

    const sum = values.challengerPoints + values.acceptorPoints;
    const max = Math.max(values.challengerPoints, values.acceptorPoints);

    if (max > 4) {
        return false;
    }

    if (sum > 7) {
        return false;
    }

    return true;
};

export const completeInjuryFullScore = (score: string, isFirstWinner = true) => {
    // we have to remove empty set at the end
    const sets =
        score === ''
            ? []
            : score
                  .replace(/(\s0-0)+$/, '')
                  .split(' ')
                  .map((set) => set.split('-').map(Number));

    const result = [];
    let won = 0;
    for (let i = 0; i < 3; i++) {
        if (won === 2) {
            break;
        }

        const currentSet = sets[i];
        if (currentSet) {
            if (isFullSetScoreCorrect({ challengerPoints: currentSet[0], acceptorPoints: currentSet[1] })) {
                result.push(currentSet);
            } else {
                result.push([
                    isFirstWinner ? (currentSet[1] < 5 ? 6 : 7) : currentSet[0],
                    isFirstWinner ? currentSet[1] : currentSet[0] < 5 ? 6 : 7,
                ]);
            }
        } else if (i === 2) {
            result.push(isFirstWinner ? [1, 0] : [0, 1]);
        } else {
            result.push(isFirstWinner ? [6, 0] : [0, 6]);
        }

        const wonSet = isFirstWinner ? result[i][0] > result[i][1] : result[i][1] > result[i][0];
        if (wonSet) {
            won++;
        }
    }

    return result.map((item) => item.join('-')).join(' ');
};

export const completeInjuryFastScore = (score: string, isFirstWinner = true) => {
    // we have to remove empty set at the end
    const sets =
        score === ''
            ? []
            : score
                  .replace(/(\s0-0)+$/, '')
                  .split(' ')
                  .map((set) => set.split('-').map(Number));

    const result = [];
    let won = 0;
    for (let i = 0; i < 3; i++) {
        if (won === 2) {
            break;
        }

        const currentSet = sets[i];
        if (currentSet) {
            if (isFastSetScoreCorrect({ challengerPoints: currentSet[0], acceptorPoints: currentSet[1] })) {
                result.push(currentSet);
            } else {
                result.push([isFirstWinner ? 4 : currentSet[0], isFirstWinner ? currentSet[1] : 4]);
            }
        } else if (i === 2) {
            result.push(isFirstWinner ? [1, 0] : [0, 1]);
        } else {
            result.push(isFirstWinner ? [4, 0] : [0, 4]);
        }

        const wonSet = isFirstWinner ? result[i][0] > result[i][1] : result[i][1] > result[i][0];
        if (wonSet) {
            won++;
        }
    }

    return result.map((item) => item.join('-')).join(' ');
};

export const isFullScoreCorrect = (score: string, allowMatchTieBreak = true) => {
    const sets = score.split(' ').map((set) => set.split('-').map(Number));

    const won = sets.map((nums) => nums[0] > nums[1]);

    if (sets.length !== 2 && sets.length !== 3) {
        return false;
    }

    if (sets.length === 3 && won[0] === won[1]) {
        return false;
    }

    const setDiff = Math.abs(sets.reduce((sum, nums) => sum + (nums[0] - nums[1] > 0 ? 1 : -1), 0));
    if (setDiff !== 1 && setDiff !== 2) {
        return false;
    }

    return sets.every((nums, index) => {
        if (!Number.isInteger(nums[0]) || !Number.isInteger(nums[1])) {
            return false;
        }

        const diff = Math.abs(nums[0] - nums[1]);
        const sum = nums[0] + nums[1];
        const max = Math.max(nums[0], nums[1]);
        const min = Math.min(nums[0], nums[1]);

        if (diff === 0) {
            return false;
        }

        if (index === 2 && sum === 1 && allowMatchTieBreak) {
            return true;
        }

        if (max < 6 || max > 7 || min < 0) {
            return false;
        }

        if (diff === 1 && sum !== 13) {
            return false;
        }

        if (max === 7 && diff > 2) {
            return false;
        }

        return true;
    });
};

export const isFastScoreCorrect = (score: string) => {
    const sets = score.split(' ').map((set) => set.split('-').map(Number));

    const won = sets.map((nums) => nums[0] > nums[1]);

    if (sets.length !== 2 && sets.length !== 3) {
        return false;
    }

    if (sets.length === 3 && won[0] === won[1]) {
        return false;
    }

    const setDiff = Math.abs(sets.reduce((sum, nums) => sum + (nums[0] - nums[1] > 0 ? 1 : -1), 0));
    if (setDiff !== 1 && setDiff !== 2) {
        return false;
    }

    return sets.every((nums, index) => {
        if (!Number.isInteger(nums[0]) || !Number.isInteger(nums[1])) {
            return false;
        }

        const diff = Math.abs(nums[0] - nums[1]);
        const sum = nums[0] + nums[1];
        const max = Math.max(nums[0], nums[1]);
        const min = Math.min(nums[0], nums[1]);

        if (diff === 0) {
            return false;
        }

        if (index === 2) {
            return sum === 1;
        }

        if (max !== 4 || min < 0) {
            return false;
        }

        return true;
    });
};

export const getPoints = (match: Match) => {
    const MAX_POINTS = 40;
    const PARTICIPATION_POINTS = 2;
    const CHALLENGER_POINTS = 2;

    const { challengerId, acceptorId, challengerRank, acceptorRank, wonByDefault, unavailable, matchFormat } = match;

    const isFast4 = matchFormat === 2;
    const isScoreCorrect = isFast4 ? isFastScoreCorrect : isFullScoreCorrect;
    const completeInjuryScore = isFast4 ? completeInjuryFastScore : completeInjuryFullScore;
    const score = match.wonByInjury ? completeInjuryScore(match.score, match.winner === challengerId) : match.score;

    if (!score || !isScoreCorrect(score)) {
        return {
            challengerPoints: match.challengerPoints,
            acceptorPoints: match.acceptorPoints,
            winner: match.winner,
        };
    }

    const scoreArray = score
        .replace(/\(\d+\)/g, '')
        .split(' ')
        .map((item) => item.split('-').map((num) => +num));

    const isChallengerWon = scoreArray.filter((nums) => nums[0] > nums[1]).length > 1;
    const winnerRankDiff = Math.min(
        isChallengerWon ? challengerRank - acceptorRank : acceptorRank - challengerRank,
        10
    );
    const winnerGameDiff = Math.max(
        scoreArray.reduce((sum, nums) => sum + (nums[0] - nums[1]) * (isChallengerWon ? 1 : -1), 0),
        2
    );
    const looserGamesWon = scoreArray.reduce((sum, nums) => sum + (isChallengerWon ? nums[1] : nums[0]), 0);

    const winner = isChallengerWon ? challengerId : acceptorId;
    const winnerPoints = Math.floor(
        (winnerRankDiff < 0 ? 10 : 15) +
            (winnerRankDiff < 1 ? winnerGameDiff : winnerGameDiff * (Math.max(winnerRankDiff, 2) / 2))
    );
    const looserPoints = Math.min(looserGamesWon, 10);

    return {
        challengerPoints: (() => {
            if (unavailable) {
                return 0;
            }

            if (wonByDefault) {
                return isChallengerWon ? 20 : 0;
            }

            return isChallengerWon
                ? Math.min(PARTICIPATION_POINTS + CHALLENGER_POINTS + winnerPoints, MAX_POINTS)
                : looserPoints + PARTICIPATION_POINTS + CHALLENGER_POINTS;
        })(),
        acceptorPoints: (() => {
            if (unavailable) {
                return 0;
            }

            if (wonByDefault) {
                return isChallengerWon ? 0 : 20;
            }

            return isChallengerWon
                ? PARTICIPATION_POINTS + looserPoints
                : Math.min(PARTICIPATION_POINTS + winnerPoints, MAX_POINTS);
        })(),
        winner,
    };
};

export const getOutcome = (score: string) => {
    const winSetPoints = 0.09;
    const winGamePoints = 0.03;
    const setPoints: Record<string, number> = {
        '1-0': winSetPoints + winGamePoints * 1,
        '7-6': winSetPoints + winGamePoints * 0,
        '7-5': winSetPoints + winGamePoints * 2,
        '6-4': winSetPoints + winGamePoints * 3,
        '6-3': winSetPoints + winGamePoints * 4,
        '6-2': winSetPoints + winGamePoints * 5,
        '6-1': winSetPoints + winGamePoints * 6,
        '6-0': winSetPoints + winGamePoints * 7,

        // Fast4
        '4-3': winSetPoints + winGamePoints * 0, // => 7-6
        '4-2': winSetPoints + winGamePoints * 3, // => 6-4
        '4-1': winSetPoints + winGamePoints * 5, // => 6-2
        '4-0': winSetPoints + winGamePoints * 7, // => 6-0
    };

    const isFast4 = isFastScoreCorrect(score);
    const result = _round(
        score
            .split(' ')
            .map((set) => {
                let [first, second] = set.split('-').map(Number);
                let sign = 1;
                if (first < second) {
                    const temp = first;
                    first = second;
                    second = temp;
                    sign = -1;
                }

                // adjust some incorrect scores from Raleigh history
                (() => {
                    if (isFast4) {
                        return;
                    }
                    if (first === 1 && second === 0) {
                        return;
                    }
                    if (first === 7 && second === 6) {
                        return;
                    }
                    if (first === 7 && second === 5) {
                        return;
                    }
                    if (first === 6 && second === 6) {
                        first = 7;
                        return;
                    }
                    if (first === 6 && second === 5) {
                        first = 7;
                        return;
                    }
                    if (first > 6) {
                        first = 1;
                        second = 0;
                        return;
                    }
                    if (first < 6) {
                        first = Math.max(second + 2, 6);
                    }
                })();

                const positive = `${first}-${second}`;
                if (setPoints[positive]) {
                    return sign * setPoints[positive];
                }

                throw new Error(`Wrong score: ${set}`);
            })
            .reduce((sum, num) => sum + num, 0.5),
        2
    );

    if (result > 1) {
        return 1;
    }
    if (result < 0) {
        return 0;
    }

    return result;
};
