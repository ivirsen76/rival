import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { NotFound, Unprocessable } from '@feathersjs/errors';
import { disallow } from 'feathers-hooks-common';
import { hasAnyRole } from '../commonHooks';
import { getSeasonName } from '../seasons/helpers';
import generateNextSeason from '../../utils/generateNextSeason';
import publishStats from '../../utils/publishStats';
import generateNews from '../news/generateNews';
import runActions from '../../utils/runActions';
import processRosters from '../../utils/processRosters';
import syncGlobal from '../../utils/syncGlobal';
import getWeatherForecast from '../../utils/getWeatherForecast';
import axios from 'axios';
import compareFields from '../../utils/compareFields';
import saveFile from './saveFile';
import dayjs from '../../utils/dayjs';
import sharp from 'sharp';
import _isEmpty from 'lodash/isEmpty';
import _omit from 'lodash/omit';
import DatauriParser from 'datauri/parser';
import { getSchemaErrors, throwValidationErrors, generateReferralCode, isEmail } from '../../helpers';
import yup from '../../packages/yup';
import coachRequestTemplate from '../../emailTemplates/coachRequest';
import fs from 'fs';
import path from 'path';
import { calculateElo } from '../matches/calculateElo';
import md5 from 'md5';
import { applyNewBadges } from '../../utils/applyNewBadges';
import { getStatsMatches } from '../../utils/sqlConditions';
import _cloneDeep from 'lodash/cloneDeep';
import { getActionLink } from '../../utils/action';
import jwt from 'jsonwebtoken';
import { getPlayerName, getEmailContact } from '../users/helpers';
import { encrypt } from '../../utils/crypt';
import rabbits from './rabbits.json';
import { faker } from '@faker-js/faker';
import writeXlsxFile from 'write-excel-file/node';

const generateBadges = (options) => async (context) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['superadmin'])(context);

    const sequelize = context.app.get('sequelizeClient');
    await applyNewBadges(sequelize, true);

    context.result = {
        status: 'success',
    };

    return context;
};

const generateRabbits = (options) => async (context) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin'])(context);

    const doIt = (percent) => Math.random() * 100 < percent;

    const getRandomItemFromArray = (arr) => {
        const max = arr[arr.length - 1][1];
        const num = Math.random() * max;

        let left = 0;
        let right = arr.length - 1;
        while (left !== right) {
            const middle = Math.floor((right + left) / 2);
            if (num > arr[middle][1]) {
                left = middle + 1;
            } else {
                right = middle;
            }
        }

        return arr[left][0];
    };

    const sequelize = context.app.get('sequelizeClient');
    const { maleAvatars, femaleAvatars } = context.data;
    const { app } = context;

    const [players] = await sequelize.query('SELECT id FROM players');
    if (players.length > 100) {
        throw new Unprocessable('It is too many players already.');
    }

    const [seasons] = await sequelize.query('SELECT id FROM seasons');
    if (seasons.length !== 1) {
        throw new Unprocessable('It should be just one season.');
    }

    const [existingRabbits] = await sequelize.query('SELECT id FROM users WHERE comeFromOther="Rabbit"');
    if (existingRabbits.length > 0) {
        throw new Unprocessable('Rabbits were already generated.');
    }

    const [tournaments] = await sequelize.query(`
        SELECT t.id,
               t.levelId,
               l.name AS levelName,
               l.type AS levelType
          FROM tournaments AS t
          JOIN levels AS l ON t.levelId=l.id AND l.type!="doubles-team"
         WHERE t.seasonId=1`);

    for (const tournament of tournaments) {
        const isDoubles = tournament.levelType === 'doubles';
        const isWomen = /women/i.test(tournament.levelName);
        const nums = tournament.levelName.slice(-3);
        const count = 1 + Math.floor(Math.random() * (isDoubles ? 2 : 5));

        const relatedDoublesTournament = isDoubles
            ? undefined
            : tournaments.find(
                  (item) =>
                      item.levelType === 'doubles' &&
                      item.levelName.includes(isWomen ? 'Women' : 'Men') &&
                      item.levelName.includes(nums)
              );

        for (let i = 0; i <= count; i++) {
            const firstName = getRandomItemFromArray(isWomen ? rabbits.femaleNames : rabbits.maleNames);
            const lastName = getRandomItemFromArray(rabbits.surNames);
            const phone = '9' + faker.phone.number('#########');

            let email = doIt(50) ? faker.internet.email(firstName, lastName) : faker.internet.email();
            email = doIt(80) ? email.toLowerCase() : email;

            let avatar = null;
            let avatarObject = null;
            if (doIt(50)) {
                const arr = isWomen ? femaleAvatars.pop() : maleAvatars.pop();
                avatarObject = arr[0];
                const buffer = await sharp(Buffer.from(arr[1])).png({ quality: 50 }).resize(66, 76).toBuffer();
                const parser = new DatauriParser();
                avatar = parser.format('.png', buffer).content;
            }

            const user = await app.service('api/users').create({
                firstName,
                lastName,
                email,
                phone,
                password: faker.internet.password(),
                comeFrom: 99,
                comeFromOther: 'Rabbit',
                agree: true,
            });

            const createdAt = dayjs()
                .subtract(Math.floor(Math.random() * 7 * 24 * 60 * 60), 'second')
                .format('YYYY-MM-DD HH:mm:ss');

            await sequelize.query(
                `UPDATE users
                    SET isVerified=1,
                        verificationCode=null,
                        avatar=:avatar,
                        avatarObject=:avatarObject,
                        createdAt=:createdAt,
                        gender=:gender
                  WHERE id=:id`,
                {
                    replacements: {
                        id: user.id,
                        avatar,
                        avatarObject,
                        createdAt,
                        gender: isWomen ? 'female' : 'male',
                    },
                }
            );

            await sequelize.query(`INSERT INTO players (userId, tournamentId) VALUES (${user.id}, ${tournament.id})`);
            if (relatedDoublesTournament && doIt(50)) {
                await sequelize.query(
                    `INSERT INTO players (userId, tournamentId) VALUES (${user.id}, ${relatedDoublesTournament.id})`
                );
            }
        }
    }

    context.result = {
        status: 'success',
    };

    return context;
};

