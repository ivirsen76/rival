const formatElo = elo => (elo || elo === 0 ? `${Math.floor(elo / 100)}.` + `${elo % 100}`.padStart(2, '0') : '');

export default formatElo;
