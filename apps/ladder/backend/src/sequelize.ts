import Sequelize from 'sequelize';
import { mysqlOptions } from './config';

export default function (app) {
    const connectionString = app.get('mysql');
    const sequelize = new Sequelize(connectionString, mysqlOptions);
    const oldSetup = app.setup;

    app.set('sequelizeClient', sequelize);

    app.setup = function (...args) {
        const result = oldSetup.apply(this, args);

        // Set up data relationships
        const models = sequelize.models;
        Object.keys(models).forEach(name => {
            if ('associate' in models[name]) {
                models[name].associate(models);
            }
        });

        return result;
    };
}
