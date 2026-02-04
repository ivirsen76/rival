import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const settings = sequelizeClient.define(
        'settings',
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
            },
            changeLevelNotification: Sequelize.STRING,
            newFeedbackNotification: Sequelize.STRING,
            newComplaintNotification: Sequelize.STRING,
        },
        {
            hooks: {
                beforeCount(options: QueryOptions) {
                    options.raw = true;
                },
            },
        }
    );

    settings.associate = function (models: any) {};

    return settings;
}
