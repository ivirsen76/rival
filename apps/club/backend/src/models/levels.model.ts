import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const levels = sequelizeClient.define(
        'levels',
        {
            name: Sequelize.STRING,
            type: Sequelize.STRING,
            slug: Sequelize.STRING,
            isActive: Sequelize.BOOLEAN,
            position: Sequelize.INTEGER,
            baseTlr: Sequelize.INTEGER,
            minTlr: Sequelize.INTEGER,
            maxTlr: Sequelize.INTEGER,
        },
        {
            hooks: {
                beforeCount(options: QueryOptions) {
                    options.raw = true;
                },
            },
        }
    );

    levels.associate = function (models: any) {
        levels.belongsToMany(models.seasons, {
            through: 'tournaments',
        });
    };

    return levels;
}
