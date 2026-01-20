import dayjs from './dayjs';
import getCombinedConfig from './getCombinedConfig';

export default async (app) => {
    if (process.env.TL_ENV === 'production') {
        return;
    }

    const sequelize = app.get('sequelizeClient');

    // Check config to see if it's not Demo site
    const config = await getCombinedConfig();
    if (config.url !== 'demo') {
        return;
    }

    const [[lastSeason]] = await sequelize.query('SELECT * FROM seasons ORDER BY startDate DESC LIMIT 0, 1');
    const currentDate = dayjs.tz();

    // clean tables
    {
        const tables = [
            'userrelations',
            'payments',
            'orders',
            'messages',
            'logs',
            'feedbacks',
            'emails',
            'complaints',
            'coaches',
            'actions',
        ];

        for (const table of tables) {
            await sequelize.query(`DELETE FROM ${table}`);
        }
    }

    // update season settings
    {
        let year = currentDate.tz().year();
        const month = currentDate.tz().month() + 1;
        const season = (() => {
            if (month > 10) {
                return 'winter';
            }
            if (month > 7) {
                return 'fall';
            }
            if (month > 4) {
                return 'summer';
            }
            if (month > 1) {
                return 'spring';
            }

            year--;
            return 'winter';
        })();
        const startDate = currentDate.subtract(1, 'week').isoWeekday(1).hour(0).minute(0).second(0);
        const endDate = startDate.add(10, 'week');

        await sequelize.query(`UPDATE seasons
            SET year=${year},
                season="${season}",
                startDate="${startDate.format('YYYY-MM-DD HH:mm:ss')}",
                endDate="${endDate.format('YYYY-MM-DD HH:mm:ss')}"
          WHERE id=${lastSeason.id}`);
    }

    // delete new matches
    {
        const date = '2024-11-28 00:00:00';
        await sequelize.query(`DELETE FROM matches WHERE createdAt>"${date}"`);
    }

    const [levels] = await sequelize.query(`SELECT l.*, t.id AS tournamentId
        FROM levels AS l,
             tournaments AS t
       WHERE t.levelId=l.id AND
             t.seasonId=${lastSeason.id}`);

    for (const level of levels) {
        // move proposals
        const numberOfProposals = 2 + Math.ceil(Math.random() * 3);
        const [proposals] = await sequelize.query(`SELECT m.id, m.playedAt
                FROM matches AS m,
                    players AS p 
            WHERE m.challengerId=p.id AND
                    p.tournamentId=${level.tournamentId} AND
                    m.acceptedAt IS NULL
            ORDER BY playedAt DESC
             LIMIT 0, ${numberOfProposals}`);

        for (const proposal of proposals) {
            const date =
                currentDate.add(1 + Math.ceil(Math.random() * 7), 'day').format('YYYY-MM-DD') +
                proposal.playedAt.slice(10);
            await sequelize.query(`UPDATE matches SET playedAt="${date}" WHERE id=${proposal.id}`);
        }

        const day = currentDate.format('YYYY-MM-DD');

        // set today's planned matches
        const numberOfPlannedMatches = 1 + Math.ceil(Math.random() * 3);
        const [plannedMatches] = await sequelize.query(`SELECT m.id, m.playedAt
                FROM matches AS m,
                     players AS p 
               WHERE m.challengerId=p.id AND
                     p.tournamentId=${level.tournamentId} AND
                     m.score IS NULL AND
                     m.acceptedAt IS NOT NULL
            ORDER BY playedAt DESC
               LIMIT 0, ${numberOfPlannedMatches}`);

        for (const match of plannedMatches) {
            const date = day + match.playedAt.slice(10);
            await sequelize.query(`UPDATE matches SET playedAt="${date}" WHERE id=${match.id}`);
        }

        // set today's finished matches
        const numberOfMatches = 1 + Math.ceil(Math.random() * 3);
        const [matches] = await sequelize.query(`SELECT m.id, m.playedAt
                FROM matches AS m,
                     players AS p 
               WHERE m.challengerId=p.id AND
                     p.tournamentId=${level.tournamentId} AND
                     m.score IS NOT NULL
            ORDER BY playedAt DESC
               LIMIT 0, ${numberOfMatches}`);

        for (const match of matches) {
            const date = day + match.playedAt.slice(10);
            await sequelize.query(`UPDATE matches SET playedAt="${date}" WHERE id=${match.id}`);
        }
    }
};
