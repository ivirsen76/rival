import type { HookContext } from '@feathersjs/feathers';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { NotFound, Unprocessable } from '@feathersjs/errors';
import { keep, disallow } from 'feathers-hooks-common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_BUCKET_NAME } from '../../constants';
import yup from '../../packages/yup';
import { throwValidationErrors, getSchemaErrors } from '../../helpers';
import _isEmpty from 'lodash/isEmpty';
import invokeLambda from '../../utils/invokeLambda';
import md5 from 'md5';
import _pick from 'lodash/pick';
import dayjs from '../../utils/dayjs';
import { logEvent, generateBadges } from '../commonHooks';
import { getEmailsFromList } from '../settings/helpers';
import moderatePhotoNotificationTemplate from '../../emailTemplates/moderatePhotoNotification';
import { getActionLink, decodeAction } from '../../utils/action';
import { getPlayerName, getEmailContact } from '../users/helpers';

const getPresignedUrlForPhotosUpload = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    // Validate data
    {
        const schema = yup.object().shape({
            files: yup
                .array(
                    yup.object().shape({
                        id: yup.number().required(),
                        name: yup.string().required().min(1).max(100),
                        size: yup.number().required(),
                    })
                )
                .min(1),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const currentUser = context.params.user!;
    const { config } = context.params;
    const { files } = context.data;
    const sequelize = context.app.get('sequelizeClient');

    let [existingKeys] = await sequelize.query('SELECT `key` FROM photos WHERE userId=:userId AND deletedAt IS NULL', {
        replacements: { userId: currentUser.id },
    });
    existingKeys = existingKeys.reduce((set, item) => {
        set.add(item.key);
        return set;
    }, new Set());

    // get number of photos today
    let [[{ photosToday }]] = await sequelize.query(
        'SELECT count(*) AS photosToday FROM photos WHERE userId=:userId AND createdAt>:date AND deletedAt IS NULL',
        {
            replacements: {
                userId: currentUser.id,
                date: dayjs.tz().format('YYYY-MM-DD 00:00:00'),
            },
        }
    );

    const getPresignedUrl = async (file) => {
        const extension = file.name.replace(/^.*\./, '').toLowerCase();
        const hash = md5(`${config.city.toLowerCase()}-${currentUser.id}-${file.name}-${file.size}`).slice(0, 20);
        const key = `photos/original/${config.city.toLowerCase()}/${currentUser.id}/${hash}.${extension}`;

        if (existingKeys.has(key)) {
            return { status: 'error', id: file.id, name: file.name, reason: 'Duplicated photo' };
        }
        if (++photosToday > config.maxPhotosPerDay) {
            return {
                status: 'error',
                id: file.id,
                name: file.name,
                reason: `Not more than ${config.maxPhotosPerDay} photos today`,
            };
        }

        const client = new S3Client();
        const command = new PutObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key });

        const url = await getSignedUrl(client, command, {
            expiresIn: 600, // 10 minutes
        });

        return { status: 'success', id: file.id, url, key };
    };

    context.result = await Promise.all(files.map(getPresignedUrl));
};

