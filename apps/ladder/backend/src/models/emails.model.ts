import Sequelize from 'sequelize';

export default function (app) {
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
                beforeCount(options) {
                    options.raw = true;
                },
            },
        }
    );

    emails.associate = function (models) {};

    return emails;
}
