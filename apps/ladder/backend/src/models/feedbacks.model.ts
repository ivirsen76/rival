import Sequelize from 'sequelize';

export default function (app) {
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
                beforeCount(options) {
                    options.raw = true;
                },
            },
        }
    );

    feedbacks.associate = function (models) {
        feedbacks.belongsTo(models.users);
    };

    return feedbacks;
}
