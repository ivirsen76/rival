export default tournament => {
    const getTotal = tlr => {
        const a = 0.8;
        const b = 3.5;
        const pi = 3.1415926;
        const e = 2.71828183;
        const x = tlr / 100;
        const maxPlayers = 50;

        const first = 1 / (a * Math.sqrt(2 * pi));
        const second = e ** (-0.5 * ((x - b) / a) ** 2);

        return Math.round(first * second * 2 * maxPlayers);
    };

    if (tournament.isStarted) {
        return 0;
    }

    if (tournament.isOver) {
        return 0;
    }

    // only for the first tournament
    if (tournament.prevTournament) {
        return 0;
    }

    if (!tournament.levelBaseTlr) {
        return 0;
    }

    const num = getTotal(tournament.levelBaseTlr);
    if (num < 10) {
        return 0;
    }
    if (num - Object.keys(tournament.players).length < 5) {
        return 0;
    }

    return num;
};
