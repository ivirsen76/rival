import 'dotenv/config';
import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from './sequelize';

const umzug = new Umzug({
    migrations: {
        glob: 'src/db/seeders/*.ts',
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize, tableName: '_seeders' }),
    logger: console,
});

(async () => {
    await umzug.up();
    await sequelize.close();
})();
