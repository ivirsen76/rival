import dayjs from './dayjs';
import logger from '@rival-tennis-ladder/logger';

export default async (app) => {
    const sequelize = app.get('sequelizeClient');
    const dateMonthAgo = dayjs.tz().subtract(1, 'month').format('YYYY-MM-DD HH:mm:ss');

    const [result] = await sequelize.query(`DELETE FROM emails WHERE createdAt<:date`, {
        replacements: { date: dateMonthAgo },
    });

    logger.info(`Removed old emails: ${result.affectedRows}`);
};
