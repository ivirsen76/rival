import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const messages = sequelizeClient.define(
        'messages',
        {
            senderId: Sequelize.INTEGER,
            recipientId: Sequelize.INTEGER,
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

    messages.associate = function (models: any) {};

    return messages;
}
