import yup from '../../packages/yup';
import { getSchemaErrors } from '../../helpers';
import _isEmpty from 'lodash/isEmpty';
import { throwValidationErrors } from '../../helpers';
import newPasswordTemplate from '../../emailTemplates/newPassword';
import { getActionLink, decodeAction } from '../../utils/action';
import { hooks } from '@feathersjs/authentication-local';
import { disallow } from 'feathers-hooks-common';
import { populateSalt } from '../commonHooks';
import { getPlayerName } from '../users/helpers';

const { hashPassword } = hooks;

const validateCreate = (options) => async (context) => {
    // validate input
    {
        const schema = yup.object().shape({
            email: yup.string().required().email('Email is incorrect.'),
        });

        const errors = getSchemaErrors(schema, context.data);
        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    // Check if we have user with this email
    const sequelize = context.app.get('sequelizeClient');
    const [result] = await sequelize.query('SELECT * FROM users WHERE email=:email', {
        replacements: { email: context.data.email },
    });
    if (result.length !== 1) {
        throwValidationErrors({ email: 'There is no user with this email.' });
    }
    context.params.user = result[0];

    return context;
};

const validateUpdate = (options) => async (context) => {
    // validate input
    {
        const schema = yup.object().shape({
            password: yup.string().required().min(8).max(20),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    let action;
    try {
        action = decodeAction(context.data.action);
    } catch (e) {
        throwValidationErrors({ password: e.message });
    }

    if (action.name !== 'newPassword') {
        throwValidationErrors({ password: 'Wrong action' });
    }

    context.data.userId = Number(action.userId);

    return context;
};

const sendNewPasswordEmail = (options) => async (context) => {
    const { app } = context;
    const { user, config } = context.params;

    const fullName = getPlayerName(user);
    const actionLink = await getActionLink({ payload: { name: 'newPassword', userId: user.id } });

    await app.service('api/emails').create({
        to: [{ name: fullName, email: context.data.email }],
        subject: 'Password reset',
        html: newPasswordTemplate(config, {
            actionLink,
            fullName,
        }),
    });

    return context;
};

const changePassword = (options) => async (context) => {
    const { password, salt, userId } = context.data;
    const sequelize = context.app.get('sequelizeClient');

    await sequelize.query('UPDATE users SET password=:password, salt=:salt WHERE id=:userId', {
        replacements: { password, userId, salt },
    });

    return context;
};

export default {
    before: {
        all: [],
        find: [disallow()],
        get: [disallow()],
        create: [validateCreate()],
        update: [validateUpdate(), populateSalt(), hashPassword('password')],
        patch: [disallow()],
        remove: [disallow()],
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [sendNewPasswordEmail()],
        update: [changePassword()],
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
