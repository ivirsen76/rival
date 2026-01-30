import { useSelector } from 'react-redux';
import dayjs from '@rival/common/dayjs';
import useConfig from '@rival/common/utils/useConfig';
import hasAnyRole from '@rival/common/utils/hasAnyRole';
import getMatchPermissions from '@rival/club.backend/src/services/matches/getMatchPermissions';

export const getPermissions = ({
    tournament,
    match,
    matchId,
    emulateMyMatch = false,
    readOnly = false,
    currentDate = dayjs.tz(),
    currentUser,
    config,
} = {}) => {
    if (!tournament || readOnly) {
        return {};
    }
    if (!currentUser && !emulateMyMatch) {
        return {};
    }

    const currentPlayerId = currentUser?.tournaments[tournament.id]?.playerId;
    const currentPlayer = tournament.players?.[currentPlayerId];
    const isAdmin = hasAnyRole(currentUser, ['admin', 'manager']);

    if (!isAdmin && !currentPlayer?.isActive && !emulateMyMatch) {
        return {};
    }

    if (!match) {
        match = tournament.matches.find((item) => item.id === matchId);

        if (!match) {
            return {};
        }
    }

    const isSuperAdmin = hasAnyRole(currentUser, ['superadmin']);
    const isThisWeek = match.playedAt && currentDate.isSameOrBefore(dayjs.tz(match.playedAt), 'isoWeek');
    const weeksTooOld = isSuperAdmin ? 10 : 4;
    const isTooOld =
        config.url === 'demo' ? false : currentDate.diff(dayjs.tz(match.createdAt), 'week', true) > weeksTooOld;

    if (isTooOld) {
        return {};
    }

    const challenger = tournament.players[match.challengerId];
    const challenger2 = tournament.players[match.challenger2Id];
    const acceptor = tournament.players[match.acceptorId];
    const acceptor2 = tournament.players[match.acceptor2Id];

    return getMatchPermissions({
        levelType: tournament.levelType,
        match,
        currentUser,
        currentPlayer,
        challenger,
        challenger2,
        acceptor,
        acceptor2,
        isThisWeek,
        emulateMyMatch,
        isTournamentOver: tournament.isOver,
        currentDate: currentDate.format('YYYY-MM-DD HH:mm:ss'),
        players: Object.values(tournament.players),
    });
};

export default (params) => {
    const currentUser = useSelector((state) => state.auth.user);
    const config = useConfig();

    return getPermissions({ ...params, currentUser, config });
};
