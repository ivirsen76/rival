// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const orders = sequelizeClient.define(
        'orders',
        {
            userId: Sequelize.INTEGER,
            amount: Sequelize.INTEGER,
            payload: Sequelize.TEXT,
            sessionId: Sequelize.STRING,
            processedAt: Sequelize.DATE,
        },
        {
            hooks: {
                beforeCount(options: QueryOptions) {
                    options.raw = true;
                },
            },
        }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orders.associate = function (models: any) {
        orders.belongsTo(models.users);
    };

    return orders;
}
