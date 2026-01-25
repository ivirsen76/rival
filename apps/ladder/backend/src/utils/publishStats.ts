// @ts-nocheck TODO
import type { Application } from '@feathersjs/feathers';
import axios from 'axios';
import qs from 'qs';
import logger from '@rival-tennis-ladder/logger';
import dayjs from './dayjs';
import { getSeasonName } from '../services/seasons/helpers';
import _pick from 'lodash/pick';
import { getPlayerName, comeFromOptions } from '../services/users/helpers';
import { getStatsMatches } from './sqlConditions';
import getCombinedConfig from './getCombinedConfig';
import { Photo, Season, User } from '../types';

export default async (app: Application) => {
    const sequelize = app.get('sequelizeClient');

    const { TL_STORE_TOKEN, TL_STORE_URL } = process.env;
    if (!TL_STORE_TOKEN || !TL_STORE_URL) {
        throw new Error('Do not have store credentials');
    }
    const credentials = {
        headers: { Authorization: `Bearer ${TL_STORE_TOKEN}` },
    };

    const config = await getCombinedConfig();
    if (process.env.TL_ENV !== 'production') {
        return;
    }

    const currentDate = dayjs();

    const cityId = await (async () => {
        const query = qs.stringify(
            {
                filters: {
                    name: {
                        $eq: config.city,
                    },
                    state: {
                        short: {
                            $eq: config.state,
                        },
                    },
                },
            },
            { encodeValuesOnly: true }
        );

        const response = await axios.get(`${TL_STORE_URL}/api/cities?${query}`, credentials);
        if (response.data.data.length !== 1) {
            throw new Error('Cannot get the city ID');
        }
        return response.data.data[0].id;
    })();

    // publish photos
    {
        const response = await axios.get(`${TL_STORE_URL}/api/photos?filters[city]=${cityId}`, credentials);
        const uploadedPhotos = (response.data.data as Photo[]).reduce((obj, item) => {
            // @ts-expect-error - I don't know how to fix it
            obj[item.attributes.url] = item;
            return obj;
        }, {}) as Record<string, Photo>;

        const [photos] = (await sequelize.query(`
            SELECT p.*,
                   u.slug AS userSlug
              FROM photos AS p,
                   users AS u
             WHERE p.userId=u.id AND
                   p.deletedAt IS NULL`)) as [Photo[]];
        const existingUrls = new Set(photos.map((item) => item.url400));
        for (const photo of photos) {
            const existingPhoto = uploadedPhotos[photo.url400];

            // strip emoji from title
            const title = photo.title?.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '') || '';

            if (existingPhoto) {
                if (title !== existingPhoto.attributes.title || photo.userSlug !== existingPhoto.attributes.userSlug) {
                    // update photo on server
                    await axios.put(
                        `${TL_STORE_URL}/api/photos/${existingPhoto.id}`,
                        {
                            data: {
                                title,
                                userSlug: photo.userSlug,
                            },
                        },
                        credentials
                    );
                }
            } else {
                // create photo
                await axios.post(
                    `${TL_STORE_URL}/api/photos`,
                    {
                        data: {
                            city: cityId,
                            userId: photo.userId,
                            userSlug: photo.userSlug,
                            url: photo.url400,
                            width: photo.width,
                            height: photo.height,
                            title,
                            allowShare: photo.allowShare,
                            allowComments: photo.allowComments,
                            isApproved: photo.isApproved,
                            createdDate: photo.createdAt,
                        },
                    },
                    credentials
                );
            }
        }

        // delete photos
        const photosToBeDeleted = Object.values(uploadedPhotos).filter(
            (item) => !existingUrls.has(item.attributes.url)
        );
        for (const photo of photosToBeDeleted) {
            await axios.delete(`${TL_STORE_URL}/api/photos/${photo.id}`, credentials);
        }
    }

    const stats = {
        otherCities: config.otherCities || '',
        levels: [],
        users: [],
        complaints: [],
        startDate: '',
    };

    // get started date
    {
        const [seasons] = (await sequelize.query(
            'SELECT id, startDate FROM seasons ORDER BY startDate LIMIT 0, 1'
        )) as [Season[]];
        if (seasons.length > 0) {
            stats.startDate = dayjs.tz(seasons[0].startDate).format('MMMM YYYY');
        }
    }

    // get current level list
    {
        const [seasons] = await sequelize.query('SELECT id FROM seasons ORDER BY startDate DESC LIMIT 0, 1');
        if (seasons.length > 0) {
            const seasonId = seasons[0].id;
            const [levels] = await sequelize.query(
                `
                SELECT l.id,
                       l.name
                  FROM tournaments AS t,
                       levels AS l
                 WHERE t.levelId=l.id AND
                       t.seasonId=:seasonId
              ORDER BY l.position`,
                { replacements: { seasonId } }
            );
            stats.levels = levels;
        }
    }

    // get users
    {
        const [users] = (await sequelize.query(`SELECT
                firstName,
                lastName,
                avatar,
                dominantHand,
                forehandStyle,
                backhandStyle,
                playerType,
                shot,
                racquet,
                strings,
                shoes,
                bag,
                brand,
                overgrip,
                balls,
                comeFrom,
                comeFromOther,
                createdAt,
                loggedAt,
                personalInfo,
                appearance
           FROM users
          WHERE isVerified=1 AND
                roles="player"`)) as [User[]];

        stats.users = users.map((user) => ({
            ..._pick(user, [
                'dominantHand',
                'forehandStyle',
                'backhandStyle',
                'playerType',
                'shot',
                'racquet',
                'strings',
                'shoes',
                'bag',
                'brand',
                'overgrip',
                'balls',
                'createdAt',
                'loggedAt',
                'personalInfo',
                'appearance',
            ]),
            name: getPlayerName(user),
            hasAvatar: user.avatar ? 'yes' : 'no',
            comeFrom: comeFromOptions[user.comeFrom] || '',
            comeFromOther: user.comeFromOther,
        }));
    }

    // get comlaints
    {
        const [complaints] = await sequelize.query(`SELECT
                c.reason,
                c.description,
                c.createdAt,
                u.firstName AS userFirstName,
                u.lastName AS userLastName,
                o.firstName AS opponentFirstName,
                o.lastName AS opponentLastName
           FROM complaints AS c
           JOIN users AS u ON c.userId=u.id
           JOIN users AS o ON c.opponentId=o.id`);
        stats.complaints = complaints.map((item) => ({
            complainer: `${item.userFirstName} ${item.userLastName}`,
            complainee: `${item.opponentFirstName} ${item.opponentLastName}`,
            ..._pick(item, ['reason', 'description', 'createdAt']),
        }));
    }

    // get total tournaments, users and matches
    {
        const [tournaments] = await sequelize.query(`
            SELECT DISTINCT p.tournamentId
                       FROM players AS p,
                            matches AS m
                      WHERE m.score IS NOT NULL AND
                            m.unavailable=0 AND
                            m.challengerId=p.id`);
        stats.totalTournaments = tournaments.length;

        const [users] = await sequelize.query('SELECT count(*) AS cnt FROM users WHERE isVerified=1');
        stats.totalUsers = users[0].cnt;

        const [matches] = await sequelize.query(`SELECT count(*) AS cnt FROM matches WHERE ${getStatsMatches()}`);
        stats.totalMatches = matches[0].cnt;
    }

    // get active users stats for the last two years
    {
        const totalWeeks = 52 * 2;
        const dateYearAgo = currentDate.subtract(totalWeeks + 5, 'week');

        const [matches] = await sequelize.query(
            `
            SELECT pc.userId AS challengerUserId,
                   pa.userId AS acceptorUserId,
                   m.playedAt
              FROM matches AS m
              JOIN players AS pc ON m.challengerId=pc.id
              JOIN players AS pa ON m.acceptorId=pa.id
             WHERE ${getStatsMatches('m')} AND
                   m.playedAt>:dateYearAgo`,
            { replacements: { dateYearAgo: dateYearAgo.format('YYYY-MM-DD HH:mm:ss') } }
        );

        const weeks = new Array(totalWeeks).fill(0).map((_) => new Set());

        for (const match of matches) {
            const playedAt = dayjs(match.playedAt);
            const diff = Math.floor(currentDate.diff(playedAt, 'week', true));

            for (const step of [0, 1, 2, 3, 4]) {
                const week = diff - step;
                if (weeks[week]) {
                    weeks[week].add(match.challengerUserId);
                    weeks[week].add(match.acceptorUserId);
                }
            }
        }

        stats.activePlayersHistory = weeks.map((week) => week.size);
    }

    // get payments stats for the last year
    {
        const totalWeeks = 52 * 2;
        const dateYearAgo = currentDate.subtract(totalWeeks + 13, 'week');

        const [payments] = await sequelize.query(
            `
            SELECT p.userId,
                   p.createdAt
              FROM payments AS p
             WHERE p.type="product" AND
                   p.createdAt>:dateYearAgo`,
            { replacements: { dateYearAgo: dateYearAgo.format('YYYY-MM-DD HH:mm:ss') } }
        );

        const weeks = new Array(totalWeeks).fill(0);

        for (const payment of payments) {
            const createdAt = dayjs(payment.createdAt);
            const diff = Math.floor(currentDate.diff(createdAt, 'week', true));

            // period of 3 months
            for (const step of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
                const week = diff - step;
                if (week in weeks) {
                    weeks[week]++;
                }
            }
        }

        // get only 30% for Raleigh;
        stats.paymentsHistory = config.isRaleigh ? weeks.map((num) => Math.floor(num * 0.3)) : weeks;
    }

    // get payment amount stats for the last 5 seasons
    {
        const WEEK_SHIFT = 3;
        const dateFiveYearsAgo = currentDate.subtract(5, 'year').format('YYYY-MM-DD HH:mm:ss');
        let [seasons] = await sequelize.query(
            `SELECT year, season, startDate, endDate
               FROM seasons
              WHERE endDate>:date
           ORDER BY startDate`,
            { replacements: { date: dateFiveYearsAgo } }
        );
        let dividerDate;
        seasons = seasons
            .map((item, index) => {
                if (index === 0) {
                    dividerDate = dayjs.tz(item.endDate).subtract(WEEK_SHIFT, 'week').format('YYYY-MM-DD HH:mm:ss');
                    return item;
                }

                const obj = {
                    ...item,
                    startDate: dividerDate,
                    sum: 0,
                };

                dividerDate = dayjs.tz(item.endDate).subtract(WEEK_SHIFT, 'week').format('YYYY-MM-DD HH:mm:ss');
                obj.endDate = dividerDate;

                return obj;
            })
            .slice(1);

        if (seasons.length > 0) {
            const [payments] = await sequelize.query(
                `SELECT amount, createdAt
                   FROM payments
                  WHERE type="payment" AND createdAt>:date
               ORDER BY createdAt`,
                { replacements: { date: dateFiveYearsAgo } }
            );
            if (payments.length > 0) {
                let currentSeasonIndex = 0;
                let currentSeason = seasons[currentSeasonIndex];
                for (const payment of payments) {
                    if (payment.createdAt < currentSeason.startDate) {
                        continue;
                    }
                    while (currentSeason && currentSeason.endDate < payment.createdAt) {
                        currentSeasonIndex++;
                        currentSeason = seasons[currentSeasonIndex];
                    }
                    if (!currentSeason) {
                        break;
                    }

                    // get only 30% for Raleigh;
                    currentSeason.sum += config.isRaleigh ? payment.amount * 0.3 : payment.amount;
                }

                stats.income = seasons.map((item) => _pick(item, ['year', 'season', 'sum']));
            }
        }
    }

    // get finalists and their address
    {
        stats.finalists = [];
        stats.championships = 0;
        stats.trophies = 0;
        stats.awards = 0;

        // latest season
        const [[pastSeason]] = await sequelize.query(
            'SELECT * FROM seasons WHERE endDate<:date AND endDate>:dateTwoMonthsAgo ORDER BY endDate DESC LIMIT 0, 1',
            {
                replacements: {
                    date: dayjs.tz().format('YYYY-MM-DD HH:mm:ss'),
                    dateTwoMonthsAgo: dayjs.tz().subtract(2, 'month').format('YYYY-MM-DD HH:mm:ss'),
                },
            }
        );

        if (pastSeason) {
            const [doublesMatches] = await sequelize.query(
                `SELECT m.challengerId,
                        m.acceptorId,
                        m.challenger2Id,
                        m.acceptor2Id
                   FROM matches AS m
                   JOIN players AS p ON m.challengerId=p.id
                   JOIN tournaments AS t ON p.tournamentId=t.id AND t.seasonId=:seasonId
                   JOIN levels AS l ON t.levelId=l.id AND l.type="doubles-team"
                  WHERE ${getStatsMatches('m')}`,
                { replacements: { seasonId: pastSeason.id } }
            );
            const playersWithMatches = doublesMatches.reduce((obj, item) => {
                [item.challengerId, item.challenger2Id, item.acceptorId, item.acceptor2Id]
                    .filter(Boolean)
                    .forEach((id) => {
                        obj[id] ||= 0;
                        obj[id]++;
                    });
                return obj;
            }, {});

            const [partners] = await sequelize.query(
                `SELECT p.id,
                        p.userId,
                        p.address,
                        p.addressVerification,
                        p.partnerId,
                        p.teamName,
                        u.firstName,
                        u.lastName,
                        u.email
                   FROM players AS p,
                        users AS u,
                        tournaments AS t,
                        levels AS l
                  WHERE p.userId=u.id AND
                        p.tournamentId=t.id AND
                        t.levelId=l.id AND
                        t.seasonId=:seasonId AND
                        l.type="doubles-team"
               ORDER BY p.id`,
                { replacements: { seasonId: pastSeason.id } }
            );
            const partnersObj = partners.reduce((obj, item) => {
                obj[item.id] = item;
                return obj;
            }, {});

            const [levels] = await sequelize.query(
                `
                    SELECT l.id,
                           l.slug,
                           l.type,
                           l.name
                      FROM matches AS m
                      JOIN players AS pc ON m.challengerId=pc.id
                      JOIN tournaments AS t ON pc.tournamentId=t.id
                      JOIN levels AS l ON t.levelId=l.id
                     WHERE m.type="final" AND
                           t.seasonId=:seasonId`,
                { replacements: { seasonId: pastSeason.id } }
            );
            const levelsObj = levels.reduce((obj, level) => {
                if (!obj[level.id]) {
                    obj[level.id] = level;
                }
                return obj;
            }, {});
            const championships = Object.values(levelsObj);

            stats.championships = championships.length;
            stats.trophies = championships.length * 2; // it's not 100% accurate, as Doubles could have 3 trophies
            stats.awards =
                championships.filter((item) => item.type !== 'doubles-team').length * (pastSeason.isFree ? 25 : 75);

            const [matches] = await sequelize.query(
                `
                    SELECT uc.firstName AS challengerFirstName,
                           uc.lastName AS challengerLastName,
                           uc.email AS challengerEmail,
                           pc.address AS challengerAddress,
                           pc.addressVerification AS challengerAddressVerification,
                           pc.rewardType AS challengerRewardType,
                           ua.firstName AS acceptorFirstName,
                           ua.lastName AS acceptorLastName,
                           ua.email AS acceptorEmail,
                           pa.address AS acceptorAddress,
                           pa.addressVerification AS acceptorAddressVerification,
                           pa.rewardType AS acceptorRewardType,
                           l.id AS levelId,
                           l.name AS levelName,
                           l.type AS levelType,
                           m.score,
                           m.winner,
                           m.challengerId,
                           m.acceptorId,
                           m.finalSpot
                      FROM matches AS m
                 LEFT JOIN players AS pc ON m.challengerId=pc.id
                 LEFT JOIN players AS pa ON m.acceptorId=pa.id
                 LEFT JOIN users AS uc ON pc.userId=uc.id
                 LEFT JOIN users AS ua ON pa.userId=ua.id
                      JOIN tournaments AS t ON (pc.tournamentId=t.id OR pa.tournamentId=t.id)
                      JOIN levels AS l ON t.levelId=l.id
                     WHERE m.type="final" AND
                           m.finalSpot<=7 AND
                           t.seasonId=:seasonId
                  ORDER BY m.finalSpot`,
                { replacements: { seasonId: pastSeason.id } }
            );

            const processedIds = new Set();
            for (const match of matches) {
                delete levelsObj[match.levelId];

                const isChallengerWinner = match.challengerId === match.winner;
                const isAcceptorWinner = match.acceptorId === match.winner;

                if (match.levelType === 'doubles-team') {
                    const list = [
                        ...(!match.score || isChallengerWinner ? [match.challengerId] : []),
                        ...(!match.score || isAcceptorWinner ? [match.acceptorId] : []),
                    ].filter((playerId) => playerId && !processedIds.has(playerId));

                    for (const playerId of list) {
                        const captainPlayerId = partnersObj[playerId].partnerId || partnersObj[playerId].id;
                        const captain = partnersObj[captainPlayerId];
                        partners
                            .filter(
                                (item) =>
                                    (item.id === captainPlayerId || item.partnerId === captainPlayerId) &&
                                    item.id in playersWithMatches
                            )
                            .forEach((item) => {
                                const partner = partnersObj[item.id];

                                stats.finalists.push({
                                    id: `${config.url}_${item.id}`,
                                    name: `${partner.firstName} ${partner.lastName}`,
                                    email: partner.email,
                                    address: captain.address,
                                    addressVerification: captain.addressVerification
                                        ? JSON.parse(captain.addressVerification)
                                        : null,
                                    teamName: captain.teamName,
                                    rewardType: 'credit',
                                    rewardAmount: config.doublesChampionReward,
                                    city: config.city,
                                    season: getSeasonName(pastSeason),
                                    level: match.levelName,
                                    levelId: match.levelId,
                                    isChallenger: true,
                                    isPlayed: Boolean(match.score),
                                    result: 'Champion',
                                });
                            });
                    }

                    // mark all players as processed
                    for (const playerId of [match.challengerId, match.acceptorId]) {
                        const captainPlayerId = partnersObj[playerId].partnerId || partnersObj[playerId].id;
                        partners
                            .filter((item) => item.id === captainPlayerId || item.partnerId === captainPlayerId)
                            .forEach((item) => {
                                processedIds.add(item.id);
                            });
                    }
                } else {
                    const championReward = pastSeason.isFree
                        ? config.singlesRunnerUpReward
                        : config.singlesChampionReward;
                    const runnerUpReward = pastSeason.isFree ? 0 : config.singlesChampionReward / 2;

                    const challenger = {
                        id: `${config.url}_${match.challengerId}`,
                        name: `${match.challengerFirstName} ${match.challengerLastName}`,
                        email: match.challengerEmail,
                        address: match.challengerAddress,
                        addressVerification: match.challengerAddressVerification
                            ? JSON.parse(match.challengerAddressVerification)
                            : null,
                        rewardType: match.challengerRewardType,
                        city: config.city,
                        season: getSeasonName(pastSeason),
                        level: match.levelName,
                        levelId: match.levelId,
                        isChallenger: true,
                        isPlayed: Boolean(match.score),
                        ...(match.score && match.finalSpot === 1
                            ? {
                                  result: isChallengerWinner ? 'Champion' : 'Runner-Up',
                                  rewardAmount: isChallengerWinner ? championReward : runnerUpReward,
                              }
                            : {}),
                    };
                    const acceptor = {
                        id: `${config.url}_${match.acceptorId}`,
                        name: `${match.acceptorFirstName} ${match.acceptorLastName}`,
                        email: match.acceptorEmail,
                        address: match.acceptorAddress,
                        addressVerification: match.acceptorAddressVerification
                            ? JSON.parse(match.acceptorAddressVerification)
                            : null,
                        rewardType: match.acceptorRewardType,
                        city: config.city,
                        season: getSeasonName(pastSeason),
                        level: match.levelName,
                        levelId: match.levelId,
                        isChallenger: false,
                        isPlayed: Boolean(match.score),
                        ...(match.score && match.finalSpot === 1
                            ? {
                                  result: isAcceptorWinner ? 'Champion' : 'Runner-Up',
                                  rewardAmount: isAcceptorWinner ? championReward : runnerUpReward,
                              }
                            : {}),
                    };

                    if (
                        match.challengerId &&
                        !processedIds.has(match.challengerId) &&
                        (match.finalSpot === 1 || !match.score || isChallengerWinner)
                    ) {
                        stats.finalists.push(challenger);
                    }
                    if (
                        match.acceptorId &&
                        !processedIds.has(match.acceptorId) &&
                        (match.finalSpot === 1 || !match.score || isAcceptorWinner)
                    ) {
                        stats.finalists.push(acceptor);
                    }

                    processedIds.add(match.challengerId);
                    processedIds.add(match.acceptorId);
                }
            }

            for (const level of Object.values(levelsObj)) {
                stats.finalists.push({
                    id: `${config.url}_${level.slug}_unknown_challenger`,
                    name: '- Unknown -',
                    email: '-',
                    address: '-',
                    city: config.city,
                    season: getSeasonName(pastSeason),
                    level: level.name,
                    isPlayed: false,
                });
                stats.finalists.push({
                    id: `${config.url}_${level.slug}_unknown_acceptor`,
                    name: '- Unknown -',
                    email: '-',
                    address: '-',
                    city: config.city,
                    season: getSeasonName(pastSeason),
                    level: level.name,
                    isPlayed: false,
                });
            }
        }
    }

    // get stats for current year
    {
        stats.years = [];
        const totalYears = 10;

        for (let year = totalYears - 1; year >= 0; year--) {
            const from = currentDate.subtract(year + 1, 'year').format('YYYY-MM-DD HH:mm:ss');
            const to = currentDate.subtract(year, 'year').format('YYYY-MM-DD HH:mm:ss');
            const dateTwoYearsAgo = currentDate.subtract(year + 2, 'year').format('YYYY-MM-DD HH:mm:ss');
            const yearStats = { from, to };

            {
                const [[matches]] = await sequelize.query(
                    `
                    SELECT count(*) AS cnt
                    FROM matches
                    WHERE ${getStatsMatches()} AND
                        playedAt>:from AND
                        playedAt<:to`,
                    { replacements: { from, to } }
                );
                yearStats.matches = matches.cnt;
            }

            {
                const query = `
                    SELECT uc.id AS challengerUserId,
                        ua.id AS acceptorUserId,
                        uc2.id AS challenger2UserId,
                        ua2.id AS acceptor2UserId,
                        uc.createdAt AS challengerCreatedAt,
                        ua.createdAt AS acceptorCreatedAt,
                        uc2.createdAt AS challenger2CreatedAt,
                        ua2.createdAt AS acceptor2CreatedAt
                    FROM matches AS m
                    LEFT JOIN players AS pc ON m.challengerId=pc.id
                    LEFT JOIN users AS uc ON pc.userId=uc.id
                    LEFT JOIN players AS pa ON m.acceptorId=pa.id
                    LEFT JOIN users AS ua ON pa.userId=ua.id
                    LEFT JOIN players AS pc2 ON m.challenger2Id=pc2.id
                    LEFT JOIN users AS uc2 ON pc2.userId=uc2.id
                    LEFT JOIN players AS pa2 ON m.acceptor2Id=pa2.id
                    LEFT JOIN users AS ua2 ON pa2.userId=ua2.id
                    WHERE ${getStatsMatches('m')} AND
                        m.playedAt>:from AND
                        m.playedAt<:to`;
                const getTotalPlayers = (list) =>
                    list.reduce((set, row) => {
                        set.add(row.challengerUserId);
                        set.add(row.acceptorUserId);
                        set.add(row.challenger2UserId);
                        set.add(row.acceptor2UserId);
                        return set;
                    }, new Set()).size;

                const [players] = await sequelize.query(query, {
                    replacements: { from, to },
                });
                yearStats.activePlayers = getTotalPlayers(players);
            }

            {
                const query = `SELECT count(*) AS cnt
                    FROM tournaments AS t,
                         seasons AS s
                   WHERE t.seasonId=s.id AND
                         s.startDate>:from AND
                         s.startDate<:to`;

                const [[ladders]] = await sequelize.query(query, {
                    replacements: { from, to },
                });
                yearStats.ladders = ladders.cnt;
            }

            {
                const query = `SELECT DISTINCT userId
                         FROM payments
                        WHERE type="product" AND
                              createdAt>:from AND
                              createdAt<:to`;

                let [playersThisYear] = await sequelize.query(query, { replacements: { from, to } });
                playersThisYear = playersThisYear.reduce((set, row) => {
                    set.add(row.userId);
                    return set;
                }, new Set());

                const [playersPrevYear] = await sequelize.query(query, {
                    replacements: { from: dateTwoYearsAgo, to: from },
                });
                const retainedPlayers = playersPrevYear.filter((item) => playersThisYear.has(item.userId));

                yearStats.playersPaidLastYear = playersPrevYear.length;
                yearStats.playersPaidThisYearAgain = retainedPlayers.length;
            }

            {
                const query = `SELECT count(*) AS cnt, sum(amount) AS sum
                         FROM payments
                        WHERE type="product" AND
                              createdAt>:from AND
                              createdAt<:to`;

                const [[payments]] = await sequelize.query(query, { replacements: { from, to } });
                yearStats.paymentsCount = config.isRaleigh ? Math.floor(payments.cnt * 0.3) : payments.cnt;
                yearStats.paymentsSum = Math.floor((-payments.sum / 100) * (config.isRaleigh ? 0.3 : 1));
            }

            stats.years.push(yearStats);
        }
    }

    await axios.put(`${TL_STORE_URL}/api/cities/${cityId}`, { data: { stats } }, credentials);

    logger.info('Stats successfuly published');
};
