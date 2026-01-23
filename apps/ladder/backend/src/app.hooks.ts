import type { HookContext } from '@feathersjs/feathers';
import { Unprocessable } from '@feathersjs/errors';
import _capitalize from 'lodash/capitalize';
import _isArray from 'lodash/isArray';
import config from './config';
import logger from '@rival-tennis-ladder/logger';
import getCombinedConfig from './utils/getCombinedConfig';

const populateConfig = (options) => async (context: HookContext) => {
    const values = await getCombinedConfig();

    context.params.config = {
        ...config,
        ...values,
    };

    return context;
};

const handleDbErrors = (options) => (context: HookContext) => {
    if (context.error && context.error.code === 400 && _isArray(context.error.errors)) {
        const errors = {};
        context.error.errors.forEach((error) => {
            if (error.path && error.message) {
                errors[error.path] = _capitalize(error.message);
            }
        });

        context.error = new Unprocessable('Invalid request', { errors });
    }

    return context;
};

const errorHandler = (options) => (context: HookContext) => {
    if (context.error) {
        logger.error(context.error);
    }

    return context;
};

export default {
    before: {
        all: [populateConfig()],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
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
        all: [handleDbErrors(), errorHandler()],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },
};