const publishUpdates = (options) => async (context) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin'])(context);

    const { app } = context;

    await generateNextSeason(app);
    await generateNews(app);
    await publishStats(app);

    return context;
};

const runActionsHook = (options) => async (context) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin'])(context);

    const { app } = context;

    await runActions(app);

    return context;
};

const getGlobalStats = (options) => async (context) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin'])(context);

    const { TL_STORE_TOKEN, TL_STORE_URL } = process.env;

    const response = await axios.get(`${TL_STORE_URL}/api/cities?populate=*`, {
        headers: { Authorization: `Bearer ${TL_STORE_TOKEN}` },
    });

    const data = {};
    const currentDate = dayjs();

    const actualData = response.data.data.filter((city) => city.attributes.stats && city.attributes.published);

    data.championships = 0;
    data.trophies = 0;
    data.awards = 0;

    for (const city of actualData) {
        data.championships += city.attributes.stats.championships || 0;
        data.trophies += city.attributes.stats.trophies || 0;
        data.awards += city.attributes.stats.awards || 0;
    }

    data.finalists = actualData
        .reduce((arr, city) => {
            if (city.attributes.stats.finalists) {
                arr.push(
                    ...city.attributes.stats.finalists.map((item) => ({
                        ...item,
                        state: city.attributes.state.data.attributes.short,
                    }))
                );
            }

            return arr;
        }, [])
        .sort(compareFields('city', 'level', 'result-desc'));

    data.history = actualData
        .reduce(
            (arr, city) => {
                for (let i = 0; i < arr.length; i++) {
                    arr[i].activePlayers +=
                        (city.attributes.stats.activePlayersHistory && city.attributes.stats.activePlayersHistory[i]) ||
                        0;
                    arr[i].payments +=
                        (city.attributes.stats.paymentsHistory && city.attributes.stats.paymentsHistory[i]) || 0;
                }

                return arr;
            },
            new Array(52 * 2).fill(0).map((_, index) => ({
                date: currentDate.subtract(index, 'week').format('MMM D, YYYY'),
                activePlayers: 0,
                payments: 0,
            }))
        )
        .reverse();

    data.incomeCities = [];
    data.income = actualData.reduce((obj, city) => {
        if (!city.attributes.stats.income) {
            return obj;
        }

        data.incomeCities.push({ slug: city.attributes.slug, name: city.attributes.name });
        const nums = { spring: 1, summer: 2, fall: 3, winter: 4 };

        for (const season of city.attributes.stats.income) {
            if (season.sum === 0) {
                continue;
            }

            const name = getSeasonName(season);
            const order = season.year * 10 + nums[season.season];
            obj[name] ||= { name, order, all: 0 };
            obj[name][city.attributes.slug] = Math.round(season.sum / 100);
            obj[name].all += Math.round(season.sum / 100);
        }

        return obj;
    }, {});
    data.income = Object.values(data.income).sort((a, b) => a.order - b.order);

    data.totalUsers = actualData.reduce((num, city) => num + city.attributes.stats.totalUsers, 0);
    data.totalMatches = actualData.reduce((num, city) => num + city.attributes.stats.totalMatches, 0);

    data.cities = actualData
        .reduce((arr, city) => {
            arr.push({ value: city.attributes.slug, label: city.attributes.name });
            return arr;
        }, [])
        .sort((a, b) => a.label.localeCompare(b.label));

    data.years = actualData.reduce((obj, city) => {
        if (!obj.all) {
            obj.all = _cloneDeep(city.attributes.stats.years);
        } else {
            city.attributes.stats.years.forEach((item, index) => {
                const keys = [
                    'ladders',
                    'matches',
                    'paymentsSum',
                    'activePlayers',
                    'paymentsCount',
                    'playersPaidLastYear',
                    'playersPaidThisYearAgain',
                ];

                for (const key of keys) {
                    obj.all[index][key] += item[key];
                }
            });
        }

        obj[city.attributes.slug] = city.attributes.stats.years;

        return obj;
    }, {});

    context.result = { status: 'success', data };

    return context;
};

