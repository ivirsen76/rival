import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const payments = sequelizeClient.define(
        'payments',
        {
            userId: Sequelize.INTEGER,
            type: Sequelize.STRING,
            description: Sequelize.STRING,
            amount: Sequelize.INTEGER,
            orderId: Sequelize.INTEGER,
            refundForPaymentId: Sequelize.INTEGER,
            tournamentId: Sequelize.INTEGER,
            badgeId: Sequelize.INTEGER,
        },
        {
            hooks: {
                beforeCount(options: QueryOptions) {
                    options.raw = true;
                },
            },
        }
    );

    payments.associate = function (models: any) {
        payments.belongsTo(models.users);
    };

    return payments;
}
