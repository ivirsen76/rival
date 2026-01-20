import _omit from 'lodash/omit';
import md5 from 'md5';
import dayjs from './dayjs';
import { generateReferralCode } from '../helpers';

import 'dotenv/config';

export const decodeBase64 = str => {
    return Buffer.from(str, 'base64').toString('ascii');
};

export const encodeBase64 = str => {
    return Buffer.from(str, 'ascii').toString('base64');
};

const getHash = (obj, secureKey) => {
    const sorted = Object.entries(obj).sort((a, b) => a[0].localeCompare(b[0]));
    const str = sorted.map(pair => pair[0] + '=' + pair[1]).join('=') + ':' + secureKey;

    return md5(str).slice(0, 20);
};

// to cache existing links
const actionLinks = {};

// if "app" presents, then create a short link
export const getActionLink = async ({ payload, duration = 24 * 3600, app }) => {
    const { TL_TESTCAFE_URL, TL_URL, TL_SECURE_KEY, NODE_ENV } = process.env;

    if (!TL_SECURE_KEY) {
        throw new Error('The secure key is missing');
    }

    const domain = TL_TESTCAFE_URL || TL_URL;
    const tonightTimestamp = dayjs.tz().hour(23).minute(59).second(59).unix();

    const params = {
        ...payload,
        d: duration,
        t: tonightTimestamp,
    };
    params.h = getHash(params, TL_SECURE_KEY);

    const str = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

    const url = `${domain}/action/${encodeBase64(str)}`;
    if (NODE_ENV !== 'test' && actionLinks[url]) {
        return actionLinks[url];
    }

    // we don't shorten url if we don't have "app" and DB access
    if (!app || !payload.name) {
        return url;
    }

    const sequelize = app.get('sequelizeClient');
    const [[row]] = await sequelize.query(`SELECT * FROM shortlinks WHERE name=:name AND url=:url`, {
        replacements: { name: payload.name, url },
    });

    if (row) {
        const shortUrl = `${domain}/a/${payload.name}/${row.code}`;
        actionLinks[url] = shortUrl;
        return shortUrl;
    }

    let code;
    while (!code) {
        code = generateReferralCode();
        const [[existingCode]] = await sequelize.query(`SELECT id FROM shortlinks WHERE name=:name AND code=:code`, {
            replacements: { name: payload.name, code },
        });
        if (existingCode) {
            code = null;
        }
    }

    const shortUrl = `${domain}/a/${payload.name}/${code}`;
    actionLinks[url] = shortUrl;
    await sequelize.query(`INSERT INTO shortlinks (name, code, url) VALUES (:name, :code, :url)`, {
        replacements: { name: payload.name, code, url },
    });

    return shortUrl;
};

export const decodeAction = (str, currentTimestamp = dayjs.tz().unix(), secureKey = process.env.TL_SECURE_KEY) => {
    let params;

    if (!secureKey) {
        throw new Error('The secure key is missing');
    }

    try {
        str = decodeBase64(str);
        const parts = str.split('&');
        if (
            parts.some(part => {
                if (!/^.+=.+$/.test(part)) {
                    return true;
                }
                if (part.split('=').length !== 2) {
                    return true;
                }

                return false;
            })
        ) {
            throw new Error();
        }

        params = parts.reduce((obj, part) => {
            const [key, value] = part.split('=');
            obj[key] = value;
            return obj;
        }, {});
    } catch (e) {
        throw new Error('The link is broken');
    }

    if (!params.t || !params.d || !params.h) {
        throw new Error('There are missing fields in the link');
    }

    if (getHash(_omit(params, 'h'), secureKey) !== params.h) {
        throw new Error('The link is broken');
    }

    const timestamp = parseInt(params.t, 10);
    const duration = parseInt(params.d, 10);

    if (currentTimestamp - timestamp > duration) {
        throw new Error('The link is expired');
    }

    return _omit(params, ['t', 'd', 'h']);
};
