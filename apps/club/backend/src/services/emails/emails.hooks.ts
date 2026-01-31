import type { HookContext } from '@feathersjs/feathers';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import nodemailer from 'nodemailer';
import { NotFound } from '@feathersjs/errors';
import validate from './validate';
import replaceEmailWithAddress from './replaceEmailWithAddress';
import arbitraryMessageTemplate from '../../emailTemplates/arbitraryMessage';
import _isEmpty from 'lodash/isEmpty';
import _omit from 'lodash/omit';
import { disallow } from 'feathers-hooks-common';
import axios from 'axios';
import { hasAnyRole, logEvent } from '../commonHooks';
import { getSchemaErrors, throwValidationErrors, limitedPromiseAll } from '../../helpers';
import yup from '../../packages/yup';
import simplifyHtml from './simplifyHtml';
import { getActionLink } from '../../utils/action';
import md5 from 'md5';
import dayjs from '../../utils/dayjs';
import { getPlayerName } from '../users/helpers';
import { base64EncodeEmail } from '../../utils/helpers';
import { parse } from 'node-html-parser';
import type { Recipient, User } from '../../types';

const validateCreate = () => (context: HookContext) => {
    const errors = validate(context.data);

    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    return context;
};

const stripHeaderFooter = () => (context: HookContext) => {
    const { data } = context;

    try {
        const root = parse(data.html);
        const body = root.querySelector('.rival-template-body');
        if (body) {
            data.html = body.toString();
        }
    } catch {
        // do nothing
    }

    return context;
};

