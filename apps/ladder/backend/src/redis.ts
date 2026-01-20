import redis from 'redis';
import logger from '@rival-tennis-ladder/logger';

export default function (app) {
    if (!process.env.TL_ENABLE_REDIS) {
        return;
    }

    if (!process.env.TL_REDIS_PREFIX) {
        throw new Error('Redis prefix is not set');
    }

    const config = app.get('redis');

    try {
        const client = redis.createClient(config);

        const getKey = key => `${process.env.TL_REDIS_PREFIX}-${key}`;
        const clientWrapper = {
            get: (key, ...rest) => {
                return client.get(getKey(key), ...rest);
            },
            set: (key, ...rest) => {
                return client.set(getKey(key), ...rest);
            },
            expire: (key, ...rest) => {
                return client.expire(getKey(key), ...rest);
            },
            del: (key, ...rest) => {
                return client.del(getKey(key), ...rest);
            },
            flushall: (...params) => {
                return client.flushall(...params);
            },
        };

        app.set('redisClient', clientWrapper);
        client.on('ready', () => {
            if (process.env.NODE_ENV !== 'test') {
                logger.info('Redis connected');
            }
        });
    } catch (e) {
        logger.error(e.message);
    }
}
