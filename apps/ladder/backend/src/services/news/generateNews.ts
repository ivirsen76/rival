import _capitalize from 'lodash/capitalize';
import formatNumber from '../../utils/formatNumber';
import { getStatsMatches } from '../../utils/sqlConditions';
import getCombinedConfig from '../../utils/getCombinedConfig';
import { getPlayerName } from '../users/helpers';
import dayjs from '../../utils/dayjs';
import { runQuery, closeConnection } from '../../db/connection';
import type { User } from '../../types';

const generateNews = async () => {
    const currentDate = dayjs.tz();

    const config = await getCombinedConfig();
    if (config.url === 'demo') {
        return;
    }

    const seasons = await runQuery(`SELECT * FROM seasons WHERE startDate<?`, [
        currentDate.format('YYYY-MM-DD HH:mm:ss'),
    ]);

    const [firstSeason] = await runQuery(`SELECT * FROM seasons ORDER BY startDate LIMIT 0, 1`);

    const currentNews = await runQuery('SELECT id FROM news');
    if (currentNews.length === 0 && firstSeason) {
        // Add first news about creating the ladder
        const date = currentDate.hour(12).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss');
        const startDate = dayjs.tz(firstSeason.startDate).format('MMMM D');
        const seasonName = `${firstSeason.year} ${_capitalize(firstSeason.season)}`;

        const content = `<div><p>Great news! Rival Tennis Ladder is coming to the ${config.city} area! Sign up today to participate in your local ladder for the ${seasonName} season beginning on ${startDate}.</p><p>The first season is free for everyone! Register today to start playing!</p></div>`;
        await runQuery(`INSERT INTO news (date, content, isManual) VALUES (?, ?, 1)`, [date, content]);
    }

    await runQuery(`DELETE FROM news WHERE isManual=0`);

    for (const season of seasons) {
        const seasonName = `${season.year} ${_capitalize(season.season)}`;

        // The season start
        {
            const content = `<div>The season <b>${seasonName}</b> has started.</div>`;
            const date = dayjs.tz(season.startDate).hour(12).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`INSERT INTO news (date, content) VALUES (?, ?)`, [date, content]);
        }

        // Don't show the result if season is not over yet
        if (dayjs.tz(season.endDate).isAfter(currentDate)) {
            continue;
        }

        const [counts] = await runQuery(`
            SELECT COUNT(DISTINCT p.userId) AS totalPlayers,
                   COUNT(m.id) AS totalMatches
              FROM tournaments AS t
         LEFT JOIN players AS p ON p.tournamentId=t.id
         LEFT JOIN matches AS m ON m.challengerId=p.id AND ${getStatsMatches('m')}
             WHERE t.seasonId=${season.id}
        `);

        let winners = '';
        {
            const captains = await runQuery(`
                SELECT p.id, p.teamName
                  FROM players AS p
                  JOIN tournaments AS t ON p.tournamentId=t.id
                  JOIN levels AS l ON t.levelId=l.id
                 WHERE p.partnerId IS NULL AND
                       p.teamName IS NOT NULL AND
                       t.seasonId=${season.id} AND
                       l.type="doubles-team"`);
            const teamNames = captains.reduce((obj, item) => {
                obj[item.id] = item.teamName;
                return obj;
            }, {});

            type Winner = User & {
                id: number;
                partnerId: number;
                levelPosition: number;
                levelType: string;
                levelSlug: string;
                levelName: string;
            };

            const matches = (await runQuery(`
                SELECT p.id,
                       p.partnerId,
                       u.firstName,
                       u.lastName,
                       l.name AS levelName,
                       l.slug AS levelSlug,
                       l.type AS levelType,
                       l.position AS levelPosition
                  FROM matches AS m
                  JOIN players AS p ON m.winner=p.id
                  JOIN users AS u ON p.userId=u.id
                  JOIN tournaments AS t ON p.tournamentId=t.id
                  JOIN levels AS l ON t.levelId=l.id
                 WHERE t.seasonId=${season.id} AND m.score IS NOT NULL AND m.finalSpot=1 AND m.battleId IS NULL`)) as Winner[];

            const doublesmatches = (await runQuery(`
                SELECT u.firstName,
                       u.lastName,
                       l.name AS levelName,
                       l.slug AS levelSlug,
                       l.type AS levelType,
                       l.position AS levelPosition
                  FROM doublesmatches AS dm
                  JOIN players AS p ON dm.winner=p.id
                  JOIN users AS u ON p.userId=u.id
                  JOIN tournaments AS t ON p.tournamentId=t.id
                  JOIN levels AS l ON t.levelId=l.id
                 WHERE t.seasonId=${season.id} AND dm.score1 IS NOT NULL AND dm.finalSpot=1`)) as Winner[];

            winners = [...matches, ...doublesmatches]
                .sort((a, b) => a.levelPosition - b.levelPosition)
                .map((match) => {
                    const winner = (() => {
                        if (match.levelType === 'doubles-team') {
                            const captainPlayerId = match.partnerId || match.id;
                            const teamName = teamNames[captainPlayerId];
                            return teamName || getPlayerName(match);
                        }

                        return getPlayerName(match);
                    })();

                    return `<div><a href="/season/${season.year}/${season.season}/${match.levelSlug}">${match.levelName}</a>: <span class="fw-semibold ms-1">${winner}</span></div>`;
                })
                .join('\n');
        }

        // The season result
        {
            const content = `
                The season <b>${seasonName}</b> is over!<br>
                <b>${counts.totalPlayers}</b> players played <b>${formatNumber(counts.totalMatches)}</b> matches.
                ${winners ? `<p>Congratulations to the winners:</p>${winners}` : ''}`;

            const date = dayjs
                .tz(season.endDate)
                .add(1, 'day')
                .hour(12)
                .minute(0)
                .second(0)
                .format('YYYY-MM-DD HH:mm:ss');

            await runQuery(`INSERT INTO news (date, content) VALUES (?, ?)`, [date, content]);
        }
    }

    closeConnection();
};

export default generateNews;
