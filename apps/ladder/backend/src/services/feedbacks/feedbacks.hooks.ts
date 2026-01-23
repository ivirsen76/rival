import type { HookContext } from '@feathersjs/feathers';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { keep, disallow } from 'feathers-hooks-common';
import { throwValidationErrors } from '../../helpers';
import _isEmpty from 'lodash/isEmpty';
import validate from './validate';
import { getEmailsFromList } from '../settings/helpers';
import { logEvent, generateBadges } from '../commonHooks';
import striptags from 'striptags';
import { getEmailContact } from '../users/helpers';

const validateCreate = () => (context: HookContext) => {
    const errors = validate(context.data);

    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    return context;
};

const populateUserId = () => (context: HookContext) => {
    const { data } = context;

    data.userId = context.params.user.id;

    return context;
};

const sendNewFeedbackEmail = () => async (context: HookContext) => {
    const currentUser = context.params.user!;
    const config = context.params.config;
    const sequelize = context.app.get('sequelizeClient');

    const [[settings]] = await sequelize.query(`SELECT newFeedbackNotification FROM settings WHERE id=1`);

    const emails = getEmailsFromList(settings.newFeedbackNotification);
    if (emails.length > 0) {
        let html = striptags(context.data.description);
        if (context.data.userAgent && context.data.type === 'bug') {
            html = `${html}<br><br>OS and Browser:<br>${context.data.userAgent}`;
        }

        context.app.service('api/emails').create({
            replyTo: getEmailContact(currentUser),
            to: emails.map((item) => ({ email: item })),
            subject: `Feedback - ${context.data.type} (${config.city})`,
            html,
        });
    }

    logEvent(`New feedback (${context.data.type}): ${context.data.description}`)(context);

    return context;
};

export default {
    before: {
        all: [authenticate('jwt')],
        find: [disallow()],
        get: [disallow()],
        create: [validateCreate(), populateUserId(), keep('userId', 'type', 'description', 'userAgent')],
        update: [disallow()],
        patch: [disallow()],
        remove: [disallow()],
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [sendNewFeedbackEmail(), generateBadges()],
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
