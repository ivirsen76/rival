import { SEASON_OPTIONS } from '../../constants';

export const getSeasonName = (data) => {
    const seasonName = SEASON_OPTIONS.find((option) => option.value === data.season).label;
    return `${data.year} ${seasonName}`;
};

export const getShortSeasonName = (data) => {
    const seasonName = SEASON_OPTIONS.find((option) => option.value === data.season).label;
    return seasonName;
};

export const getSeasonTournaments = async ({ seasonId, sequelize, config }) => {
    const [[season]] = await sequelize.query(`SELECT * FROM seasons WHERE id=:seasonId`, {
        replacements: { seasonId },
    });
    const [[prevSeason]] = await sequelize.query(
        `SELECT * FROM seasons WHERE endDate<:startDate ORDER BY endDate DESC LIMIT 0, 1`,
        { replacements: { startDate: season.startDate } }
    );

    const [tournaments] = await sequelize.query(
        `SELECT t.id AS tournamentId,
                t.isFree AS isFree,
                l.id AS levelId,
                l.slug AS levelSlug,
                l.name AS levelName,
                l.type AS levelType,
                l.baseTlr AS levelBaseTlr,
                l.minTlr AS levelMinTlr,
                l.maxTlr AS levelMaxTlr
           FROM tournaments AS t
           JOIN levels AS l ON l.id=t.levelId
          WHERE t.seasonId=:seasonId
       ORDER BY l.position`,
        { replacements: { seasonId } }
    );

    const activeLevels = new Set();
    if (prevSeason) {
        const [levels] = await sequelize.query(
            `SELECT t.levelId AS id, count(*) AS playersCount
               FROM players AS p, tournaments AS t
              WHERE p.tournamentId=t.id AND t.seasonId=:seasonId
           GROUP BY t.levelId`,
            { replacements: { seasonId: prevSeason.id } }
        );
        const [levelMatches] = await sequelize.query(
            `SELECT t.levelId AS id, count(*) AS matchesCount
               FROM matches AS m, players AS p, tournaments AS t
              WHERE m.challengerId=p.id AND
                    m.score IS NOT NULL AND
                    p.tournamentId=t.id AND
                    t.seasonId=:seasonId
           GROUP BY t.levelId`,
            { replacements: { seasonId: prevSeason.id } }
        );
        const levelMatchesObj = levelMatches.reduce((obj, item) => {
            obj[item.id] = item.matchesCount;
            return obj;
        }, {});

        levels
            .filter(
                (level) =>
                    level.playersCount >= config.minPlayersForActiveLadder &&
                    levelMatchesObj[level.id] &&
                    levelMatchesObj[level.id] >= config.minMatchesForActiveLadder
            )
            .forEach((level) => {
                activeLevels.add(level.id);
            });
    }

    return tournaments.map((item) => ({
        ...item,
        isActivePlay: activeLevels.has(item.levelId),
        gender: /^Men/i.test(item.levelName) ? 'male' : /^Women/i.test(item.levelName) ? 'female' : 'mixed',
    }));
};
