export default (subject) => {
    const players = subject.partners || [subject];

    const useInitials = players.length > 1;
    const getInitials = (player) => player.lastName.slice(0, 1).toUpperCase() + '.';

    return players
        .map((player) => [player.firstName, useInitials ? getInitials(player) : player.lastName].join(' '))
        .join(' / ');
};
