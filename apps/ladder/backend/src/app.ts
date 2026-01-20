import fs from 'fs';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import logger from '@rival-tennis-ladder/logger';
import feathers from '@feathersjs/feathers';
import configuration from '@feathersjs/configuration';
import express from '@feathersjs/express';

import middleware from './middleware';
import services from './services';
import appHooks from './app.hooks';
import channels from './channels';

import authentication from './authentication';
import sequelize from './sequelize';
import redis from './redis';
import cron from './cron';
import preload from './preload';
import rateLimiter from './rateLimiter';
import gitcommit from './gitcommit';

const indexContent = fs
    .readFileSync(path.resolve(__dirname, '..', '..', 'frontend', 'dist', 'index.html'), 'utf8')
    .replace('__TL_SERVER_URL__', `'${process.env.TL_SERVER_URL}'`)
    .replace('__TL_TIMEZONE__', `'${process.env.TL_TIMEZONE}'`);

const app = express(feathers());

// Load app configuration
app.configure(configuration());

// Enchance app to add prefix ability
app.declareService = (name, ...middlewares) => {
    const url = app.get('apiPrefix') + '/' + name;
    app.use(url, ...middlewares);

    return app.getService(name);
};
app.getService = name => app.service(app.get('apiPrefix') + '/' + name);

app.use(gitcommit());

// Enable security, CORS, compression, favicon and body parsing
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);
app.use(cors({ exposedHeaders: ['Rival-Hash'] }));

app.use((req, res, next) => {
    if (/\.(css|js|jpg|jpeg|png|webp|gif|svg|ttf|eot|woff|woff2)$/.test(req.url)) {
        res.setHeader('Cache-Control', `max-age=${7 * 24 * 3600}`);
    } else {
        res.setHeader('Cache-Control', 'private, no-store');
    }
    next();
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.get('/', (req, res) => {
    res.send(indexContent);
});

// tracking routes
app.get('/t/open', async (req, res) => {
    const trackingId = Number(req.query.id);
    if (!Number.isInteger(trackingId)) {
        return res.status(400).send('Invalid ID');
    }

    await app.get('sequelizeClient').query(`UPDATE tracking SET opened=1 WHERE id=${trackingId}`);

    // returning transparent 1x1 PNG image
    const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9yUOtG8AAAAASUVORK5CYII=',
        'base64'
    );

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', pixel.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(pixel);
});
app.get('/t/click', async (req, res) => {
    const trackingId = Number(req.query.id);
    if (!Number.isInteger(trackingId)) {
        return res.status(400).send('Invalid ID');
    }

    const domain = `${req.protocol}://${req.get('host')}`;
    let { url } = req.query;
    try {
        // if url starts with / it means it's using the same domain
        url = url.replace(/^\//, domain);

        // eslint-disable-next-line no-new
        new URL(url); // throws if invalid
    } catch {
        return res.status(400).send('Invalid URL');
    }

    await app.get('sequelizeClient').query(`UPDATE tracking SET clicked=1 WHERE id=${trackingId}`);
    res.redirect(url);
});

// Host the public folder
app.use('/', express.static('../../dist'));

// Host screenshots folder
app.use('/screenshots', express.static('../../screenshots'));

// Set up Plugins and providers
app.configure(express.rest());

app.configure(sequelize);
app.configure(redis);
app.configure(cron);
app.configure(rateLimiter);

// Configure other middleware (see `middleware/index`)
app.configure(middleware);
app.configure(authentication);
// Set up our services (see `services/index`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);

app.get('*', (req, res) => {
    res.send(indexContent);
});

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger }));

app.hooks(appHooks);

// Add delay just to finish all bg tasks (set up DB, etc.)
setTimeout(preload, 1000);

export default app;
