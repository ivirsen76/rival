import { useSelector } from 'react-redux';

export default (tournamentId) => {
    const currentUser = useSelector((state) => state.auth.user);

    if (!currentUser) {
        return [];
    }

    const seasonId = currentUser.tournaments[tournamentId]?.seasonId;
    if (!seasonId) {
        return [];
    }

    return Object.values(currentUser.tournaments)
        .filter((t) => t.isActive && t.seasonId === seasonId && t.levelType === 'single')
        .map((t) => ({
            value: t.tournamentId,
            label: t.levelName,
            disabled: t.tournamentId === tournamentId,
        }));
};
