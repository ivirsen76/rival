import dayjs from '@/utils/dayjs';

export default (possibleMatches, currentPlayerId, currentDate = dayjs.tz().format('YYYY-MM-DD HH:mm:ss')) => {
    const opponents = new Set();

    return [...possibleMatches]
        .sort((a, b) => b.playedAt.localeCompare(a.playedAt))
        .filter((match) => {
            if (match.challengerId !== currentPlayerId && match.acceptorId !== currentPlayerId) {
                return false;
            }

            if (dayjs.tz(match.playedAt).isAfter(dayjs.tz(currentDate), 'day')) {
                return false;
            }

            const opponentId = match.challengerId === currentPlayerId ? match.acceptorId : match.challengerId;
            if (opponents.has(opponentId)) {
                return false;
            }

            opponents.add(opponentId);

            return true;
        });
};
