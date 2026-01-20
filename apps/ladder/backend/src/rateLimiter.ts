import rateLimit from 'express-rate-limit';
import _get from 'lodash/get';
import logger from '@rival-tennis-ladder/logger';
import jwt from 'jsonwebtoken';

const getClientIp = req => {
    const ip = req.headers['x-real-ip'];
    if (!ip || /^127.0.0/.test(ip)) {
        return Number(Date.now()).toString();
    }

    return ip;
};

export default app => {
    if (process.env.NODE_ENV === 'test' || process.env.CI) {
        return;
    }

    const loginLimiter = rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 5,
        skip: (req, response) => {
            return !_get(req, 'body.email');
        },
        keyGenerator: req => {
            return getClientIp(req);
        },
        handler: (req, response, next, options) => {
            logger.info(`Rate limit exceeded for authentication [${getClientIp(req)}] (${_get(req, 'body.email')})`);
            response.status(options.statusCode).send(options.message);
        },
    });

    const apiLimiter = rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: req => {
            const token = _get(req, 'headers.authorization');
            if (token) {
                const decoded = jwt.decode(token);
                if (!decoded.loginAs && decoded.roles?.includes('superadmin')) {
                    return 60;
                }
            }

            return 30;
        },
        skip: (req, response) => {
            // for photos stats update
            if (req.url.includes('/photos/') && req.body?.action === 'getReactionsAndComments') {
                return true;
            }

            // for adding new reaction
            if (req.url.endsWith('/reactions') && req.method === 'POST') {
                return true;
            }

            if (req.url.endsWith('authentication')) {
                return true;
            }

            // allow to update your user profile without limitations
            if (req.url.includes('/users/') && req.method === 'PATCH') {
                return true;
            }

            return false;
        },
        keyGenerator: req => {
            const ip = getClientIp(req);

            try {
                const token = _get(req, 'headers.authorization');
                const hash = token.split('.')[2];

                return hash.length > 20 ? hash.slice(0, 20) : ip;
            } catch (e) {
                return ip;
            }
        },
        handler: (req, response, next, options) => {
            logger.info(`Rate limit exceeded for regular API [${getClientIp(req)}]`);
            response.status(options.statusCode).send(options.message);
        },
    });

    app.use('/api/authentication', loginLimiter);
    app.use('/api', apiLimiter);
};