const batchProcess = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    // Validate data
    {
        const schema = yup.object().shape({
            files: yup
                .array(
                    yup.object().shape({
                        id: yup.number().required(),
                        name: yup.string().required().min(1).max(100),
                        key: yup.string().required().min(50).max(100),
                    })
                )
                .min(1),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const currentUser = context.params.user!;
    const { files } = context.data;
    const sequelize = context.app.get('sequelizeClient');
    const { photos } = sequelize.models;
    const { config } = context.params;
    const { TL_URL } = process.env;

    let [existingKeys] = await sequelize.query('SELECT `key` FROM photos WHERE userId=:userId AND deletedAt IS NULL', {
        replacements: { userId: currentUser.id },
    });
    existingKeys = existingKeys.reduce((set, item) => {
        set.add(item.key);
        return set;
    }, new Set());

    const processPhoto = async (file) => {
        if (existingKeys.has(file.key)) {
            return { status: 'error', id: file.id, name: file.name, reason: 'Duplicated photo' };
        }

        try {
            const response = await invokeLambda('resizeImage:3', { bucket: S3_BUCKET_NAME, key: file.key });
            if (response.error) {
                return { status: 'error', id: file.id, name: file.name, reason: response.error };
            }

            const { sizes, width, height, moderationStatus, moderationInfo } = response.data;
            const isApproved = moderationStatus === 'success';
            const photo = await photos.create({
                userId: currentUser.id,
                key: file.key,
                width,
                height,
                ...sizes,
                isApproved,
                ...(!isApproved && { moderationInfo: JSON.stringify(moderationInfo) }),
            });

            if (!isApproved) {
                // do not wait for it
                (async () => {
                    const [[settings]] = await sequelize.query(
                        `SELECT newComplaintNotification FROM settings WHERE id=1`
                    );
                    const emails = getEmailsFromList(settings.newComplaintNotification);
                    if (emails.length > 0) {
                        const userName = getPlayerName(currentUser);
                        const approveLink = await getActionLink({
                            payload: { name: 'approvePhoto', photoId: photo.id },
                        });

                        context.app.service('api/emails').create({
                            replyTo: getEmailContact(currentUser),
                            to: emails.map((item) => ({ email: item })),
                            subject: 'Photo is not approved',

                            html: moderatePhotoNotificationTemplate(config, {
                                userName,
                                profileLink: `${TL_URL}/player/${currentUser.slug}`,
                                photoSrc: sizes.url800,
                                moderationInfo: Object.entries(moderationInfo).map(([key, value]) => ({
                                    label: key,
                                    percent: value,
                                })),
                                approveLink,
                            }),
                        });
                    }
                })();
            }

            return { status: 'success', id: file.id, photoId: photo.id, width, height, ...sizes };
        } catch (e) {
            return { status: 'error', id: file.id, name: file.name, reason: 'Unknown error' };
        }
    };

    context.result = await Promise.all(files.map(processPhoto));

    await generateBadges()(context);
};

const getReactionsAndComments = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const photoId = Number(context.id);

    const { photos } = sequelize.models;
    const photo = await photos.findByPk(photoId);
    if (!photo) {
        throw new Unprocessable('The photo is not found');
    }

    const [reactions] = await sequelize.query(
        `
        SELECT r.*,
               u.firstName,
               u.lastName,
               u.slug,
               u.avatar
          FROM reactions AS r
          JOIN users AS u ON r.userId=u.id
         WHERE r.photoId=:photoId
      ORDER BY r.id`,
        { replacements: { photoId } }
    );
    const [comments] = await sequelize.query(
        `
        SELECT c.*,
               u.firstName,
               u.lastName,
               u.slug,
               u.avatar
          FROM comments AS c
          JOIN users AS u ON c.userId=u.id
         WHERE c.photoId=:photoId
      ORDER BY c.id`,
        { replacements: { photoId } }
    );

    const users = [...reactions, ...comments].reduce((obj, item) => {
        if (!obj[item.userId]) {
            obj[item.userId] = {
                id: item.userId,
                firstName: item.firstName,
                lastName: item.lastName,
                slug: item.slug,
                avatar: item.avatar,
            };
        }
        return obj;
    }, {});

    context.result = {
        status: 'success',
        data: {
            photo,
            reactions: reactions.map((item) => _pick(item, ['id', 'code', 'userId', 'createdAt'])),
            comments: comments.map((item) => _pick(item, ['id', 'message', 'userId', 'createdAt'])),
            users,
        },
    };

    return context;
};

const addView = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const sequelize = context.app.get('sequelizeClient');
    const photoId = Number(context.id);
    const { photos } = sequelize.models;
    const currentUser = context.params.user!;

    const photo = await photos.findByPk(photoId);
    if (!photo) {
        throw new Unprocessable('The photo is not found');
    }

    const [result] = await sequelize.query(`UPDATE views SET count=count+1 WHERE userId=:userId AND photoId=:photoId`, {
        replacements: { userId: currentUser.id, photoId },
    });

    if (result.affectedRows === 0) {
        await sequelize.query(`INSERT INTO views (userId, photoId) VALUES (:userId, :photoId)`, {
            replacements: { userId: currentUser.id, photoId },
        });
    }

    return context;
};

