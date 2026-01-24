import path from 'path';
import dotenv from 'dotenv';
// @ts-expect-error - no types for redis
import redis from 'redis';
import { execSync } from 'child_process';
import _pick from 'lodash/pick';
import fs from 'fs';
import expect from 'expect';
import colors from 'colors/safe';
import mkdirp from 'mkdirp';
import { rimraf } from 'rimraf';
import { runQueryAndClose } from './connection';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

type KeyValue = Record<string, string | number | null>;

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

const dbCredentials = ` -h ${TL_DB_HOSTNAME} -u ${TL_DB_USERNAME} `;
const dumpPath = path.join(TL_TMP_FOLDER!, 'dump.sql');
const productionDumpPath = path.join(__dirname, 'production.sql');
const envPath = path.join(__dirname, '..', '..', '.env');

const throwError = (msg: string) => {
    console.info(colors.red(msg));
    process.exit(1);
};

const checkPermissions = () => {
    if (!TL_ALLOW_RESTORING_DB) {
        throwError('You have to have TL_ALLOW_RESTORING_DB=true in .env file\n');
    }
};

const getStringConditions = (conditions: KeyValue) =>
    Object.entries(conditions)
        .map(([key, item]) => {
            if (key === 'sql') {
                return item;
            }

            if (item === null) {
                return `${key} IS NULL`;
            }

            return `${key}="${item}"`;
        })
        .join(' AND ');

export const cleanScreenshotsFolder = async () => {
    const actualFolder = path.join(__dirname, '../../screenshots/actual');
    const diffFolder = path.join(__dirname, '../../screenshots/diff');

    rimraf.sync(actualFolder);
    rimraf.sync(diffFolder);

    mkdirp.sync(diffFolder);
};

const generateDump = () => {
    const dumpDir = TL_TMP_FOLDER as string;

    // Make sure that dumpDir exists
    mkdirp.sync(dumpDir);

    checkPermissions();

    // Clean db
    execSync(`mysql ${dbCredentials} -e "DROP DATABASE ${TL_DB_NAME}; CREATE DATABASE ${TL_DB_NAME};"`, {
        stdio: 'ignore',
        env: { ...process.env, MYSQL_PWD: TL_DB_PASSWORD },
    });

    // Populate database
    const serverFolder = path.join(__dirname, '..', '..');
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

    const getMaxModifiedTime = (dir: string) =>
        fs.readdirSync(dir).reduce((max: number, file: string): number => {
            const name = path.join(dir, file);

            const stat = fs.statSync(name);
            const isDirectory = stat.isDirectory();

            return isDirectory ? Math.max(max, getMaxModifiedTime(name)) : Math.max(max, stat.mtimeMs);
        }, 0);

    const migrationsModifiedTime = getMaxModifiedTime(path.join(__dirname, '..', '..', 'dist', 'db', 'migrations'));
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

export const getNumRecords = async (table: string, conditions?: KeyValue) => {
    checkPermissions();

    const where = conditions ? 'WHERE ' + getStringConditions(conditions) : '';
    const query = `SELECT count(*) AS cnt FROM ${table} ${where}`;

    const [{ cnt }] = await runQueryAndClose(query);
    return cnt;
};

export const runQuery = (query: string) => {
    checkPermissions();
    return runQueryAndClose(query);
};

export const getRecord = async (table: string, conditions: KeyValue) => {
    checkPermissions();

    const where = conditions ? 'WHERE ' + getStringConditions(conditions) : '';
    const query = `SELECT * FROM ${table} ${where} LIMIT 0, 1`;

    const [record] = await runQueryAndClose(query);
    return record;
};

export const expectRecordToExist = async (table: string, conditions: KeyValue, data?: KeyValue) => {
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
                    throw new Error(`The record in table "${table}" has different data\n\n` + (error as Error).message);
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

export const expectNumRecords = async (table: string, conditions: KeyValue, num: number) => {
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

export const overrideConfig = async (values: KeyValue) => {
    await runQuery(`UPDATE config SET override='${JSON.stringify(values)}'`);
};
