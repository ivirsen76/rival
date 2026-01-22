import path from 'path';
import * as mysql from 'mysql';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const { TL_DB_NAME, TL_DB_HOSTNAME, TL_DB_USERNAME, TL_DB_PASSWORD } = process.env;

const connectionConfig = {
    host: TL_DB_HOSTNAME,
    user: TL_DB_USERNAME,
    password: TL_DB_PASSWORD,
    database: TL_DB_NAME,
    dateStrings: true,
};

let connection: mysql.Connection | null;

export const getConnection = () => {
    if (!connection || connection.state === 'disconnected') {
        connection = mysql.createConnection(connectionConfig);
        connection.connect();
    }

    return connection;
};

export const closeConnection = () => {
    if (connection) {
        connection.end();
        connection = null;
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const runQuery = async (query: string, params: string[] = []): Promise<Record<string, any>[]> => {
    return new Promise((resolve, reject) => {
        getConnection().query(query, params, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const runQueryAndClose = async (query: string, params: string[] = []): Promise<Record<string, any>[]> => {
    const result = await runQuery(query, params);
    closeConnection();
    return result;
};
