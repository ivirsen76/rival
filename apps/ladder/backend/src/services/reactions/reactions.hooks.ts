import type { HookContext } from '@feathersjs/feathers';
import { Unprocessable } from '@feathersjs/errors';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { keep, disallow } from 'feathers-hooks-common';
import yup from '../../packages/yup';
import { throwValidationErrors, getSchemaErrors } from '../../helpers';
import _isEmpty from 'lodash/isEmpty';

const populateReaction = (options) => async (context: HookContext) => {
    // Validate data
    {
        const schema = yup.object().shape({
            code: yup.string().required().min(4).max(10),
            photoId: yup.number().required(),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const sequelize = context.app.get('sequelizeClient');
    const { photos } = sequelize.models;
    const { data } = context;
    const currentUser = context.params.user;
    data.userId = currentUser.id;

    const photo = await photos.findByPk(data.photoId);
    if (!photo) {
        throw new Unprocessable('Photo is wrong.');
    }

    const [result] = await sequelize.query(
        `DELETE FROM reactions WHERE userId=:userId AND photoId=:photoId AND code=:code`,
        { replacements: { userId: currentUser.id, photoId: data.photoId, code: data.code } }
    );

    if (result.affectedRows > 0) {
        context.result = { status: 'success' };
    }

    return context;
};

export default {
    before: {
        all: [authenticate('jwt')],
        find: [disallow()],
        get: [disallow()],
        create: [populateReaction(), keep('userId', 'photoId', 'code')],
        update: [disallow()],
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
