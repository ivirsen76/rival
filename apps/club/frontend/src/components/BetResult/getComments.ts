import { BYE_ID } from '@rival/club.backend/src/constants';

export default (matches, prediction, players) => {
    const result = {};
    const matchesArray = Object.values(matches);
    const sortedPrediction = [...prediction].sort((a, b) => b.finalSpot - a.finalSpot);

    const getPlayerName = (id) => `${players[id].firstName} ${players[id].lastName}`;
    const revertScore = (score) =>
        score
            .split(' ')
            .map((set) => set.replace(/(\d+)-(\d+)/, '$2-$1'))
            .join(' ');
    const findLostMatch = (finalSpot, playerId) =>
        matchesArray.find(
            (item) =>
                item.winner &&
                (item.winner === item.challengerId ? item.acceptorId === playerId : item.challengerId === playerId)
        );
    const findFirstRound = (playerId) =>
        sortedPrediction.find(
            (item) =>
                (item.challengerId === playerId || item.acceptorId === playerId) &&
                item.challengerId !== BYE_ID &&
                item.acceptorId !== BYE_ID
        );

    for (const item of sortedPrediction) {
        const { finalSpot, challengerId, acceptorId, winner } = item;

        if (challengerId === BYE_ID || acceptorId === BYE_ID) {
            continue;
        }

        {
            const match = matches[finalSpot];
            if (match?.score) {
                const matchLooser = match.winner === match.challengerId ? match.acceptorId : match.challengerId;

                if (winner === match.winner) {
                    const score = match.wonByDefault
                        ? ' by default.'
                        : `<div class="mt-1 fw-bold">${
                              match.winner === match.challengerId ? match.score : revertScore(match.score)
                          }</div>`;

                    result[finalSpot] = `${getPlayerName(match.winner)} beat ${getPlayerName(matchLooser)}${score}`;
                    continue;
                }
                if (winner === matchLooser) {
                    const score = match.wonByDefault
                        ? ' by default.'
                        : `<div class="mt-1 fw-bold">${
                              matchLooser === match.challengerId ? match.score : revertScore(match.score)
                          }</div>`;

                    result[finalSpot] = `${getPlayerName(matchLooser)} lost to ${getPlayerName(match.winner)}${score}`;
                    continue;
                }
            }
        }

        {
            const match = findLostMatch(finalSpot, winner);
            if (match) {
                const stage =
                    match.finalSpot > 7
                        ? 'Round of 16'
                        : match.finalSpot > 3
                          ? 'Quarterfinal'
                          : match.finalSpot > 1
                            ? 'Semifinal'
                            : 'Final';

                result[finalSpot] = `${getPlayerName(winner)} lost in the ${stage}.`;
                continue;
            }
        }

        {
            const firstRoundPrediction = findFirstRound(winner);
            if (firstRoundPrediction) {
                const match = matches[firstRoundPrediction.finalSpot];
                if (match) {
                    const substituteId =
                        firstRoundPrediction.challengerId === winner ? match.challengerId : match.acceptorId;
                    if (substituteId !== winner) {
                        result[finalSpot] = `${getPlayerName(winner)} was replaced by ${getPlayerName(substituteId)}.`;
                        continue;
                    }
                }
            }
        }
    }

    return result;
};
