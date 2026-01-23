import type { HookContext } from '@feathersjs/feathers';
import { Unprocessable } from '@feathersjs/errors';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { keep, disallow } from 'feathers-hooks-common';
import yup from '../../packages/yup';
import { throwValidationErrors, getSchemaErrors } from '../../helpers';
import _isEmpty from 'lodash/isEmpty';
import { logEvent } from '../commonHooks';

const populateComment = () => async (context: HookContext) => {
    // Validate data
    {
        const schema = yup.object().shape({
            message: yup.string().required('Comment is required.').max(200),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const sequelize = context.app.get('sequelizeClient');
    const { photos } = sequelize.models;
    const { data } = context;
    data.userId = context.params.user.id;

    const photo = await photos.findByPk(data.photoId);
    if (!photo) {
        throw new Unprocessable('Photo is wrong.');
    }

    return context;
};

const validateDelete = () => async (context: HookContext) => {
    const commentId = Number(context.id);
    const currentUser = context.params.user!;

    const sequelize = context.app.get('sequelizeClient');
    const { comments } = sequelize.models;

    const comment = await comments.findByPk(commentId);
    if (!comment) {
        throw new Unprocessable("Comment doesn't exist.");
    }
    if (comment.userId !== currentUser.id) {
        throw new Unprocessable('Comment is not yours.');
    }

    logEvent(`Comment with id=${commentId} was deleted`)(context);

    return context;
};

const validatePatch = () => async (context: HookContext) => {
    const commentId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { comments } = sequelize.models;
    const currentUser = context.params.user!;

    // Validate data
    {
        const schema = yup.object().shape({
            message: yup.string().required('Comment is required.').max(200),
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
    if (comment.userId !== currentUser.id) {
        throw new Unprocessable('It is not your comment.');
    }

    return context;
};

export default {
    before: {
        all: [authenticate('jwt')],
        find: [disallow()],
        get: [disallow()],
        create: [populateComment(), keep('userId', 'photoId', 'message')],
        update: [disallow()],
        patch: [authenticate('jwt'), validatePatch(), keep('message')],
        remove: [validateDelete()],
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
