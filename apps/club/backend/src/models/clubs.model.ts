import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const clubs = sequelizeClient.define(
        'clubs',
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
            },
            associationId: Sequelize.INTEGER,
            name: Sequelize.STRING,
            slug: Sequelize.STRING,
            url: Sequelize.STRING,
        },
        {
            hooks: {
                beforeCount(options: QueryOptions) {
                    options.raw = true;
                },
            },
        }
    );

    return clubs;
}
