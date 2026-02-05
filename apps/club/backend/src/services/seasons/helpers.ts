import type { Sequelize } from 'sequelize';
import { SEASON_OPTIONS } from '../../constants';
import type { Config, Season } from '../../types';

export const getSeasonName = (data: Season) => {
    const seasonName = SEASON_OPTIONS.find((option) => option.value === data.season)!.label;
    return `${data.year} ${seasonName}`;
};

export const getShortSeasonName = (data: Season) => {
    const seasonName = SEASON_OPTIONS.find((option) => option.value === data.season)!.label;
    return seasonName;
};

export const getSeasonTournaments = async ({
    seasonId,
    sequelize,
    config,
}: {
    seasonId: number;
    sequelize: Sequelize;
    config: Config;
}) => {
    const [[season]] = (await sequelize.query(`SELECT * FROM seasons WHERE id=:seasonId`, {
        replacements: { seasonId },
    })) as [Season][];
    const [[prevSeason]] = (await sequelize.query(
        `SELECT * FROM seasons WHERE endDate<:startDate ORDER BY endDate DESC LIMIT 0, 1`,
        { replacements: { startDate: season.startDate } }
    )) as [Season][];

    const [tournaments] = await sequelize.query(
        `SELECT t.id AS tournamentId,
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
        const [levelMatches] = (await sequelize.query(
            `SELECT t.levelId AS id, count(*) AS matchesCount
               FROM matches AS m, players AS p, tournaments AS t
              WHERE m.challengerId=p.id AND
                    m.score IS NOT NULL AND
                    p.tournamentId=t.id AND
                    t.seasonId=:seasonId
           GROUP BY t.levelId`,
            { replacements: { seasonId: prevSeason.id } }
        )) as any;
        const levelMatchesObj = levelMatches.reduce((obj: any, item: any) => {
            obj[item.id] = item.matchesCount;
            return obj;
        }, {});

        levels
            .filter(
                (level: any) =>
                    level.playersCount >= config.minPlayersForActiveLadder &&
                    levelMatchesObj[level.id] &&
                    levelMatchesObj[level.id] >= config.minMatchesForActiveLadder
            )
            .forEach((level: any) => {
                activeLevels.add(level.id);
            });
    }

    return tournaments.map((item: any) => ({
        ...item,
        isActivePlay: activeLevels.has(item.levelId),
        gender: /^Men/i.test(item.levelName) ? 'male' : /^Women/i.test(item.levelName) ? 'female' : 'mixed',
    }));
};
