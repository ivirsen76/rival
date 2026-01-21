import 'dotenv/config';
import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from './sequelize';

const umzug = new Umzug({
    migrations: {
        glob: 'dist/db/migrations/*.js',
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize, tableName: '_migrations' }),
    logger: console,
});

(async () => {
    const cmd = process.argv[2];
    if (cmd === 'down') {
        await umzug.down();
    } else {
        await umzug.up();
    }

    await sequelize.close();
})();
