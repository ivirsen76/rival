import type { HookContext } from '@feathersjs/feathers';
import { decodeAction } from '../../utils/action';
import { Unprocessable } from '@feathersjs/errors';
import { disallow } from 'feathers-hooks-common';
import { logEvent } from '../commonHooks';

const getLongLink = () => async (context: HookContext) => {
    const { name, code } = context.data;
    const sequelize = context.app.get('sequelizeClient');

    const [[link]] = await sequelize.query(`SELECT * FROM shortlinks WHERE name=:name AND code=:code`, {
        replacements: { name, code },
    });

    if (!link) {
        throw new Unprocessable('Invalid request', { errors: 'Link is broken' });
    }

    context.result = { status: 'success', url: link.url };

    return context;
};

const decodePayload = () => async (context: HookContext) => {
    const { payload } = context.data;

    try {
        const result = decodeAction(payload);
        context.result = result;
        logEvent(`Action call: ${JSON.stringify(result)}`)(context);
    } catch (e) {
        throw new Unprocessable('Invalid request', { errors: (e as Error).message });
    }

    return context;
};

export default {
    before: {
        all: [],
        find: [disallow()],
        get: [disallow()],
        create: [decodePayload()],
        update: [getLongLink()],
        patch: [disallow()],
        remove: [disallow()],
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },

    error: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },
};
