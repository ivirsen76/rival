const processStat = (stat) => {
    const fill = (player, anotherPlayer) => {
        player.firstServeInPercent = Math.round((player.firstServeIn / player.serveTotal) * 100);
        player.firstServeWonPercent = Math.round((player.firstServeWon / player.firstServeIn) * 100);
        player.secondServeWonPercent =
            player.serveTotal - player.firstServeIn === 0
                ? 0
                : Math.round((player.secondServeWon / (player.serveTotal - player.firstServeIn)) * 100);
        player.serveWon = player.firstServeWon + player.secondServeWon;
    };

    const result = typeof stat === 'string' ? JSON.parse(stat) : stat;
    fill(result.challenger);
    fill(result.acceptor);

    result.pointsTotal = result.challenger.serveTotal + result.acceptor.serveTotal;
    result.challenger.pointsWon = result.challenger.serveWon + (result.acceptor.serveTotal - result.acceptor.serveWon);
    result.acceptor.pointsWon = result.pointsTotal - result.challenger.pointsWon;

    return result;
};

export default processStat;
