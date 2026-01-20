import Sequelize from 'sequelize';

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient');
    const complaints = sequelizeClient.define(
        'complaints',
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
            },
            userId: Sequelize.INTEGER,
            opponentId: Sequelize.INTEGER,
            reason: Sequelize.STRING,
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

    // eslint-disable-next-line no-unused-vars
    complaints.associate = function (models) {
        complaints.belongsTo(models.users);
    };

    return complaints;
}
