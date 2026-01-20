import { BYE_ID, POOL_PARTNER_ID } from '../../constants';

function hasAnyRole(user, desiredRoles) {
    if (!user) {
        return false;
    }
    return user.roles.split(',').some(role => desiredRoles.includes(role));
}

const getMatchPermissions = ({
    levelType,
    match,
    currentUser,
    currentPlayer,
    challenger,
    challenger2,
    acceptor,
    acceptor2,
    isThisWeek,
    emulateMyMatch,
    isTournamentOver,
    currentDate,
    players,
}) => {
    const hasBye = challenger?.id === BYE_ID || acceptor?.id === BYE_ID;
    const hasChallengers = Boolean(challenger || challenger2);
    const hasAcceptors = Boolean(acceptor || acceptor2);
    const hasPlayers = !hasBye && hasChallengers && hasAcceptors;
    const isDoubles = levelType === 'doubles';
    const isDoublesTeam = levelType === 'doubles-team';
    const isPlayer = hasAnyRole(currentUser, ['player']);
    const isAdmin = hasAnyRole(currentUser, ['admin', 'manager']);
    const isRegularTeamMatch = match.initial === 5 && !isTournamentOver;
    const hasAllPlayers = (() => {
        if (!challenger || !acceptor) {
            return false;
        }
        if (isDoubles || isDoublesTeam) {
            if (!challenger2 || !acceptor2) {
                return false;
            }
        }
        return true;
    })();

    const isChallengerCaptain =
        isDoublesTeam &&
        challenger &&
        currentPlayer &&
        !currentPlayer.partnerId &&
        (currentPlayer.id === challenger.id || currentPlayer.id === challenger.partnerId);
    const isAcceptorCaptain =
        isDoublesTeam &&
        acceptor &&
        currentPlayer &&
        !currentPlayer.partnerId &&
        (currentPlayer.id === acceptor.id || currentPlayer.id === acceptor.partnerId);
    const isAloneCaptain =
        isDoublesTeam &&
        currentPlayer &&
        !currentPlayer.partnerId &&
        !players.some(item => item.partnerId === currentPlayer.id);
    const isPoolPlayer = isDoublesTeam && currentPlayer && currentPlayer.partnerId === POOL_PARTNER_ID;
    const isTeammate = isDoublesTeam && currentPlayer && !isAloneCaptain && !isPoolPlayer;
    const isCurrentUserMatch = (() => {
        if (emulateMyMatch) {
            return true;
        }
        if (!currentPlayer) {
            return false;
        }
        if ([match.challengerId, match.challenger2Id, match.acceptorId, match.acceptor2Id].includes(currentPlayer.id)) {
            return true;
        }
        if (isDoublesTeam && challenger && !challenger2 && currentPlayer.partnerId === challenger.id) {
            return true;
        }
        if (isDoublesTeam && acceptor && !acceptor2 && currentPlayer.partnerId === acceptor.id) {
            return true;
        }

        return false;
    })();

    const result = {
        isPartOfChallengers: false,
        isPartOfAcceptors: false,
        canDeleteMatch: false,
        canDeleteProposal: false,
        canAcceptProposal: false,
        canUnacceptProposal: false,
        canScheduleMatch: false,
        canRescheduleMatch: false,
        canReportScore: false,
        canEditScore: false,
        canUploadStatistics: false,
        canClearResult: false,
        canReplacePlayers: false,
        canSeeMatchDetails: false,
        canSeeContact: false,
        canReplaceTeamPlayers: false,
    };

    if (!isAdmin && !emulateMyMatch && !currentPlayer?.isActive) {
        return result;
    }

    result.isPartOfChallengers = (() => {
        if (!isPlayer) {
            return false;
        }
        if (!currentPlayer) {
            return false;
        }

        return [challenger?.id, challenger2?.id, challenger?.partnerId, challenger2?.partnerId].includes(
            currentPlayer.id
        );
    })();

    result.isPartOfAcceptors = (() => {
        if (!isPlayer) {
            return false;
        }
        if (!currentPlayer) {
            return false;
        }

        return [acceptor?.id, acceptor2?.id, acceptor?.partnerId, acceptor2?.partnerId].includes(currentPlayer.id);
    })();

    result.canDeleteMatch = (() => {
        if (!match.score && match.initial !== 6) {
            return false;
        }
        if (!isThisWeek) {
            return false;
        }
        if (match.type === 'final') {
            return false;
        }
        if (isRegularTeamMatch) {
            return false;
        }
        if (!hasAllPlayers) {
            return false;
        }

        return Boolean(isAdmin && match.score) || isCurrentUserMatch;
    })();

    result.canDeleteProposal = (() => {
        if (match.score) {
            return false;
        }
        if (match.type === 'final') {
            return false;
        }
        if (!currentPlayer) {
            return false;
        }

        return [match.challengerId, match.challenger2Id].includes(currentPlayer.id);
    })();

    result.canAcceptProposal = (() => {
        if (!isPlayer) {
            return false;
        }
        if (match.initial !== 1) {
            return false;
        }
        if (match.score) {
            return false;
        }
        if (result.isPartOfChallengers) {
            return false;
        }
        if (hasAcceptors) {
            return false;
        }
        if (isDoublesTeam && !isTeammate) {
            return false;
        }
        if (match.playedAt < currentDate) {
            return false;
        }
        if (!challenger.isActive) {
            return false;
        }

        return true;
    })();

    result.canUnacceptProposal = (() => {
        if (!isPlayer) {
            return false;
        }
        if (match.initial !== 1) {
            return false;
        }
        if (match.score) {
            return false;
        }
        if (result.isPartOfChallengers) {
            return false;
        }
        if (!result.isPartOfAcceptors) {
            return false;
        }
        if (!currentPlayer) {
            return false;
        }

        return isAcceptorCaptain || [match.acceptorId, match.acceptor2Id].includes(currentPlayer.id);
    })();

    result.canScheduleMatch = (() => {
        if (!isPlayer && !emulateMyMatch) {
            return false;
        }
        if (match.score || match.playedAt) {
            return false;
        }
        if (isDoubles) {
            return false;
        }
        if (!hasPlayers) {
            return false;
        }

        return isCurrentUserMatch || isChallengerCaptain || isAcceptorCaptain;
    })();

    result.canRescheduleMatch = (() => {
        if (!isPlayer) {
            return false;
        }
        if (match.score || !match.playedAt) {
            return false;
        }
        if (isDoubles) {
            return false;
        }
        if (!hasPlayers) {
            return false;
        }

        return isCurrentUserMatch || isChallengerCaptain || isAcceptorCaptain;
    })();

    result.canReportScore = (() => {
        if (match.score) {
            return false;
        }
        if (!hasPlayers) {
            return false;
        }
        if (!isAdmin && !isCurrentUserMatch && !isChallengerCaptain && !isAcceptorCaptain) {
            return false;
        }

        return (isThisWeek && !isTournamentOver) || match.type === 'final' || isRegularTeamMatch;
    })();

    result.canEditScore = (() => {
        if (!match.score) {
            return false;
        }
        if (!isThisWeek) {
            return false;
        }

        return isAdmin || isCurrentUserMatch || isChallengerCaptain || isAcceptorCaptain;
    })();

    result.canUploadStatistics = (() => {
        if (!isPlayer) {
            return false;
        }
        if (!match.score) {
            return false;
        }
        if (match.unavailable || match.wonByInjury) {
            return false;
        }
        if (isDoubles || isDoublesTeam) {
            return false;
        }

        return isCurrentUserMatch;
    })();

    result.canClearResult = (() => {
        return Boolean(match.score && isAdmin && match.type === 'final');
    })();

    result.canReplacePlayers = (() => {
        return match.id && !match.score && isAdmin && match.type === 'final';
    })();

    result.canSeeMatchDetails = (() => {
        if (!hasPlayers) {
            return false;
        }
        if (match.score || !isThisWeek || isRegularTeamMatch) {
            return false;
        }
        if (!match.place) {
            return false;
        }

        return isCurrentUserMatch || isChallengerCaptain || isAcceptorCaptain;
    })();

    result.canSeeContact = (() => {
        if (!isDoublesTeam || match.score) {
            return false;
        }
        if (!currentPlayer) {
            return false;
        }
        if (result.canAcceptProposal) {
            return true;
        }

        return currentPlayer.id === match.challengerId || currentPlayer.id === match.acceptorId;
    })();

    result.canReplaceTeamPlayers = (() => {
        if (!isDoublesTeam) {
            return false;
        }
        if (match.score || !match.playedAt) {
            return false;
        }

        // only for frontend
        if (currentPlayer?.partnerIds?.length < 3) {
            return false;
        }

        return isCurrentUserMatch;
    })();

    return result;
};

export default getMatchPermissions;
