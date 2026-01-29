import type { Application } from '@feathersjs/feathers';
import dayjs from '@rival/dayjs';
import logger from '@rival-tennis-ladder/logger';

export default async (app: Application) => {
    const sequelize = app.get('sequelizeClient');
    const dateWeekAgo = dayjs.tz().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');

    const [result] = await sequelize.query(
        `DELETE FROM users
               WHERE isVerified=0 AND createdAt<:date`,
        { replacements: { date: dateWeekAgo } }
    );

    logger.info(`Removed unverified accounts: ${result.affectedRows}`);
};
