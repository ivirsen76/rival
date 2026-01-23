import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const feedbacks = sequelizeClient.define(
        'feedbacks',
        {
            userId: Sequelize.INTEGER,
            type: Sequelize.STRING,
            description: Sequelize.TEXT,
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
    feedbacks.associate = function (models: any) {
        feedbacks.belongsTo(models.users);
    };

    return feedbacks;
}
