import path from 'path';
import { execSync } from 'child_process';
import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
    // Do not run migration if there are other migrations already
    // It will not ruin the production
    const [[row]] = (await queryInterface.sequelize.query(`SELECT count(*) AS cnt FROM _migrations`)) as [
        { cnt: number },
    ][];
    if (row.cnt > 0) {
        return;
    }

    const { TL_DB_NAME, TL_DB_HOSTNAME, TL_DB_USERNAME, TL_DB_PASSWORD } = process.env;
    const dbCredentials = ` -h ${TL_DB_HOSTNAME} -u ${TL_DB_USERNAME} `;
    const dumpPath = path.join(__dirname, 'baseline.sql');

    execSync(`mysql ${dbCredentials} ${TL_DB_NAME} < ${dumpPath}`, {
        stdio: 'ignore',
        env: { ...process.env, MYSQL_PWD: TL_DB_PASSWORD },
    });
};

export const down = async () => {
    throw new Error('This migration is irreversible');
};
