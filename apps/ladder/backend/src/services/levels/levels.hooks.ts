import type { HookContext } from '@feathersjs/feathers';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import _isEmpty from 'lodash/isEmpty';
import commonValidate from './commonValidate';
import { hasAnyRole, populateSlug } from '../commonHooks';
import { throwValidationErrors } from '../../helpers';
import { keep, disallow } from 'feathers-hooks-common';

const validateCreate = () => (context: HookContext) => {
    const errors = commonValidate(context.data);

    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    return context;
};

const populatePosition = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const [result] = await sequelize.query('SELECT MAX(position) AS max FROM levels');
    const max = result[0].max;
    context.data.position = max ? max + 1 : 1;

    return context;
};

const orderByPosition = () => async (context: HookContext) => {
    context.params.query!.$sort = { position: 1 };

    return context;
};

const reorder = () => async (context: HookContext) => {
    const sourceId = context.id;
    const destinationId = context.data.destinationId;
    const { levels } = context.app.get('sequelizeClient').models;

    const source = await levels.findByPk(sourceId);
    const destination = await levels.findByPk(destinationId);

    const sequelize = context.app.get('sequelizeClient');
    if (source.position > destination.position) {
        await sequelize.query(
            'UPDATE levels SET position=position+1 WHERE position>=:destination AND position<:source',
            { replacements: { destination: destination.position, source: source.position } }
        );
    } else {
        await sequelize.query(
            'UPDATE levels SET position=position-1 WHERE position>:source AND position<=:destination',
            { replacements: { destination: destination.position, source: source.position } }
        );
    }
    await sequelize.query('UPDATE levels SET position=:destination WHERE id=:id', {
        replacements: {
            destination: destination.position,
            id: sourceId,
        },
    });

    context.result = 'Done';

    return context;
};

export default {
    before: {
        all: [],
        find: [orderByPosition()],
        get: [disallow()],
        create: [
            authenticate('jwt'),
            hasAnyRole(['admin', 'manager']),
            validateCreate(),
            keep('name', 'type'),
            populatePosition(),
            populateSlug('name'),
        ],
        update: [authenticate('jwt'), hasAnyRole(['admin', 'manager']), reorder()],
        patch: [authenticate('jwt'), hasAnyRole(['admin', 'manager']), keep('name')],
        remove: [authenticate('jwt'), hasAnyRole(['admin', 'manager'])],
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
