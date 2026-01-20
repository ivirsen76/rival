import Sequelize from 'sequelize';

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient');
    const tournaments = sequelizeClient.define(
        'tournaments',
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
            },
            seasonId: Sequelize.INTEGER,
            levelId: Sequelize.INTEGER,
            botPrediction: Sequelize.TEXT,
            predictionWinner: Sequelize.INTEGER,
            predictionWonAt: Sequelize.DATE,
            isFree: Sequelize.INTEGER,
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
    tournaments.associate = function (models) {
        tournaments.belongsTo(models.levels);
        tournaments.belongsTo(models.seasons);
        tournaments.belongsToMany(models.users, {
            through: 'players',
        });
    };

    return tournaments;
}
