import Sequelize from 'sequelize';

export default function (app) {
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
                beforeCount(options) {
                    options.raw = true;
                },
            },
        }
    );

    reports.associate = function (models) {
        reports.belongsTo(models.users);
    };

    return reports;
}
