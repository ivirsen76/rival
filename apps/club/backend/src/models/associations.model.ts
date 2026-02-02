import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const associations = sequelizeClient.define(
        'associations',
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
            },
            name: Sequelize.STRING,
            slug: Sequelize.STRING,
        },
        {
            hooks: {
                beforeCount(options: QueryOptions) {
                    options.raw = true;
                },
            },
        }
    );

    return associations;
}