const syncGlobalState = (options) => async (context) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin'])(context);

    const { app } = context;

    await syncGlobal(app);
    await getWeatherForecast(app);

    return context;
};

const getGlobalPhotos = (options) => async (context) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin'])(context);

    const { TL_STORE_TOKEN, TL_STORE_URL } = process.env;

    const response = await axios.get(`${TL_STORE_URL}/api/photos?populate[city][fields][0]=slug`, {
        headers: { Authorization: `Bearer ${TL_STORE_TOKEN}` },
    });

    context.result = {
        status: 'success',
        data: response.data.data
            .map((item) => ({
                id: item.id,
                ..._omit(item.attributes, ['city']),
                citySlug: item.attributes.city.data.attributes.slug,
            }))
            .sort((a, b) => b.createdDate.localeCompare(a.createdDate)),
    };

    return context;
};

const getActivityStats = (options) => async (context) => {
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

const getMotivationStats = (options) => async (context) => {
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

const addLog = (options) => async (context) => {
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
    } catch (e) {
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

const requestCoachLesson = (options) => async (context) => {
    await authenticate('jwt')(context);

    // Validate
    {
        const schema = yup.object().shape({
            message: yup.string().required().max(1000),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const sequelize = context.app.get('sequelizeClient');
    const { config } = context.params;
    const currentUser = context.params.user;
    const coachId = Number(context.id);

    const [[coach]] = await sequelize.query(`SELECT * FROM coaches WHERE id=:id`, { replacements: { id: coachId } });

    if (!coach) {
        throw new Unprocessable('Coach is not found.');
    }

    if (!coach.isActive) {
        throw new Unprocessable('Coach is no longer available.');
    }

    if (coach.activeTill) {
        const currentDate = dayjs.tz();
        if (currentDate.isAfter(dayjs.tz(coach.activeTill))) {
            throw new Unprocessable('Coach is no longer available.');
        }
    }

    context.app.service('api/emails').create({
        to: [getEmailContact(coach)],
        replyTo: getEmailContact(currentUser),
        subject: 'Coach lesson request',
        html: coachRequestTemplate(config, { coach, message: context.data.message, currentUser }),
        priority: 2,
    });

    return context;
};

const getVisualTestingResult = (options) => async (context) => {
    // todo: restrict for production use somehow

    const screenshotFolder = path.resolve(__dirname, '..', '..', '..', '..', '..', 'screenshots');

    const getFolderFiles = (folder) => {
        return fs.readdirSync(folder).filter((file) => /^vrt-/.test(file));
    };

    const getSizes = async (files) => {
        const result = {};

        for (const file of files) {
            const filepath = path.join(screenshotFolder, 'base', file);
            const image = await sharp(filepath);
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

const acceptVisualChanges = (options) => async (context) => {
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

const getHealthInfo = (options) => async (context) => {
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
    } catch (e) {
        health.weather = false;
    }

    context.result = {
        status: 'success',
        ...health,
    };

    return context;
};

const getCustomInfo = (options) => async (context) => {
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

const recalculateElo = (options) => async (context) => {
    await calculateElo();

    if (!context.result) {
        context.result = { status: 'success' };
    }
};

const getExcelFile = (options) => async (context) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin'])(context);

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

const generatePartnerLink = (options) => async (context) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin'])(context);

    const link = await getActionLink({
        payload: {
            name: 'registerPartner',
            code: generateReferralCode(),
            percent: context.data.percent,
            years: context.data.years,
        },
        duration: 30 * 24 * 3600,
        app: context.app,
    });

    context.result = {
        status: 'success',
        link,
    };
};

const loginAsPlayer = (options) => async (context) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['superadmin'])(context);

    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;
    const userId = Number(context.id);
    const currentUser = context.params.user;
    const currentTokenPayload = context.params.authentication.payload;
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

const uploadRosters = (options) => async (context) => {
    const { TL_SECURE_KEY } = process.env;
    if (!TL_SECURE_KEY) {
        throw new Error('The secure key is missing');
    }

    const sequelize = context.app.get('sequelizeClient');

    const { hash, date, list } = context.data;

    const calculatedHash = md5(`${date}:${TL_SECURE_KEY}`);
    if (calculatedHash !== hash) {
        throw new Error('Hash is wrong');
    }

    const dateOneDayAgo = dayjs.tz().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss');
    const dateInDay = dayjs.tz().add(1, 'day').format('YYYY-MM-DD HH:mm:ss');
    if (date < dateOneDayAgo || date > dateInDay) {
        throw new Error('Date is wrong');
    }

    const finished = [];
    const failed = [];
    for (const roster of list) {
        const [[row]] = await sequelize.query(`SELECT id FROM rosters WHERE id=:id`, {
            replacements: { id: roster.id },
        });
        if (row) {
            failed.push(roster.id);
        } else {
            await sequelize.query(
                `INSERT INTO rosters SET id=:id, name=:name, category=:category, location=:location, startDate=:startDate`,
                {
                    replacements: {
                        id: roster.id,
                        name: roster.name,
                        category: roster.category,
                        location: roster.location,
                        startDate: roster.startDate,
                    },
                }
            );
            finished.push(roster.id);
        }
    }

    context.result = { status: 'success', finished, failed };
};

const uploadCandidates = (options) => async (context) => {
    const { TL_SECURE_KEY } = process.env;
    if (!TL_SECURE_KEY) {
        throw new Error('The secure key is missing');
    }

    const sequelize = context.app.get('sequelizeClient');

    const { date, list } = context.data;

    const calculatedHash = md5(`${date}:${TL_SECURE_KEY}`);
    if (calculatedHash !== context.data.hash) {
        throw new Error('Hash is wrong');
    }

    const dateOneDayAgo = dayjs.tz().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss');
    const dateInDay = dayjs.tz().add(1, 'day').format('YYYY-MM-DD HH:mm:ss');
    if (date < dateOneDayAgo || date > dateInDay) {
        throw new Error('Date is wrong');
    }

    const [rows] = await sequelize.query(`SELECT id, hash FROM candidates`);
    const hashes = rows.reduce((obj, item) => {
        obj[item.hash] = item.id;
        return obj;
    }, {});

    const finished = [];
    const failed = [];
    for (const player of list) {
        const email = player.email.trim();
        if (!isEmail(email)) {
            failed.push(email);
            continue;
        }

        const address = encrypt(email);

        // get hash for reversed email just to make it harder to guess
        const hash = md5(email.toLowerCase());

        if (hash in hashes) {
            failed.push(email);
            const candidateId = hashes[hash];

            const [rosters] = await sequelize.query(
                `SELECT rosterId FROM candidateroster WHERE candidateId=:candidateId`,
                { replacements: { candidateId } }
            );
            const rosterIds = new Set(rosters.map((item) => item.rosterId));

            for (const rosterId of player.rosters) {
                if (rosterIds.has(rosterId)) {
                    continue;
                }

                await sequelize.query(`INSERT INTO candidateroster SET candidateId=:candidateId, rosterId=:rosterId`, {
                    replacements: { candidateId, rosterId },
                });
            }
        } else {
            const [candidateId] = await sequelize.query(
                `INSERT INTO candidates
                         SET name=:name,
                             role=:role,
                             address=:address,
                             messages=:messages,
                             messageSentAt=:messageSentAt,
                             hash=:hash`,
                {
                    replacements: {
                        name: player.name,
                        role: player.role || null,
                        address,
                        messages: player.messages || 0,
                        messageSentAt: player.messageSentAt || null,
                        hash,
                    },
                }
            );
            hashes[hash] = candidateId;

            if (player.joinedAt) {
                await sequelize.query(`UPDATE candidates SET createdAt=:createdAt WHERE id=:id`, {
                    replacements: {
                        createdAt: player.joinedAt,
                        id: candidateId,
                    },
                });
            }

            for (const rosterId of player.rosters) {
                await sequelize.query(`INSERT INTO candidateroster SET candidateId=:candidateId, rosterId=:rosterId`, {
                    replacements: { candidateId, rosterId },
                });
            }
            finished.push(email);
        }
    }

    context.result = { status: 'success', finished, failed };
};

const processRostersHook = (options) => async (context) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['superadmin'])(context);

    const { app } = context;

    await processRosters(app);

    return context;
};

const sendOneRosterMessage = (options) => async (context) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['superadmin'])(context);

    const { app } = context;
    const { email } = context.data;

    await processRosters(app, email);

    return context;
};

const getTrackingStats = (options) => async (context) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['superadmin'])(context);

    const sequelize = context.app.get('sequelizeClient');
    const dateTwoMonthAgo = dayjs.tz().subtract(2, 'month').format('YYYY-MM-DD HH:mm:ss');

    const [rows] = await sequelize.query(
        `SELECT code,
                opened,
                clicked,
                createdAt
           FROM tracking
          WHERE code!="test" AND
                createdAt>:dateTwoMonthAgo
       ORDER BY code, createdAt`,
        { replacements: { dateTwoMonthAgo } }
    );

    const data = rows.reduce((arr, item) => {
        const date = item.createdAt.slice(0, 10);

        let last = arr[arr.length - 1];
        if (!last || last.date !== date || last.code !== item.code) {
            last = { code: item.code, date, sent: 0, opened: 0, clicked: 0 };
            arr.push(last);
        }

        last.sent++;
        // it's possible that somebody has images disabled, so he can have "clicked" event, but not "opened"
        last.opened += item.clicked || item.opened ? 1 : 0;
        last.clicked += item.clicked;

        return arr;
    }, []);

    context.result = { status: 'success', data };

    return context;
};

const runCustomAction = (options) => async (context) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'publishUpdates') {
        await publishUpdates()(context);
    } else if (action === 'runActions') {
        await runActionsHook()(context);
    } else if (action === 'getGlobalStats') {
        await getGlobalStats()(context);
    } else if (action === 'syncGlobalState') {
        await syncGlobalState()(context);
    } else if (action === 'generateRabbits') {
        await generateRabbits()(context);
    } else if (action === 'generateBadges') {
        await generateBadges()(context);
    } else if (action === 'getActivityStats') {
        await getActivityStats()(context);
    } else if (action === 'getMotivationStats') {
        await getMotivationStats()(context);
    } else if (action === 'addLog') {
        await addLog()(context);
    } else if (action === 'requestCoachLesson') {
        await requestCoachLesson()(context);
    } else if (action === 'getVisualTestingResult') {
        await getVisualTestingResult()(context);
    } else if (action === 'acceptVisualChanges') {
        await acceptVisualChanges()(context);
    } else if (action === 'recalculateElo') {
        await recalculateElo()(context);
    } else if (action === 'getExcelFile') {
        await getExcelFile()(context);
    } else if (action === 'getGlobalPhotos') {
        await getGlobalPhotos()(context);
    } else if (action === 'generatePartnerLink') {
        await generatePartnerLink()(context);
    } else if (action === 'loginAsPlayer') {
        await loginAsPlayer()(context);
    } else if (action === 'uploadRosters') {
        await uploadRosters()(context);
    } else if (action === 'uploadCandidates') {
        await uploadCandidates()(context);
    } else if (action === 'processRosters') {
        await processRostersHook()(context);
    } else if (action === 'sendOneRosterMessage') {
        await sendOneRosterMessage()(context);
    } else if (action === 'getTrackingStats') {
        await getTrackingStats()(context);
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
