export default (code) => {
    const obsoleteBadges = new Set(['firstChallenge']);
    if (obsoleteBadges.has(code)) {
        return true;
    }

    if (/^level\d+:tlr:\d+$/.test(code)) {
        return true;
    }

    return false;
};
