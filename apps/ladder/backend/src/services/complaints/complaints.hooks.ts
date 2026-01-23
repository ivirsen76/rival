import type { HookContext } from '@feathersjs/feathers';
import { NotFound, Unprocessable } from '@feathersjs/errors';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { keep, disallow } from 'feathers-hooks-common';
import yup from '../../packages/yup';
import { throwValidationErrors, getSchemaErrors } from '../../helpers';
import _isEmpty from 'lodash/isEmpty';
import reasonOptions from './reasonOptions';
import { getEmailsFromList } from '../settings/helpers';
import newComplaintTemplate from '../../emailTemplates/newComplaint';
import { hasAnyRole } from '../commonHooks';
import { getEmailContact } from '../users/helpers';

const populateComplaint = (options) => async (context: HookContext) => {
    // Validate data
    {
        const schema = yup.object().shape({
            reason: yup.string().required('Reason is required.').max(40),
            description: yup.string().required('Description is required.').max(2000),
            opponentId: yup.number().integer().required(),
            avoid: yup.boolean(),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const { data } = context;
    data.userId = context.params.user.id;

    const reason = reasonOptions.find((item) => item.value === data.reason);
    if (!reason) {
        throw new Unprocessable('Invalid request', { errors: { reason: 'The reason is wrong.' } });
    }

    const currentUser = context.params.user;
    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;

    if (currentUser.id === data.opponentId) {
        throw new Unprocessable('You cannot complain about yourself.');
    }

    const opponent = await users.findByPk(data.opponentId);
    if (!opponent) {
        throw new Unprocessable('Opponent is wrong.');
    }
    context.params.opponent = opponent;

    return context;
};

const sendNewComplaintNotification = (options) => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const [[settings]] = await sequelize.query(`SELECT newComplaintNotification FROM settings WHERE id=1`);

    const opponent = context.params.opponent;
    const currentUser = context.params.user;
    const config = context.params.config;

    const emails = getEmailsFromList(settings.newComplaintNotification);
    if (emails.length > 0) {
        const reason = reasonOptions.find((item) => item.value === context.data.reason);

        context.app.service('api/emails').create({
            replyTo: getEmailContact(currentUser),
            to: emails.map((item) => ({ email: item })),
            subject: `New Complaint About Player (${config.city})`,

            html: newComplaintTemplate(context.params.config, {
                reason: reason?.label,
                description: context.data.description,
                currentUser,
                opponent,
                avoided: context.data.avoid,
            }),
        });
    }

    return context;
};

const avoidPlayer = (options) => async (context: HookContext) => {
    const { avoid } = context.data;

    if (!avoid) {
        return context;
    }

    const currentUser = context.params.user;
    const sequelize = context.app.get('sequelizeClient');
    const opponent = context.params.opponent;

    const [[row]] = await sequelize.query(
        'SELECT * FROM userrelations WHERE userId=:userId AND opponentId=:opponentId',
        { replacements: { userId: currentUser.id, opponentId: opponent.id } }
    );

    if (row) {
        await sequelize.query(`UPDATE userrelations SET avoid=1, avoidedOnce=1 WHERE id=:id`, {
            replacements: { id: row.id },
        });
    } else {
        await sequelize.query(
            `INSERT INTO userrelations (userId, opponentId, avoid, avoidedOnce) VALUES (:userId, :opponentId, 1, 1)`,
            { replacements: { userId: currentUser.id, opponentId: opponent.id } }
        );
    }

    return context;
};

const getAllComplaints = (options) => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin', 'manager'])(context);

    const sequelize = context.app.get('sequelizeClient');

    const [rows] = await sequelize.query(
        `
            SELECT c.id,
                   u.id AS userId,
                   u.firstName AS userFirstName,
                   u.lastName AS userLastName, 
                   u.slug AS userSlug,
                   o.id AS opponentId,
                   o.firstName AS opponentFirstName,
                   o.lastName AS opponentLastName,
                   o.slug AS opponentSlug,
                   c.reason,
                   c.description,
                   c.createdAt
              FROM complaints AS c
              JOIN users AS u ON c.userId=u.id
              JOIN users AS o ON c.opponentId=o.id
          ORDER BY c.createdAt ASC`
    );

    context.result = { data: rows };

    return context;
};

const runCustomAction = (options) => async (context: HookContext) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'getAllComplaints') {
        await getAllComplaints()(context);
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
        get: [disallow()],
        create: [populateComplaint(), keep('userId', 'opponentId', 'reason', 'description', 'avoid')],
        update: [runCustomAction()],
        patch: [disallow()],
        remove: [disallow()],
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [sendNewComplaintNotification(), avoidPlayer()],
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
