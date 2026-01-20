export default props => {
    const { challengerRank, acceptorRank, score } = props;

    const result = { participationBonus: 2, challengerBonus: 2 };

    const MAX_POINTS = 40;
    const sets = score.split(' ').map(item => item.split('-').map(Number));
    const lastSet = sets[sets.length - 1];
    const isChallengerWon = lastSet[0] > lastSet[1];
    const winnerRankDiff = isChallengerWon ? challengerRank - acceptorRank : acceptorRank - challengerRank;
    const winner = isChallengerWon ? 'challenger' : 'acceptor';
    const looser = isChallengerWon ? 'acceptor' : 'challenger';

    if (winnerRankDiff === 0) {
        result.winOverEqual = 15;
    } else if (winnerRankDiff > 0) {
        result.winOverHigher = 15;
        result.rankDiff = Math.max(2, Math.min(10, winnerRankDiff));

        if (winnerRankDiff > 10) {
            result.isRankDiffMax = true;
        }
        if (winnerRankDiff < 2) {
            result.isRankDiffMin = true;
        }
    } else {
        result.winOverLower = 10;
    }

    result.gamesDiff = sets
        .map(item => item[0] - item[1])
        .reduce((sum, item) => sum + (isChallengerWon ? item : -item), 0);
    if (result.gamesDiff < 2) {
        result.gamesDiff = 2;
        result.isGamesDiffMin = true;
    }

    result.totalGames = sets.reduce((sum, item) => sum + (isChallengerWon ? item[1] : item[0]), 0);
    if (result.totalGames > 10) {
        result.totalGames = 10;
        result.isTotalGamesMax = true;
    }

    result[`${looser}Points`] = 2 + (isChallengerWon ? 0 : 2) + result.totalGames;
    result[`${looser}Formula`] = `<div>participationBonus + ${
        isChallengerWon ? '' : 'challengerBonus + '
    }totalGames = </div><div>${looser}Points</div>`;

    if (result.winOverLower) {
        result[`${winner}Points`] = 2 + (isChallengerWon ? 2 : 0) + result.winOverLower + result.gamesDiff;

        result[`${winner}Formula`] = `<div>participationBonus + ${
            isChallengerWon ? 'challengerBonus + ' : ''
        }winOverLower + gamesDiff = </div><div>${winner}Points</div>`;
    } else if (result.winOverHigher) {
        result[`${winner}Points`] =
            2 + (isChallengerWon ? 2 : 0) + result.winOverHigher + (result.rankDiff * result.gamesDiff) / 2;
        if (result[`${winner}Points`] > MAX_POINTS) {
            result[`${winner}PrePoints`] = result[`${winner}Points`];
            result[`${winner}Points`] = MAX_POINTS;
        }
        if (!Number.isInteger(result[`${winner}Points`])) {
            result[`${winner}PrePoints`] = result[`${winner}Points`];
            result[`${winner}Points`] = Math.floor(result[`${winner}Points`]);
        }

        result[`${winner}Formula`] = `<div>participationBonus + ${
            isChallengerWon ? 'challengerBonus + ' : ''
        }winOverHigher + (rankDiff * gamesDiff / 2) = ${
            result[`${winner}PrePoints`] ? `${result[`${winner}PrePoints`]} → ` : ''
        }</div><div>${winner}Points</div>`;
    } else {
        result[`${winner}Points`] = 2 + (isChallengerWon ? 2 : 0) + result.winOverEqual + result.gamesDiff;

        result[`${winner}Formula`] = `<div>participationBonus + ${
            isChallengerWon ? 'challengerBonus + ' : ''
        }winOverEqual + gamesDiff = </div><div>${winner}Points</div>`;
    }

    delete result.challengerPrePoints;
    delete result.acceptorPrePoints;

    return result;
};