const validatePatch = () => async (context: HookContext) => {
    const photoId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { photos } = sequelize.models;
    const currentUser = context.params.user!;

    // Validate data
    {
        const schema = yup.object().shape({
            title: yup.string().max(200),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const photo = await photos.findByPk(photoId);
    if (!photo) {
        throw new Unprocessable('The photo does not exist.');
    }
    if (photo.userId !== currentUser.id) {
        throw new Unprocessable('It is not your photo.');
    }

    return context;
};

const validateDelete = () => async (context: HookContext) => {
    const id = Number(context.id);
    const currentUser = context.params.user!;

    const sequelize = context.app.get('sequelizeClient');
    const { photos } = sequelize.models;

    const photo = await photos.findByPk(id);
    if (!photo) {
        throw new Unprocessable("Photo doesn't exist.");
    }
    if (photo.userId !== currentUser.id) {
        throw new Unprocessable('Photo is not yours.');
    }

    await photos.update({ deletedAt: dayjs.tz().format('YYYY-MM-DD HH:mm:ss+00:00') }, { where: { id } });
    logEvent(`Photo with id=${id} was deleted`)(context);

    context.result = { status: 'success' };

    return context;
};

const changePermissions = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    // Validate data
    {
        const schema = yup.array(
            yup.object().shape({
                allowShare: yup.boolean(),
                allowComments: yup.boolean(),
                title: yup.string().max(200),
            })
        );

        const errors = getSchemaErrors(schema, Object.values(context.data.permissions));

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const currentUser = context.params.user!;
    const { permissions } = context.data;
    const sequelize = context.app.get('sequelizeClient');
    const { photos } = sequelize.models;

    const photoIds = Object.keys(permissions).map(Number);
    for (const photoId of photoIds) {
        const photo = await photos.findByPk(photoId);
        if (!photo) {
            throw new Unprocessable('The photo does not exist.');
        }
        if (photo.userId !== currentUser.id) {
            throw new Unprocessable('It is not your photo.');
        }

        await photos.update(
            {
                allowShare: Boolean(permissions[photoId].allowShare),
                allowComments: Boolean(permissions[photoId].allowComments),
                ...(permissions[photoId].title && { title: permissions[photoId].title }),
            },
            { where: { id: photoId } }
        );
    }

    return context;
};

const approvePhoto = () => async (context: HookContext) => {
    let action;
    try {
        action = decodeAction(context.data.payload);
    } catch (e) {
        throw new Unprocessable(e.message);
    }

    if (action.name !== 'approvePhoto') {
        throw new Unprocessable('The link is broken');
    }

    const sequelize = context.app.get('sequelizeClient');
    const { photos } = sequelize.models;

    const photo = await photos.findByPk(action.photoId);
    if (!photo) {
        throw new Unprocessable('There is no photo.');
    }
    if (photo.isApproved) {
        throw new Unprocessable('Photo is already approved.');
    }

    await photos.update({ isApproved: 1 }, { where: { id: action.photoId } });
    logEvent(`Photo with id=${action.photoId} was approved`)(context);

    context.result = {
        status: 'success',
        url: photo.url800,
    };

    return context;
};

const runCustomAction = () => async (context: HookContext) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'getPresignedUrlForPhotosUpload') {
        await getPresignedUrlForPhotosUpload()(context);
    } else if (action === 'batchProcess') {
        await batchProcess()(context);
    } else if (action === 'getReactionsAndComments') {
        await getReactionsAndComments()(context);
    } else if (action === 'addView') {
        await addView()(context);
    } else if (action === 'changePermissions') {
        await changePermissions()(context);
    } else if (action === 'approvePhoto') {
        await approvePhoto()(context);
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
        find: [disallow()],
        get: [disallow()],
        create: [disallow()],
        update: [runCustomAction()],
        patch: [authenticate('jwt'), validatePatch(), keep('title')],
        remove: [authenticate('jwt'), validateDelete()],
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