const sendEmail = () => async (context: HookContext) => {
    const { TL_SERVICE_URL, TL_SECRET_KEY, TL_SMTP_HOST, TL_SMTP_PORT, TL_SMTP_USER, TL_SMTP_PASS } = process.env;

    const { subject, text, html, replyTo, priority } = context.data;
    const to = context.data.to as Recipient[];
    const { config } = context.params;
    const noReply = { name: 'Rival Tennis Ladder', email: 'noreply@tennis-ladder.com' };
    const sequelize = context.app.get('sequelizeClient');
    const from = context.data.from || noReply;

    // get all users
    let allUsers;
    {
        const [rows] = (await sequelize.query('SELECT id, email, firstName, lastName FROM users')) as [User[]];
        allUsers = rows.reduce(
            (obj, row) => {
                obj[row.email] = row;
                return obj;
            },
            {} as Record<string, User>
        );
    }

    const getEmailVariables = (email: string) => {
        const user = allUsers[email];
        return user
            ? {
                  '#firstName#': user.firstName,
                  '#fullName#': getPlayerName(user),
              }
            : {};
    };

    const currentDateString = dayjs.tz().format('YYYY-MM-DD');
    const getUnsubscribeEmail = (email: string) => {
        const user = allUsers[email];
        if (!user) {
            const encodedEmail = base64EncodeEmail(email);
            return `rival.unsubscribe.${encodedEmail}@tennis-ladder.com`;
        }

        const hash = md5([config.url, user.id, currentDateString, process.env.TL_SECURE_KEY].join(':')).slice(0, 10);

        return `rival.unsubscribe.${config.url}.${user.id}.${currentDateString}.${hash}@tennis-ladder.com`;
    };

    // get disabled users, banned users, and users with wrong emails
    let blockedEmails;
    {
        const [rows] = (await sequelize.query(`
            SELECT email
              FROM users
             WHERE isWrongEmail=1 OR
                   deletedAt IS NOT NULL OR
                   banDate IS NOT NULL AND banDate>"${dayjs.tz().format('YYYY-MM-DD HH:mm:ss')}"`)) as [
            { email: string }[],
        ];
        blockedEmails = new Set(rows.map((row) => row.email));
    }

    const recipients = to
        .filter((item) => !blockedEmails.has(item.email))
        .sort((a, b) => a.email.localeCompare(b.email))
        .map((item) => ({
            ..._omit(item, ['variables']),
            variables: {
                ...item.variables,
                ...getEmailVariables(item.email),
            },
            unsubscribeEmail: getUnsubscribeEmail(item.email),
        }));
    if (recipients.length === 0) {
        context.result = { status: 'success' };
        return context;
    }

    // Populate unsubscribe link
    await limitedPromiseAll(recipients, async (user: Recipient) => {
        if (user.email in allUsers) {
            user.variables['#unsubscribeLink#'] = await getActionLink({
                payload: { name: 'unsubscribe', email: user.email },
            });

            // TODO: remove it after testing
            user.variables['#adjustProposalsLink#'] = await getActionLink({
                payload: { name: 'adjustProposals', email: user.email },
            });
        } else {
            user.variables['#unsubscribeLink#'] = `${TL_SERVICE_URL}/unsubscribe?email=${encodeURIComponent(
                user.email
            )}`;
        }
    });

    if (process.env.NODE_ENV !== 'test' || process.env.TL_EMAILS_AND_IMAGES) {
        if (process.env.TL_ENV === 'production') {
            if (!TL_SERVICE_URL || !TL_SECRET_KEY) {
                throw new Error('There is no TL_SERVICE_URL or TL_SECRET_KEY settings');
            }

            const msg = {
                from,
                to: recipients,
                subject,
                ...(text && { text }),
                ...(html && { html }),
                ...(replyTo && { replyTo }),
                ...(priority && { priority }),
            };

            // Do not wait for sending email
            (async () => {
                const response = await axios.post(`${TL_SERVICE_URL}/sendEmail`, msg, {
                    headers: { authorization: TL_SECRET_KEY },
                });

                // Mark wrong emails
                const wrongEmails = response.data.wrongEmails || [];
                for (const email of wrongEmails) {
                    await sequelize.query('UPDATE users SET isWrongEmail=1 WHERE email=:email', {
                        replacements: { email },
                    });
                    logEvent(`Email ${email} was marked as wrong`)(context);
                }
            })();
        } else if (TL_SMTP_HOST && TL_SMTP_HOST !== 'local') {
            const transporter = nodemailer.createTransport({
                // @ts-expect-error - coming from 3rd party
                host: TL_SMTP_HOST,
                port: TL_SMTP_PORT,
                auth: {
                    user: TL_SMTP_USER,
                    pass: TL_SMTP_PASS,
                },
            });

            // Do not wait for sending email
            transporter.sendMail({
                from: replaceEmailWithAddress(from),
                to: replaceEmailWithAddress(recipients),
                subject,
                ...(text && { text }),
                ...(html && { html }),
                ...(replyTo && { replyTo: replaceEmailWithAddress(replyTo) }),
            });
        }
    }

    context.data.recipientEmail = recipients.map((obj) => obj.email).join(',');
    context.data.variables = JSON.stringify(
        recipients.reduce(
            (obj, item) => {
                obj[item.email] = item.variables;
                return obj;
            },
            {} as Record<string, any>
        )
    );

    ['from', 'to', 'subject', 'text', 'html', 'replyTo'].forEach((field) => {
        if (context.data[field] && typeof context.data[field] !== 'string') {
            context.data[field] = JSON.stringify(context.data[field]);
        }
    });

    return context;
};

const sendMessage = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['superadmin'])(context);

    // Validate
    {
        const schema = yup.object().shape({
            emails: yup
                .array(yup.object().shape({ email: yup.string().required().email() }))
                .min(1)
                .max(3000),
            subject: yup.string().required().max(200),
            body: yup
                .string()
                .required()
                .max(5 * 1000),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const { emails, subject, body } = context.data;

    context.app.service('api/emails').create({
        to: emails,
        subject,
        html: arbitraryMessageTemplate({ config: context.params.config, message: simplifyHtml(body) }),
    });

    return context;
};

const runCustomAction = () => async (context: HookContext) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'sendMessage') {
        await sendMessage()(context);
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
        create: [disallow('external'), validateCreate(), sendEmail(), stripHeaderFooter()],
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
