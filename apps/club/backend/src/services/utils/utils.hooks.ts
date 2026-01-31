// @ts-nocheck
import type { HookContext } from '@feathersjs/feathers';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { NotFound, Unprocessable } from '@feathersjs/errors';
import { disallow } from 'feathers-hooks-common';
import { hasAnyRole } from '../commonHooks';
import generateNextSeason from '../../utils/generateNextSeason';
import generateNews from '../news/generateNews';
import runActions from '../../utils/runActions';
import axios from 'axios';
import saveFile from './saveFile';
import dayjs from '../../utils/dayjs';
import sharp from 'sharp';
import _isEmpty from 'lodash/isEmpty';
import { getSchemaErrors, throwValidationErrors } from '../../helpers';
import yup from '../../packages/yup';
import fs from 'fs';
import path from 'path';
import { calculateElo } from '../matches/calculateElo';
import md5 from 'md5';
import { applyNewBadges } from '../../utils/applyNewBadges';
import { getStatsMatches } from '../../utils/sqlConditions';
import jwt from 'jsonwebtoken';
import { getPlayerName } from '../users/helpers';
import writeXlsxFile from 'write-excel-file/node';
import type { User } from '../../types';

const generateBadges = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['superadmin'])(context);

    const sequelize = context.app.get('sequelizeClient');
    await applyNewBadges(sequelize, true);

    context.result = {
        status: 'success',
    };

    return context;
};

const publishUpdates = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['admin'])(context);

    const { app } = context;

    await generateNextSeason(app);
    await generateNews();

    return context;
};

const runActionsHook = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['admin'])(context);

    const { app } = context;

    await runActions(app);

    return context;
};

const getActivityStats = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');

    const dateYearAgo = dayjs.tz().subtract(1, 'year').format('YYYY-MM-DD HH:mm:ss');
    const [matches] = await sequelize.query(`
        SELECT pc.userId AS challengerUserId,
               pa.userId AS acceptorUserId,
               pc2.userId AS challenger2UserId,
               pa2.userId AS acceptor2UserId,
               pc.tournamentId
          FROM matches AS m
          JOIN players AS pc ON m.challengerId=pc.id
          JOIN players AS pa ON m.acceptorId=pa.id
          LEFT JOIN players AS pc2 ON m.challenger2Id=pc2.id
          LEFT JOIN players AS pa2 ON m.acceptor2Id=pa2.id
         WHERE ${getStatsMatches('m')} AND
               m.playedAt>"${dateYearAgo}"`);

    const players = new Set();
    const ladders = new Set();

    for (const match of matches) {
        players.add(match.challengerUserId);
        players.add(match.acceptorUserId);

        if (match.challenger2UserId) {
            players.add(match.challenger2UserId);
            players.add(match.acceptor2UserId);
        }

        ladders.add(match.tournamentId);
    }

    const stats = {
        players: players.size,
        matches: matches.length,
        ladders: ladders.size,
    };

    context.result = { status: 'success', data: stats };

    return context;
};

const getMotivationStats = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');

    const [[row]] = await sequelize.query(`SELECT count(*) AS cnt FROM users WHERE isVerified=1`);
    const playersTotal = row.cnt;

    const [avatars] = await sequelize.query(`
        SELECT id, avatar
          FROM users
         WHERE avatarObject IS NOT NULL
      ORDER BY id DESC
         LIMIT 0, 5`);

    context.result = {
        status: 'success',
        data: {
            playersTotal,
            recentPlayers: avatars,
        },
    };

    return context;
};

