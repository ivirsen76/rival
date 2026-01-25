import Sequelize from 'sequelize';
import { mysqlOptions } from './config';
import type { Application } from '@feathersjs/feathers';

export default function (app: Application) {
    const connectionString = app.get('mysql');
    // @ts-expect-error - I guess Sequelize version is different
    const sequelize = new Sequelize(connectionString, mysqlOptions);
    const oldSetup = app.setup;

    app.set('sequelizeClient', sequelize);

    app.setup = function (...args) {
        const result = oldSetup.apply(this, args);

        // Set up data relationships
        const models = sequelize.models;
        Object.keys(models).forEach((name) => {
            if ('associate' in models[name]) {
                models[name].associate(models);
            }
        });

        return result;
    };
}
