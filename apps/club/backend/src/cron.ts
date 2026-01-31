import type { Application } from '@feathersjs/feathers';
import cron from 'node-cron';
import seedrandom from 'seedrandom';
import removeUnverifiedAccounts from './utils/removeUnverifiedAccounts';
import generateNextSeason from './utils/generateNextSeason';
import removeOldEmails from './utils/removeOldEmails';
import runActions from './utils/runActions';
import refundForCanceledTournaments from './utils/refundForCanceledTournaments';
import getWeatherForecast from './utils/getWeatherForecast';
import generateNews from './services/news/generateNews';
import { applyNewBadges } from './utils/applyNewBadges';
import remindAboutLastOpenSlot from './utils/remindAboutLastOpenSlot';
import sendProposalEmails from './utils/sendProposalEmails';

type Task = () => void;

export default (app: Application) => {
    // use TL_DB_NAME to set the starting random point
    const random = seedrandom(process.env.TL_DB_NAME);
    const sequelize = app.get('sequelizeClient');

    // to be between 4am and 6am
    const scheduleNightTask = (task: Task) => {
        const minute = Math.floor(random() * 60);
        const hour = 4 + Math.floor(random() * 2);
        const schedule = `${minute} ${hour} * * *`;

        cron.schedule(schedule, task, { timezone: process.env.TL_TIMEZONE });
    };

    // to be between 7am and 9am
    const scheduleMorningTask = (task: Task) => {
        const minute = Math.floor(random() * 60);
        const hour = 7 + Math.floor(random() * 2);
        const schedule = `${minute} ${hour} * * *`;

        cron.schedule(schedule, task, { timezone: process.env.TL_TIMEZONE });
    };

    const schedule3HourTask = (task: Task) => {
        const minute = Math.floor(random() * 60);
        const schedule = `${minute} */3 * * *`;

        cron.schedule(schedule, task, { timezone: process.env.TL_TIMEZONE });
    };

    const schedule2MinuteTask = (task: Task) => {
        const schedule = `*/2 * * * *`;

        cron.schedule(schedule, task, { timezone: process.env.TL_TIMEZONE });
    };

    // Night tasks
    scheduleNightTask(() => removeUnverifiedAccounts(app));
    scheduleNightTask(() => generateNextSeason(app));
    scheduleNightTask(() => removeOldEmails(app));
    scheduleNightTask(() => generateNews());
    scheduleNightTask(() => applyNewBadges(sequelize));

    // Morning tasks
    scheduleMorningTask(() => runActions(app));
    scheduleMorningTask(() => refundForCanceledTournaments(app));

    // Every 3 hours
    schedule3HourTask(() => getWeatherForecast(app));
    schedule3HourTask(() => remindAboutLastOpenSlot(app));

    // Every 2 minutes
    schedule2MinuteTask(() => sendProposalEmails(app));
};
