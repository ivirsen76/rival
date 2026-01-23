// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const news = sequelizeClient.define(
        'news',
        {
            date: Sequelize.DATE,
            content: Sequelize.TEXT,
            isManual: Sequelize.BOOLEAN,
        },
        {
            hooks: {
                beforeCount(options: QueryOptions) {
                    options.raw = true;
                },
            },
        }
    );

    return news;
}
