import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const reports = sequelizeClient.define(
        'reports',
        {
            userId: Sequelize.INTEGER,
            commentId: Sequelize.INTEGER,
            message: Sequelize.TEXT,
        },
        {
            hooks: {
                beforeCount(options: QueryOptions) {
                    options.raw = true;
                },
            },
        }
    );

    reports.associate = function (models: any) {
        reports.belongsTo(models.users);
    };

    return reports;
}
