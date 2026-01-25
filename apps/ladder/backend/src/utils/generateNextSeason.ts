import type { Application } from '@feathersjs/feathers';
import dayjs from './dayjs';
import getCombinedConfig from './getCombinedConfig';

export default async (app: Application) => {
    const sequelize = app.get('sequelizeClient');

    // Check config to see if it's not Raleigh
    const config = await getCombinedConfig();
    if (!config.canRegister || config.url === 'demo') {
        return;
    }

    type Season = { name: string; date: string };

    const BREAK_DURATION_IN_WEEKS = 3;
    const WEEKS_TILL_NEXT_SEASON = config.registrationAheadWeeks + BREAK_DURATION_IN_WEEKS + 0.5;
    const seasons: Season[] = [
        { name: 'spring', date: '03-27' },
        { name: 'summer', date: '06-26' },
        { name: 'fall', date: '09-25' },
        { name: 'winter', date: '12-25' },
    ];

    // get next season startDate
    const currentDate = dayjs.tz();
    const currentYear = Number(currentDate.format('YYYY'));
    let startDate;
    let nextSeason;
    {
        for (const season of seasons) {
            const date = dayjs.tz(`${currentYear}-${season.date}`).isoWeekday(1);
            const diff = date.diff(currentDate, 'week', true);

            if (diff < 0) {
                continue;
            }
            if (diff > WEEKS_TILL_NEXT_SEASON) {
                break;
            }

            startDate = date;
            nextSeason = season;
            break;
        }
    }

    if (!startDate) {
        // next season is not soon
        return;
    }

    // get the latest season
    const [[latestSeason]] = await sequelize.query(`SELECT * FROM seasons ORDER BY startDate DESC LIMIT 0, 1`);
    if (latestSeason && dayjs.tz(latestSeason.endDate).isAfter(startDate)) {
        // we already have next season
        return;
    }

    // get next season levels
    let levels;
    if (latestSeason) {
        const [rows] = (await sequelize.query(
            `SELECT levelId AS id
               FROM tournaments
               WHERE seasonId=:seasonId`,
            { replacements: { seasonId: latestSeason.id } }
        )) as [{ id: number }[]];
        levels = rows.map((row) => row.id);
    } else {
        const [rows] = (await sequelize.query(`SELECT id FROM levels`)) as [{ id: number }[]];
        levels = rows.map((row) => row.id);
    }

    // creating next season
    const index = seasons.indexOf(nextSeason!);
    const nextIndex = (index + 1) % seasons.length;
    const weeks =
        Math.round(
            dayjs
                .tz(`${nextIndex === 0 ? currentYear + 1 : currentYear}-${seasons[nextIndex].date}`)
                .isoWeekday(1)
                .diff(startDate, 'week', true)
        ) - BREAK_DURATION_IN_WEEKS;

    app.service('api/seasons').create({
        year: currentYear,
        season: nextSeason!.name,
        startDate: startDate.format('YYYY-MM-DD'),
        weeks,
        levels,
        isFree: latestSeason ? latestSeason.isFree : 1,
    });
};
