import type { HookContext } from '@feathersjs/feathers';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { keep, disallow } from 'feathers-hooks-common';
import validate from './validate';
import _isEmpty from 'lodash/isEmpty';
import { throwValidationErrors } from '../../helpers';
import allBananas from '../../bananas';
import dayjs from '../../utils/dayjs';
import type { Banana, Club } from '../../types';

const validatePatch = () => (context: HookContext) => {
    const errors = validate(context.data);

    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    return context;
};

const populateConstants = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const { config } = context.params;
    const { seasons, levels } = sequelize.models;

    const seasonResult = await seasons.findAll({
        include: {
            model: levels,
            attributes: ['id', 'name', 'slug'],
            through: { attributes: [] },
        },
        order: [
            ['startDate', 'DESC'],
            [levels, 'position', 'ASC'],
        ],
    });

    const [levelResult] = await sequelize.query('SELECT * FROM levels ORDER BY position');
    const [[settings]] = await sequelize.query('SELECT * FROM settings WHERE id=1');

    const encode = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64').split('').reverse().join('');

    const [clubs] = (await sequelize.query('SELECT * FROM clubs')) as [Club[]];

    const bananas = (() => {
        // change banana every 1.3 hours (weird number just to rotate through nights)
        const timesSinceUnixEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 1.3));
        const currentDay = dayjs.tz().format('YYYY-MM-DD');

        const groups = allBananas
            .filter((item) => {
                if (item.from && item.from > currentDay) {
                    return false;
                }
                if (item.to && item.to < currentDay) {
                    return false;
                }
                if (item.cities && !item.cities.includes(config.url)) {
                    return false;
                }
                return true;
            })
            .map(
                (item) =>
                    ({
                        ...item,
                        link: item.partner === 'tw' ? item.link + '?from=rival' : item.link,
                    }) as Banana
            )
            .reduce(
                (obj, item) => {
                    obj[item.partner] ||= [];
                    obj[item.partner].push(item);
                    return obj;
                },
                {} as Record<string, Banana[]>
            );

        return Object.values(groups).map((list) => {
            const total = list.length;
            const index = timesSinceUnixEpoch % total;
            return list[index];
        });
    })();

    context.statusCode = 200;
    context.result = {
        seasons: seasonResult,
        levels: levelResult,
        config: encode(config),
        bananas,
        clubs,
        settings: {
            ...settings,
            global: settings.global ? JSON.parse(settings.global) : {},
            weather: settings.weather ? JSON.parse(settings.weather) : {},
        },
    };

    return context;
};

export default {
    before: {
        all: [],
        find: [disallow()],
        get: [authenticate('jwt')],
        create: [populateConstants()], // get constants to front-end
        update: [disallow()],
        patch: [
            authenticate('jwt'),
            validatePatch(),
            keep(
                'signUpNotification',
                'changeLevelNotification',
                'newFeedbackNotification',
                'newComplaintNotification'
            ),
        ],
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
