import Sequelize from 'sequelize';

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient');
    const settings = sequelizeClient.define(
        'settings',
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
            },
            signUpNotification: Sequelize.STRING,
            changeLevelNotification: Sequelize.STRING,
            newFeedbackNotification: Sequelize.STRING,
            newComplaintNotification: Sequelize.STRING,
        },
        {
            hooks: {
                beforeCount(options) {
                    options.raw = true;
                },
            },
        }
    );

    settings.associate = function (models) {};

    return settings;
}
