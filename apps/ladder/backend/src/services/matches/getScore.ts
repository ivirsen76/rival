import { Unprocessable } from '@feathersjs/errors';

const getScore = points => {
    const isGameOver = ([num1, num2]) => {
        const max = Math.max(num1, num2);
        const diff = Math.abs(num1 - num2);

        return max >= 4 && diff > 1;
    };
    const isSetOver = ([num1, num2]) => {
        const max = Math.max(num1, num2);
        const diff = Math.abs(num1 - num2);

        return max === 7 || (max === 6 && diff > 1);
    };
    const isTiebreakOver = ([num1, num2]) => {
        const max = Math.max(num1, num2);
        const diff = Math.abs(num1 - num2);

        return max >= 7 && diff > 1;
    };
    const isMatchTiebreakOver = ([num1, num2]) => {
        const max = Math.max(num1, num2);
        const diff = Math.abs(num1 - num2);

        return max >= 10 && diff > 1;
    };

    const score = [];
    let setScore = [0, 0];
    let gameScore = [0, 0];
    let isMatchTiebreak = false;
    points.forEach((point, index, list) => {
        if (
            !isMatchTiebreak &&
            score.length === 2 &&
            setScore[0] === 0 &&
            setScore[1] === 0 &&
            gameScore[0] === 0 &&
            gameScore[1] === 0 &&
            list[index + 1] &&
            point.server !== list[index + 1].server
        ) {
            isMatchTiebreak = true;
        }

        gameScore[point.did_host_win_point ? 0 : 1]++;

        if (isMatchTiebreak) {
            if (isMatchTiebreakOver(gameScore)) {
                const isHostWonTheGame = gameScore[0] > gameScore[1];
                score.push(isHostWonTheGame ? [1, 0] : [0, 1]);
                gameScore = [0, 0];
            }
        } else {
            const isTiebreak = setScore[0] === 6 && setScore[1] === 6;
            if (isTiebreak ? isTiebreakOver(gameScore) : isGameOver(gameScore)) {
                const isHostWonTheGame = gameScore[0] > gameScore[1];
                setScore[isHostWonTheGame ? 0 : 1]++;
                gameScore = [0, 0];
            }
            if (isSetOver(setScore)) {
                score.push(setScore);
                setScore = [0, 0];
            }
        }
    });

    if (setScore[0] + setScore[1] > 0) {
        score.push(setScore);
    }

    if (score.length !== 2 && score.length !== 3) {
        throw new Unprocessable('Invalid request', { errors: { link: 'The score from this link is incorrect.' } });
    }

    return score.map(item => item.join('-')).join(' ');
};

export default getScore;
