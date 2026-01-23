import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const emails = sequelizeClient.define(
        'emails',
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
            },
            from: Sequelize.STRING,
            to: Sequelize.TEXT,
            cc: Sequelize.TEXT,
            bcc: Sequelize.TEXT,
            subject: Sequelize.STRING,
            text: Sequelize.TEXT,
            html: Sequelize.TEXT,
            replyTo: Sequelize.STRING,
            recipientEmail: Sequelize.TEXT,
            variables: Sequelize.TEXT,
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
    emails.associate = function (models: any) {};

    return emails;
}
