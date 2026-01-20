import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { NotFound, Unprocessable } from '@feathersjs/errors';
import { throwValidationErrors, getSchemaErrors } from '../../helpers';
import _isEmpty from 'lodash/isEmpty';
import yup from '../../packages/yup';
import { getEmailsFromList } from '../settings/helpers';
import commentReportNotificationTemplate from '../../emailTemplates/commentReportNotification';
import { getPlayerName, getEmailContact } from '../users/helpers';

const reportAboutComment = options => async context => {
    await authenticate('jwt')(context);

    const currentUser = context.params.user;
    const { message } = context.data;
    const sequelize = context.app.get('sequelizeClient');
    const { reports, comments, users } = sequelize.models;
    const commentId = Number(context.id);
    const { config } = context.params;

    // Validate data
    {
        const schema = yup.object().shape({
            message: yup.string().max(200),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const comment = await comments.findByPk(commentId);
    if (!comment) {
        throw new Unprocessable('The comment does not exist.');
    }
    if (comment.userId === currentUser.id) {
        throw new Unprocessable('You cannot report on your comment.');
    }

    await reports.create({ userId: currentUser.id, commentId, message });

    // Send notification
    const [[settings]] = await sequelize.query(`SELECT newComplaintNotification FROM settings WHERE id=1`);
    const emails = getEmailsFromList(settings.newComplaintNotification);
    if (emails.length > 0) {
        const userName = getPlayerName(currentUser);
        const author = await users.findByPk(comment.userId);

        context.app.service('api/emails').create({
            replyTo: getEmailContact(currentUser),
            to: emails.map(item => ({ email: item })),
            subject: 'New Report About Comment',

            html: commentReportNotificationTemplate(config, {
                userName,
                author: getPlayerName(author),
                comment: comment.message,
                message,
            }),
        });
    }

    return context;
};

const runCustomAction = options => async context => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'reportAboutComment') {
        await reportAboutComment()(context);
    } else {
        throw new NotFound();
    }

    if (!context.result) {
        context.result = { status: 'success' };
    }
};

export default {
    before: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [runCustomAction()],
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
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },
};
