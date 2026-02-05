import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const seasons = sequelizeClient.define(
        'seasons',
        {
            year: Sequelize.INTEGER,
            season: Sequelize.STRING,
            startDate: Sequelize.DATE,
            endDate: Sequelize.DATE,
            hasFinalTournament: Sequelize.BOOLEAN,
            closeReason: Sequelize.STRING,
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

    seasons.associate = function (models: any) {
        seasons.belongsToMany(models.levels, {
            through: 'tournaments',
        });
    };

    return seasons;
}
