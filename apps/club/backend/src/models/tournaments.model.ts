import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
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
        },
        {
            hooks: {
                beforeCount(options: QueryOptions) {
                    options.raw = true;
                },
            },
        }
    );

    // eslint-disable-next-line no-unused-vars

    tournaments.associate = function (models: any) {
        tournaments.belongsTo(models.levels);
        tournaments.belongsTo(models.seasons);
        tournaments.belongsToMany(models.users, {
            through: 'players',
        });
    };

    return tournaments;
}
