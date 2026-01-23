import type { Sequelize } from 'sequelize';
import type { Application } from '@feathersjs/feathers';
import dayjs from './dayjs';
import logger from '@rival-tennis-ladder/logger';
import refundPaymentForTournamentTemplate from '../emailTemplates/refundPaymentForTournament';
import staticConfig from '../config';
import getCombinedConfig from './getCombinedConfig';
import { getPlayerName } from '../services/users/helpers';

// Helpers
const getConfig = async () => {
    const config = await getCombinedConfig();
    return { ...staticConfig, ...config };
};

const getSeasonLevels = async (sequelize: Sequelize, seasonId: number) => {
    const [levels] = await sequelize.query(
        `
        SELECT l.id, l.slug, l.name, l.type
          FROM tournaments AS t, levels AS l
         WHERE t.levelId=l.id AND t.seasonId=:seasonId
      ORDER BY l.position`,
        { replacements: { seasonId } }
    );

    return levels;
};

export default async (app: Application) => {
    const sequelize = app.get('sequelizeClient');
    const { payments } = sequelize.models;

    const config = await getConfig();
    const { tournamentReminderWeeks } = config;

    // Get current season
    const currentDate = dayjs.tz();
    const [seasons] = await sequelize.query(
        `SELECT * FROM seasons WHERE startDate<:date ORDER BY startDate DESC LIMIT 0, 1`,
        {
            replacements: { date: currentDate.format('YYYY-MM-DD HH:mm:ss') },
        }
    );
    const currentSeason = seasons[0];
    if (!currentSeason) {
        return;
    }
    const diff = dayjs.tz(currentSeason.endDate).diff(currentDate, 'week', true);
    if (diff > tournamentReminderWeeks || diff < -1) {
        return;
    }

    const levels = await getSeasonLevels(sequelize, currentSeason.id);

    let count = 0;
    for (const level of levels) {
        const tournamentInfo = await app
            .service('api/tournaments')
            .get(1, { query: { year: currentSeason.year, season: currentSeason.season, level: level.slug } });

        // Skip if tournament is not canceled
        if (!tournamentInfo.data.cancelFinalTournament) {
            continue;
        }

        const tournamentId = tournamentInfo.data.id;

        // Get all payments
        const [list] = await sequelize.query(
            `SELECT p.*,
                    u.firstName,
                    u.lastName,
                    u.email
               FROM payments AS p
               JOIN users AS u ON p.userId=u.id
              WHERE p.tournamentId=:tournamentId AND
                    p.id NOT IN (SELECT refundForPaymentId FROM payments WHERE refundForPaymentId IS NOT NULL)`,
            { replacements: { tournamentId } }
        );

        for (const payment of list) {
            await payments.create({
                userId: payment.userId,
                type: 'refund',
                description: `Credit for ${payment.description}`,
                amount: -1 * payment.amount,
                refundForPaymentId: payment.id,
            });

            // We don't have to wait for the email sent
            const fullName = getPlayerName(payment);
            const emails = [{ name: fullName, email: payment.email }];
            const creditAmount = -1 * payment.amount;
            app.service('api/emails').create({
                to: emails,
                subject: `You've Been Given $${creditAmount / 100} in Rival Credit!`,
                html: refundPaymentForTournamentTemplate({
                    config,
                    levelName: level.name,
                    seasonName: tournamentInfo.data.season,
                    cancelCode: tournamentInfo.data.cancelFinalTournamentCode,
                    creditAmount,
                }),
                priority: 2,
            });

            count++;
        }
    }

    if (count > 0) {
        logger.info(`Refund was issued for ${count} payments`);
    }
};
