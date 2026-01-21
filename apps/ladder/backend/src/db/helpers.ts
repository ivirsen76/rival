import path from 'path';
import 'dotenv/config';
import mysql from 'mysql';
import redis from 'redis';
import { execSync } from 'child_process';
import _map from 'lodash/map';
import _pick from 'lodash/pick';
import fs from 'fs';
import expect from 'expect';
import colors from 'colors/safe';
import mkdirp from 'mkdirp';
import { rimraf } from 'rimraf';

const {
    TL_DB_NAME,
    TL_DB_HOSTNAME,
    TL_DB_USERNAME,
    TL_DB_PASSWORD,
    TL_ALLOW_RESTORING_DB,
    TL_TMP_FOLDER,
    TL_ENABLE_REDIS,
    TL_REDIS_HOST,
    TL_REDIS_PORT,
} = process.env;
const expectTime = 10000; // time to wait for assertion
const retryingPause = 200; // pause between retrying

const connectionConfig = {
    host: TL_DB_HOSTNAME,
    user: TL_DB_USERNAME,
    password: TL_DB_PASSWORD,
    database: TL_DB_NAME,
    dateStrings: true,
};

const dbCredentials = ` -h ${TL_DB_HOSTNAME} -u ${TL_DB_USERNAME} `;
const dumpPath = path.join(TL_TMP_FOLDER, 'dump.sql');
const productionDumpPath = path.join(__dirname, 'production.sql');
const envPath = path.join(__dirname, '..', '..', '.env');

const throwError = (msg) => {
    console.info(colors.red(msg));
    process.exit(1);
};

const checkPermissions = () => {
    if (!TL_ALLOW_RESTORING_DB) {
        throwError('You have to have TL_ALLOW_RESTORING_DB=true in .env file\n');
    }
};

const getStringConditions = (conditions) =>
    _map(conditions, (item, key) => {
        if (key === 'sql') {
            return item;
        }

        if (item === null) {
            return `${key} IS NULL`;
        }

        return `${key}="${item}"`;
    }).join(' AND ');

export const cleanScreenshotsFolder = async () => {
    const actualFolder = path.join(__dirname, '../../screenshots/actual');
    const diffFolder = path.join(__dirname, '../../screenshots/diff');

    rimraf.sync(actualFolder);
    rimraf.sync(diffFolder);

    mkdirp.sync(diffFolder);
};

const generateDump = () => {
    const dumpDir = TL_TMP_FOLDER;

    // Make sure that dumpDir exists
    mkdirp.sync(dumpDir);

    checkPermissions();

    // Clean db
    execSync(`mysql ${dbCredentials} -e "DROP DATABASE ${TL_DB_NAME}; CREATE DATABASE ${TL_DB_NAME};"`, {
        stdio: 'ignore',
        env: { ...process.env, MYSQL_PWD: TL_DB_PASSWORD },
    });

    // Populate database
    const serverFolder = path.join(__dirname, '..', '..', 'backend');
    execSync(`cd ${serverFolder} && pnpm run migrate`);
    execSync(`cd ${serverFolder} && pnpm run seed`);

    // Check mysqldump version
    const version = execSync('mysqldump --version').toString();
    const is57 = /5\.7\./.test(version);
    const param = is57 ? '' : '--column-statistics=0';

    const dump = execSync(`mysqldump ${dbCredentials} ${TL_DB_NAME} --skip-comments --extended-insert=false ${param}`, {
        env: { ...process.env, MYSQL_PWD: TL_DB_PASSWORD },
    }).toString();

    fs.writeFileSync(dumpPath, 'SET FOREIGN_KEY_CHECKS=0;\n' + dump + '\nSET FOREIGN_KEY_CHECKS=1;');
};

const needNewDump = () => {
    if (!fs.existsSync(dumpPath)) {
        return true;
    }

    const getMaxModifiedTime = (dir) =>
        fs.readdirSync(dir).reduce((max, file) => {
            const name = path.join(dir, file);

            const stat = fs.statSync(name);
            const isDirectory = stat.isDirectory();

            return isDirectory ? Math.max(max, getMaxModifiedTime(name)) : Math.max(max, stat.mtimeMs);
        }, 0);

    const migrationsModifiedTime = getMaxModifiedTime(
        path.join(__dirname, '..', '..', 'backend', 'src', 'db', 'migrations')
    );
    const envModifiedTime = fs.existsSync(envPath) ? fs.statSync(envPath).mtimeMs : 0;
    const dumpModifiedTime = fs.statSync(dumpPath).mtimeMs;
    const timeOneHourAgo = Number(new Date()) - 3600 * 1000;

    // new dump if files are changed or it's been at least one hour since last dump creation
    return (
        dumpModifiedTime < migrationsModifiedTime ||
        dumpModifiedTime < envModifiedTime ||
        dumpModifiedTime < timeOneHourAgo
    );
};

