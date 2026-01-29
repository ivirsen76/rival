import _cloneDeep from 'lodash/cloneDeep';

export default ({ tournament, playerId, captainId, replaceCaptain }) => {
    const result = _cloneDeep(tournament);

    const isSameTeam = result.players[playerId].partnerIds?.[0] === captainId;
    const isCaptain = result.players[playerId].partnerIds?.[0] === playerId;
    const playerTeamName = result.players[playerId].teamName;
    const partnersFrom = (result.players[playerId].partnerIds || []).filter((id) => id !== playerId);

    if (captainId === 999999) {
        result.players[playerId].isDoublesTeamCaptain = false;
        result.players[playerId].isDoublesTeamPartner = false;
        result.players[playerId].isDoublesTeamPlayerPool = true;
        result.players[playerId].teamName = null;
        result.players[playerId].partnerId = 999999;
        delete result.players[playerId].partnerIds;

        for (const partnerId of partnersFrom) {
            result.players[partnerId].partnerIds = result.players[partnerId].partnerIds.filter((id) => id !== playerId);
        }

        if (isCaptain && partnersFrom.length > 0) {
            const newCaptainId = partnersFrom[0];
            result.players[newCaptainId].isDoublesTeamCaptain = true;
            result.players[newCaptainId].isDoublesTeamPartner = false;
            result.players[newCaptainId].isDoublesTeamPlayerPool = false;
            result.players[newCaptainId].teamName = playerTeamName;
        }

        return result;
    }

    result.players[playerId].partnerIds = replaceCaptain
        ? [playerId, ...result.players[captainId].partnerIds.filter((id) => id !== playerId)]
        : [...result.players[captainId].partnerIds.filter((id) => id !== playerId), playerId];
    result.players[playerId].isDoublesTeamCaptain = replaceCaptain;
    result.players[playerId].isDoublesTeamPartner = !replaceCaptain;
    result.players[playerId].isDoublesTeamPlayerPool = false;
    result.players[playerId].teamName = replaceCaptain ? result.players[captainId].teamName : null;
    result.players[playerId].partnerId = replaceCaptain ? null : captainId;

    const partnersTo = result.players[captainId].partnerIds.filter((id) => id !== playerId);
    for (const partnerId of partnersTo) {
        result.players[partnerId].partnerIds = result.players[playerId].partnerIds;

        if (replaceCaptain) {
            result.players[partnerId].isDoublesTeamCaptain = false;
            result.players[partnerId].isDoublesTeamPartner = true;
            result.players[partnerId].teamName = null;
            result.players[partnerId].partnerId = playerId;
        }
    }

    if (playerId === captainId && !replaceCaptain) {
        const newCaptainId = result.players[playerId].partnerIds[0];
        result.players[newCaptainId].isDoublesTeamCaptain = true;
        result.players[newCaptainId].isDoublesTeamPartner = false;
        result.players[newCaptainId].teamName = playerTeamName;
    }

    if (!isSameTeam) {
        for (const partnerId of partnersFrom) {
            result.players[partnerId].partnerIds = result.players[partnerId].partnerIds.filter((id) => id !== playerId);
        }
        if (isCaptain && partnersFrom.length > 0) {
            const newCaptainId = partnersFrom[0];
            result.players[newCaptainId].isDoublesTeamCaptain = true;
            result.players[newCaptainId].isDoublesTeamPartner = false;
            result.players[newCaptainId].teamName = playerTeamName;
        }
    }

    for (const player of Object.values(result.players)) {
        if (player.partnerIds) {
            player.partnerIds = [player.partnerIds[0], ...player.partnerIds.slice(1).sort((a, b) => a - b)];
        }
    }

    return result;
};