const addLog = () => async (context: HookContext) => {
    // Validate
    {
        const schema = yup.object().shape({
            tableId: yup.number().nullable().min(0),
            code: yup.string().required().max(30),
            payload: yup.string().max(200),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    try {
        await authenticate('jwt')(context);
    } catch {
        // do nothing
    }

    const sequelize = context.app.get('sequelizeClient');
    await sequelize.query(
        `INSERT INTO logs (userId, tableId, code, payload) VALUES (:userId, :tableId, :code, :payload)`,
        {
            replacements: {
                userId: context.params?.user?.id || 0,
                tableId: context.data.tableId,
                code: context.data.code,
                payload: context.data.payload,
            },
        }
    );

    context.result = { status: 'success' };

    return context;
};

const getVisualTestingResult = () => async (context: HookContext) => {
    // todo: restrict for production use somehow

    const screenshotFolder = path.resolve(__dirname, '..', '..', '..', '..', '..', 'screenshots');

    const getFolderFiles = (folder: string) => {
        return fs.readdirSync(folder).filter((file) => /^vrt-/.test(file));
    };

    const getSizes = async (files: string[]) => {
        const result = {} as Record<string, { width: number; height: number }>;

        for (const file of files) {
            const filepath = path.join(screenshotFolder, 'base', file);
            const image = sharp(filepath);
            const metadata = await image.metadata();
            result[file] = { width: metadata.width, height: metadata.height };
        }

        return result;
    };

    const baseFiles = getFolderFiles(path.join(screenshotFolder, 'base'));
    const actualFiles = getFolderFiles(path.join(screenshotFolder, 'actual'));
    const actualThumbnails = getFolderFiles(path.join(screenshotFolder, 'actual', 'thumbnails'));

    const sizes = await getSizes(actualFiles);

    const wrongFiles = (() => {
        const percentFile = path.join(screenshotFolder, 'diff', 'percent.json');
        if (!fs.existsSync(percentFile)) {
            return [];
        }

        const data = JSON.parse(fs.readFileSync(percentFile, 'utf-8'));

        return Object.entries(data)
            .map(([key, value]) => ({ file: key, percent: value }))
            .sort((a, b) => a.file.localeCompare(b.file));
    })();

    context.result = {
        status: 'success',
        data: {
            baseFiles,
            actualFiles,
            actualThumbnails,
            wrongFiles,
            sizes,
        },
    };

    return context;
};

const acceptVisualChanges = () => async (context: HookContext) => {
    // todo: restrict for production use somehow

    // Validate
    {
        const schema = yup.object().shape({
            file: yup
                .string()
                .required()
                .max(100)
                .matches(/^[A-Za-z0-9-.]+$/),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const { file } = context.data;
    const screenshotFolder = path.resolve(__dirname, '..', '..', '..', '..', '..', 'screenshots');

    fs.copyFileSync(path.join(screenshotFolder, 'actual', file), path.join(screenshotFolder, 'base', file));

    const diffFile = path.join(screenshotFolder, 'diff', file);
    if (fs.existsSync(diffFile)) {
        fs.rmSync(diffFile);
    }

    const percentJson = path.join(screenshotFolder, 'diff', 'percent.json');
    if (fs.existsSync(percentJson)) {
        const data = JSON.parse(fs.readFileSync(percentJson, 'utf-8'));
        delete data[file];
        fs.writeFileSync(percentJson, JSON.stringify(data, null, 4));
    }

    context.result = {
        status: 'success',
    };

    return context;
};

const getHealthInfo = () => async (context: HookContext) => {
    const health = {
        weather: true,
    };

    const sequelize = context.app.get('sequelizeClient');

    const [[settings]] = await sequelize.query(
        `SELECT weather
           FROM settings
          WHERE id=1`
    );

    try {
        const list = JSON.parse(settings.weather);
        const firstDay = list.days[0].datetime;
        const oneDayAgo = dayjs
            .tz()
            .subtract(24 + 6, 'hour')
            .format('YYYY-MM-DD');

        if (firstDay < oneDayAgo) {
            health.weather = false;
        }
    } catch {
        health.weather = false;
    }

    context.result = {
        status: 'success',
        ...health,
    };

    return context;
};

const getCustomInfo = () => async (context: HookContext) => {
    const code = context.id;

    if (code === 'health') {
        await getHealthInfo()(context);
    } else {
        throw new NotFound();
    }

    if (!context.result) {
        context.result = { status: 'success' };
    }
};

const recalculateElo = () => async (context: HookContext) => {
    await calculateElo();

    if (!context.result) {
        context.result = { status: 'success' };
    }
};

const getExcelFile = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['admin'])(context);

    const { TL_STORE_TOKEN, TL_STORE_URL } = process.env;

    const response = await axios.get(`${TL_STORE_URL}/api/cities?populate=*`, {
        headers: { Authorization: `Bearer ${TL_STORE_TOKEN}` },
    });

    const data = response.data.data.filter((city) => city.attributes.stats && city.attributes.published);

    // Users
    const userRows = data
        .reduce((arr, item) => {
            (item.attributes.stats.users || []).forEach((user) => {
                arr.push({ city: item.attributes.name, ...user });
            });

            return arr;
        }, [])
        .sort((a, b) => a.name.localeCompare(b.name));
    const userFirstColumns = ['city', 'name'];
    const userHeader = [
        ...userFirstColumns,
        ...Object.keys(userRows[0]).filter((item) => !userFirstColumns.includes(item)),
    ].map((item) => ({ value: item }));
    const users = [userHeader, ...userRows.map((row) => userHeader.map((column) => ({ value: row[column.value] })))];

    // Complaints
    const complaintRows = data
        .reduce((arr, item) => {
            (item.attributes.stats.complaints || []).forEach((complaint) => {
                arr.push({ city: item.attributes.name, ...complaint });
            });

            return arr;
        }, [])
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const complaintFirstColumns = ['city', 'complainer', 'complainee', 'createdAt'];
    const complaintHeader = [
        ...complaintFirstColumns,
        ...Object.keys(complaintRows[0]).filter((item) => !complaintFirstColumns.includes(item)),
    ].map((item) => ({ value: item }));
    const complaints = [
        complaintHeader,
        ...complaintRows.map((row) => complaintHeader.map((column) => ({ value: row[column.value] }))),
    ];

    const content = await writeXlsxFile([users, complaints], {
        sheets: ['Users', 'Complaints'],
        buffer: true,
    });

    const date = dayjs.tz().format('YYYY-MM-DD');
    const hash = md5([date, process.env.TL_SECURE_KEY].join(':')).slice(0, 10);
    const filename = `data-${date}-${hash}.xlsx`;
    const { src } = await saveFile(filename, content);

    context.result = {
        status: 'success',
        src,
        filename,
    };
};

const loginAsPlayer = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    hasAnyRole(['superadmin'])(context);

    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;
    const userId = Number(context.id);
    const currentUser = context.params.user as User;
    const currentTokenPayload = context.params.authentication!.payload;
    const privateKey = context.app.get('authentication').secret;

    const user = await users.findByPk(userId);
    if (!['player', 'partner'].includes(user?.roles)) {
        throw new Unprocessable('You can login as player only.');
    }

    const token = jwt.sign(
        {
            ...currentTokenPayload,
            sub: `${user.id}`,
            loginAs: true,
            loginAsOriginalUser: getPlayerName(currentUser),
        },
        privateKey,
        { header: { alg: 'HS256', typ: 'access' } }
    );

    const { accessToken } = await context.app.service('/api/authentication').create({
        strategy: 'jwt',
        accessToken: token,
    });

    context.result = {
        status: 'success',
        accessToken,
    };
};

const runCustomAction = () => async (context: HookContext) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'publishUpdates') {
        await publishUpdates()(context);
    } else if (action === 'runActions') {
        await runActionsHook()(context);
    } else if (action === 'generateBadges') {
        await generateBadges()(context);
    } else if (action === 'getActivityStats') {
        await getActivityStats()(context);
    } else if (action === 'getMotivationStats') {
        await getMotivationStats()(context);
    } else if (action === 'addLog') {
        await addLog()(context);
    } else if (action === 'getVisualTestingResult') {
        await getVisualTestingResult()(context);
    } else if (action === 'acceptVisualChanges') {
        await acceptVisualChanges()(context);
    } else if (action === 'recalculateElo') {
        await recalculateElo()(context);
    } else if (action === 'getExcelFile') {
        await getExcelFile()(context);
    } else if (action === 'loginAsPlayer') {
        await loginAsPlayer()(context);
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
        get: [getCustomInfo()],
        create: [disallow()],
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