export const restoreDb = () => {
    checkPermissions();

    if (TL_ENABLE_REDIS) {
        const client = redis.createClient({
            host: TL_REDIS_HOST,
            port: TL_REDIS_PORT,
        });
        if (client) {
            client.flushall();
            client.quit();
        }
    }

    if (needNewDump()) {
        generateDump();
    }

    if (!fs.existsSync(dumpPath)) {
        throwError(`File "${dumpPath}" doesn't exist\n`);
    }

    // Clean db
    execSync(`mysql ${dbCredentials} -e "DROP DATABASE ${TL_DB_NAME}; CREATE DATABASE ${TL_DB_NAME};"`, {
        stdio: 'ignore',
        env: { ...process.env, MYSQL_PWD: TL_DB_PASSWORD },
    });

    execSync(`mysql ${dbCredentials} ${TL_DB_NAME} < ${dumpPath}`, {
        stdio: 'ignore',
        env: { ...process.env, MYSQL_PWD: TL_DB_PASSWORD },
    });
};

export const cleanRedisCache = () => {
    checkPermissions();

    if (TL_ENABLE_REDIS) {
        const client = redis.createClient({
            host: TL_REDIS_HOST,
            port: TL_REDIS_PORT,
        });
        if (client) {
            client.flushall();
            client.quit();
        }
    }
};

export const restoreProductionDb = () => {
    checkPermissions();

    if (TL_ENABLE_REDIS) {
        const client = redis.createClient({
            host: TL_REDIS_HOST,
            port: TL_REDIS_PORT,
        });
        if (client) {
            client.flushall();
            client.quit();
        }
    }

    if (!fs.existsSync(productionDumpPath)) {
        throwError(`File "${productionDumpPath}" doesn't exist\n`);
    }

    // Clean db
    execSync(`mysql ${dbCredentials} -e "DROP DATABASE ${TL_DB_NAME}; CREATE DATABASE ${TL_DB_NAME};"`, {
        stdio: 'ignore',
        env: { ...process.env, MYSQL_PWD: TL_DB_PASSWORD },
    });

    execSync(`mysql ${dbCredentials} ${TL_DB_NAME} < ${productionDumpPath}`, {
        stdio: 'ignore',
        env: { ...process.env, MYSQL_PWD: TL_DB_PASSWORD },
    });
};

export const getNumRecords = (table, conditions?) => {
    checkPermissions();

    const where = conditions ? 'WHERE ' + getStringConditions(conditions) : '';
    const query = `SELECT count(*) AS cnt FROM ${table} ${where}`;

    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection(connectionConfig);
        connection.connect();
        connection.query(query, (error, results, fields) => {
            connection.end();
            if (error) {
                reject(new Error(error.message));
            } else {
                resolve(results[0].cnt);
            }
        });
    });
};

export const runQuery = (query) => {
    checkPermissions();

    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection(connectionConfig);
        connection.connect();
        connection.query(query, (error, results, fields) => {
            connection.end();
            resolve(results);
        });
    });
};

export const getRecord = (table, conditions) => {
    checkPermissions();

    const where = conditions ? 'WHERE ' + getStringConditions(conditions) : '';
    const query = `SELECT * FROM ${table} ${where} LIMIT 0, 1`;

    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection(connectionConfig);
        connection.connect();
        connection.query(query, (error, results, fields) => {
            connection.end();
            if (error) {
                reject(error);
            } else {
                resolve(results[0]);
            }
        });
    });
};

export const expectRecordToExist = async (table, conditions, data?) => {
    checkPermissions();

    const before = Date.now();

    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            const record = await getRecord(table, conditions);
            if (!record) {
                throw new Error(`The record in table "${table}" is not found`);
            }

            if (data) {
                try {
                    expect(_pick(record, Object.keys(data))).toEqual(data);
                } catch (error) {
                    throw new Error(`The record in table "${table}" has different data\n\n` + error.message);
                }
            }

            return record;
        } catch (error) {
            if (Date.now() - before > expectTime) {
                throw error;
            }

            // wait a bit
            await new Promise((resolve) => setTimeout(resolve, retryingPause));
        }
    }
};

export const expectNumRecords = async (table, conditions, num) => {
    checkPermissions();

    const before = Date.now();

    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            const result = await getNumRecords(table, conditions);
            if (result !== num) {
                throw new Error(`Expected record num ${num} don't equals the actual ${result}`);
            }

            return;
        } catch (error) {
            if (Date.now() - before > expectTime) {
                throw error;
            }

            // wait a bit
            await new Promise((resolve) => setTimeout(resolve, retryingPause));
        }
    }
};

export const overrideConfig = async (values) => {
    await runQuery(`UPDATE config SET override='${JSON.stringify(values)}'`);
};
