import type { HookContext } from '@feathersjs/feathers';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { disallow } from 'feathers-hooks-common';
import { hasAnyRole } from '../commonHooks';
import { NotFound, Unprocessable } from '@feathersjs/errors';
import { getSchemaErrors, throwValidationErrors } from '../../helpers';
import yup from '../../packages/yup';
import _isEmpty from 'lodash/isEmpty';

const getPayments = () => async (context: HookContext) => {
    const currentUser = context.params.user;
    const userId = Number(context.id);

    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;

    const user = await users.findByPk(userId);

    if (currentUser.id !== userId && user.referrerUserId !== currentUser.id) {
        await hasAnyRole(['admin'])(context);
    }

    const [rows] = await sequelize.query(
        `
        SELECT p.*,
               o.payload AS orderPayload,
               o.sessionId AS orderSessionId
          FROM payments AS p
     LEFT JOIN orders AS o ON p.orderId=o.id
         WHERE p.userId=:userId
      ORDER BY p.createdAt DESC, p.amount`,
        { replacements: { userId } }
    );

    context.result = {
        data: rows.map((row) => ({
            ...row,
            orderPayload: row.orderPayload && JSON.parse(row.orderPayload),
        })),
    };

    return context;
};

const addTransaction = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['superadmin'])(context);

    const userId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');

    // Validate
    {
        const schema = yup.object().shape({
            type: yup.string().required().oneOf(['refund', 'discount', 'payment', 'product']),
            description: yup.string().required('Description is required').max(100),
            amount: yup.number().integer().required().min(-100).max(100),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const { users, payments } = sequelize.models;
    const user = await users.findByPk(userId);
    if (!user) {
        throw new Unprocessable('The user does not exist.');
    }

    await payments.create({
        userId,
        type: context.data.type,
        description: context.data.description,
        amount: context.data.amount * 100,
    });

    return context;
};

const runCustomAction = () => async (context: HookContext) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'addTransaction') {
        await addTransaction()(context);
    } else {
        throw new NotFound();
    }

    if (!context.result) {
        context.result = { status: 'success' };
    }
};

export default {
    before: {
        all: [authenticate('jwt')],
        find: [disallow()],
        get: [getPayments()],
        create: [disallow()],
        update: [runCustomAction()],
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
