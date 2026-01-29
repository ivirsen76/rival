import type { HookContext } from '@feathersjs/feathers';
import qs from 'qs';
import dayjs from '@rival/dayjs';

const { TL_ENABLE_REDIS } = process.env;
const DURATION = 3600 * 24;

function getCacheKey(context: HookContext) {
    let path = context.path;
    const query = context.params.query || {};

    if (context.id) {
        path += `/${context.id}`;
    }

    if (Object.keys(query).length > 0) {
        path += `?${qs.stringify(query)}`;
    }

    return path;
}

type LoadOptions = {
    isCacheStale?: (data: any) => boolean;
};

const load =
    (options: LoadOptions = {}) =>
    (context: HookContext) => {
        if (!TL_ENABLE_REDIS) {
            return context;
        }
        // don't use redis if it's coming from the server
        if (!context.params.provider) {
            return context;
        }

        return new Promise((resolve) => {
            const client = context.app.get('redisClient');
            if (!client) {
                return resolve(context);
            }

            const key = getCacheKey(context);
            context.params.cacheKey = key;

            client.get(key, (err: any, reply: any) => {
                if (err || !reply) {
                    return resolve(context);
                }

                const data = JSON.parse(reply);
                if (!data || !data.createdAt) {
                    return resolve(context);
                }
                if (options.isCacheStale && options.isCacheStale(data)) {
                    return resolve(context);
                }

                context.result = data.data;
                context.params.$skipRedisSaveHook = true;

                return resolve(context);
            });
        });
    };

const save = () => (context: HookContext) => {
    if (!TL_ENABLE_REDIS || context.params.$skipRedisSaveHook) {
        return context;
    }
    // don't use redis if it's coming from the server
    if (!context.params.provider) {
        return context;
    }

    const client = context.app.get('redisClient');
    if (!client) {
        return context;
    }

    const duration = DURATION;
    const { cacheKey } = context.params;

    client.set(
        cacheKey,
        JSON.stringify({
            createdAt: dayjs.tz().format('YYYY-MM-DD HH:mm:ss'),
            data: context.result,
        })
    );
    client.expire(cacheKey, duration);

    return context;
};

export default { load, save };
