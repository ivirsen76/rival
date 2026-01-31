// @ts-nocheck
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
    .readFileSync(path.resolve(__dirname, '..', 'build', 'index.html'), 'utf8')
    .replace('__TL_SERVER_URL__', `'${process.env.TL_SERVER_URL}'`)
    .replace('__TL_TIMEZONE__', `'${process.env.TL_TIMEZONE}'`);

const app = express(feathers());

// Load app configuration
app.configure(configuration());

// Enchance app to add prefix ability
app.declareService = (name: string, ...middlewares) => {
    const url = app.get('apiPrefix') + '/' + name;
    app.use(url, ...middlewares);

    return app.getService(name);
};
app.getService = (name: string) => app.service(app.get('apiPrefix') + '/' + name);

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

// Host the public folder
app.use('/', express.static('./build'));

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
