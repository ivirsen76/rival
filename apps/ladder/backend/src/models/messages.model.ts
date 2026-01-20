import Sequelize from 'sequelize';

export default function (app) {
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
                beforeCount(options) {
                    options.raw = true;
                },
            },
        }
    );

    messages.associate = function (models) {};

    return messages;
}
