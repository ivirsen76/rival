// @ts-nocheck
import type { HookContext } from '@feathersjs/feathers';
import { NotFound, Unprocessable } from '@feathersjs/errors';
import { getTournament, getSeeds } from './selectors';
import redis from '../redisHooks';
import dayjs from '../../utils/dayjs';
import { disallow } from 'feathers-hooks-common';
import calculateRank from '../matches/calculateRank';
import sendFinalReminders from '../matches/sendFinalReminders';
import compareFields from '../../utils/compareFields';
import _pick from 'lodash/pick';
import NodeCache from 'node-cache';
import generateBotPrediction from './generateBotPrediction';
import renderImage from '../../utils/renderImage';
import bracketsGeneratedTemplate from '../../emailTemplates/bracketsGenerated';
import { getStatsMatches } from '../../utils/sqlConditions';
import { decodeAction } from '../../utils/action';
import { getAge } from '../../utils/helpers';
import { POOL_PARTNER_ID } from '../../constants';
import { getEmailContact, getPlayerName } from '../users/helpers';
import { optionalAuthenticate } from '../commonHooks';
import type { Coach, Level, Match, Player, Tournament, User } from '../../types';

const cache = new NodeCache({ useClones: false });
const events = new Set();

const setAgeCompatibleFlag = () => async (context: HookContext) => {
    const { config } = context.params;
    const sequelize = context.app.get('sequelizeClient');
    const currentUser = context.params.user as User;
    if (!currentUser?.birthday) {
        return context;
    }

    const players: (Player & { isAgeCompatible: boolean })[] = Object.values(context.result.data.players);
    const isTournamentPlayer = players.find((item) => item.userId === currentUser.id);
    if (!isTournamentPlayer) {
        return context;
    }

    const userIds = players.map((item) => item.userId);
    const [rows] = (await sequelize.query(
        `SELECT id, birthday FROM users WHERE birthday IS NOT NULL AND id IN (${userIds.join(',')})`
    )) as [User[]];

    const ages = rows.reduce(
        (obj, item) => {
            obj[item.id] = getAge(item.birthday!);
            return obj;
        },
        {} as Record<number, number>
    );

    const currentUserAge = getAge(currentUser.birthday);
    for (const player of players) {
        if (ages[player.userId]) {
            player.isAgeCompatible = Math.abs(currentUserAge - ages[player.userId]) <= config.maxAgeCompatibleGap;
        }
    }

    return context;
};

const populateTournament =
    () =>
    async (context: HookContext): Promise<HookContext> => {
        if (context.result) {
            return context;
        }

        const { year, season, level } = context.params.query as { year: string; season: string; level: string };
        const { service } = context;
        const { config } = context.params;
        const sequelize = context.app.get('sequelizeClient');
        const { tournaments, levels, seasons, users, matches } = sequelize.models;
        const { TL_URL } = process.env;

        let tournamentInfo;

        // get tournament info
        {
            type TournamentInfo = Tournament & {
                'season.startDate': string;
                'season.year': number;
                'season.season': string;
                'level.type': string;
                prevTournament: TournamentInfo;
                nextTournament: TournamentInfo;
            };

            const result = (await service.find({
                sequelize: {
                    include: [
                        {
                            model: levels,
                            attributes: ['name', 'slug', 'type', 'baseTlr', 'maxTlr'],
                            where: { slug: level },
                        },
                        {
                            model: seasons,
                            attributes: [
                                'year',
                                'season',
                                'startDate',
                                'endDate',
                                'hasFinalTournament',
                                'closeReason',
                                'isFree',
                            ],
                        },
                    ],
                },
            })) as { data: TournamentInfo[] };

            result.data.sort((a, b) => a['season.startDate'].localeCompare(b['season.startDate']));

            const index = result.data.findIndex(
                (item) => item['season.year'] === Number(year) && item['season.season'] === season
            );

            if (index === -1) {
                throw new NotFound('Not found');
            }

            tournamentInfo = result.data[index];
            tournamentInfo.prevTournament = result.data[index - 1];
            tournamentInfo.nextTournament = result.data[index + 1];
        }
        const isSingles = tournamentInfo['level.type'] === 'single';
        const isDoubles = tournamentInfo['level.type'] === 'doubles';

        // get all season tournaments
        {
            const [result] = (await sequelize.query(
                `SELECT l.name,
                    l.slug
               FROM levels AS l,
                    tournaments AS t
              WHERE t.seasonId=:seasonId AND
                    t.levelId=l.id
           ORDER BY l.position`,
                { replacements: { seasonId: tournamentInfo.seasonId } }
            )) as [Level[]];
            tournamentInfo.allLevels = result;
        }

        // get next season
        {
            const [result] = await sequelize.query(
                'SELECT * FROM seasons WHERE startDate>:date ORDER BY startDate LIMIT 0, 1',
                { replacements: { date: tournamentInfo['season.endDate'] } }
            );

            if (result.length === 1) {
                tournamentInfo.nextSeason = result[0];
            }
        }

        // Recalculate rank for the current season.
        // Check if the next season has not started yet.
        // We need that for proposals.
        const isCurrentSeason =
            !tournamentInfo.nextSeason || dayjs.tz().isBefore(dayjs.tz(tournamentInfo.nextSeason.startDate));
        if (isCurrentSeason) {
            await calculateRank(tournamentInfo.id);
        }

        // get players
        {
            const result = await tournaments.findByPk(tournamentInfo.id, {
                include: {
                    model: users,
                    attributes: [
                        'id',
                        'firstName',
                        'lastName',
                        'email',
                        'slug',
                        'avatar',
                        'avatarObject',
                        'gender',
                        'banDate',
                        'banReason',
                        'deletedAt',
                        'isSoftBan',
                    ],
                },
            });
            tournamentInfo.users = result.users;
        }

        // get readyForFinal status
        {
            const [result] = await sequelize.query(
                `SELECT p.userId,
                    l.type AS levelType,
                    l.name AS levelName
               FROM players AS p,
                    tournaments AS t,
                    levels AS l
              WHERE p.tournamentId=t.id AND
                    t.levelId=l.id AND
                    p.tournamentId!=:tournamentId AND
                    p.readyForFinal=1 AND
                    t.seasonId=:seasonId`,
                { replacements: { tournamentId: tournamentInfo.id, seasonId: tournamentInfo.seasonId } }
            );
            tournamentInfo.playingAnotherFinal = result;
        }

        // get teams
        {
            const [result] = await sequelize.query(
                `SELECT tm.playerId,
                    tm.role,
                    t.id,
                    t.name,
                    t.customName,
                    t.invitedPlayers,
                    t.invitedAt,
                    t.playingNextWeek,
                    t.createdAt
               FROM teams AS t,
                    teammembers AS tm
              WHERE t.tournamentId=:id AND
                    tm.teamId=t.id
           ORDER BY t.createdAt, tm.id`,
                { replacements: { id: tournamentInfo.id } }
            );
            tournamentInfo.teams = result.reduce((arr, item) => {
                const player = { id: item.playerId, role: item.role };

                if (arr.length > 0 && arr[arr.length - 1].id === item.id) {
                    arr[arr.length - 1].players.push(player);
                    if (!item.playingNextWeek && arr[arr.length - 1].playingNextWeek.length < 3) {
                        arr[arr.length - 1].playingNextWeek.push(player.id);
                    }
                } else {
                    arr.push({
                        ..._pick(item, ['id', 'createdAt', 'name', 'customName']),
                        canInvite: !item.invitedAt || !dayjs.tz().isSame(dayjs.tz(item.invitedAt), 'day'),
                        invitedPlayers: item.invitedPlayers ? item.invitedPlayers.split(',').map(Number) : [],
                        players: [player],
                        playingNextWeek: item.playingNextWeek
                            ? item.playingNextWeek.split(',').map(Number)
                            : [player.id],
                    });
                }

                return arr;
            }, []);
        }

        // get battles
        {
            const [result] = await sequelize.query(
                `SELECT b.id,
                    b.team1,
                    b.team2,
                    b.week,
                    b.type
               FROM battles AS b,
                    teams AS t
              WHERE b.team1=t.id AND
                    t.tournamentId=:id
           ORDER BY b.week, b.id`,
                { replacements: { id: tournamentInfo.id } }
            );
            tournamentInfo.battles = result;
        }

        // get matches
        {
            const [result] = await sequelize.query(
                `SELECT m.*, p.tournamentId
               FROM matches AS m, players AS p
              WHERE m.isActive=1 AND
                    (m.challengerId=p.id OR m.challengerId IS NULL AND m.acceptorId=p.id) AND
                    p.tournamentId=:id
           ORDER BY m.playedAt DESC, m.challengerId, m.id DESC`,
                { replacements: { id: tournamentInfo.id } }
            );
            tournamentInfo.matches = result;
        }

        // get doubles matches
        if (isDoubles) {
            const [result] = await sequelize.query(
                `SELECT dm.*
               FROM doublesmatches AS dm,
                    players AS p
              WHERE (dm.player1Id=p.id OR dm.player4Id=p.id) AND
                    p.tournamentId=:id`,
                { replacements: { id: tournamentInfo.id } }
            );
            tournamentInfo.doublesMatches = result;
        }

        // get elo
        {
            const key = 'oldMatches';
            const { oldMatches, startDate } = (() => {
                if (process.env.NODE_ENV === 'test' || process.env.CI || !cache.has(key)) {
                    return { oldMatches: [], startDate: '1999-12-12 00:00:00' };
                }

                return cache.get(key);
            })();

            const query = `
            SELECT m.id,
                   m.challengerId,
                   m.acceptorId,
                   m.challengerElo,
                   m.acceptorElo,
                   m.challengerEloChange,
                   m.acceptorEloChange,
                   m.challengerMatches,
                   m.acceptorMatches,
                   m.winner,
                   m.playedAt,
                   m.type,
                   m.wonByDefault,
                   m.wonByInjury,
                   t.seasonId,
                   pc.tournamentId,
                   pc.userId AS challengerUserId,
                   pa.userId AS acceptorUserId
              FROM matches AS m
              JOIN players AS pc ON m.challengerId=pc.id
              JOIN players AS pa ON m.acceptorId=pa.id
              JOIN tournaments AS t ON t.id=pc.tournamentId
              JOIN levels AS l ON t.levelId=l.id AND l.baseTlr IS NOT NULL AND l.type="single"
             WHERE ${getStatsMatches('m')} AND
                   m.playedAt>"${startDate}"
          ORDER BY m.playedAt, m.id
        `;
            const result = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
            tournamentInfo.eloMatches = [...oldMatches, ...result];

            if (!cache.has(key)) {
                const dateMonthAgo = dayjs.tz().subtract(1, 'month').format('YYYY-MM-DD HH:mm:ss');
                cache.set(key, {
                    oldMatches: tournamentInfo.eloMatches.filter((match: Match) => match.playedAt <= dateMonthAgo),
                    startDate: dateMonthAgo,
                });
            }
        }

        // get coaches
        {
            const [result] = await sequelize.query(
                `SELECT *
            FROM coaches
           WHERE isActive=1 AND
                 (activeTill IS NULL OR activeTill>:currentDate)`,
                { replacements: { currentDate: dayjs.tz().format('YYYY-MM-DD HH:mm:ss') } }
            );
            tournamentInfo.coaches = result.map((coach: Coach) => ({
                ...coach,
                bullets: coach.bullets ? JSON.parse(coach.bullets) : [],
                locationAddress: coach.locationAddress ? JSON.parse(coach.locationAddress) : [],
            }));
        }

        // get warnings about high TLR
        {
            const [result] = await sequelize.query('SELECT tableId FROM actions WHERE name="highProjectedTlrWarning"');
            tournamentInfo.playersWithHighTlrWarning = (result as { tableId: number }[]).map((item) => item.tableId);
        }

        const data = await getTournament({
            data: JSON.parse(JSON.stringify(tournamentInfo)),
            includeEmail: !context.params.provider, // include email only for the internal calls
            config,
            app: context.app,
        });

        const key = `generating-tournament-bracket-${tournamentInfo.id}`;

        // Generate final matches
        if (
            isCurrentSeason &&
            tournamentInfo['season.hasFinalTournament'] &&
            !data.cancelFinalTournament &&
            dayjs.tz().isAfter(dayjs.tz(tournamentInfo['season.endDate'])) &&
            !events.has(key)
        ) {
            // we are using cache to not generate brackets twice for parallel requests
            events.add(key);

            let shouldPopulateTournament = false;
            let hasBracketContest = false;

            const hasFinalMatches = tournamentInfo.matches.some((match) => match.type === 'final' && !match.battleId);
            if (!hasFinalMatches) {
                const allPlayers = Object.values(data.players);
                const finalSize = data.playersBeforeDeadline >= 75 ? 16 : data.playersBeforeDeadline >= 50 ? 12 : 8;
                const seedSize = finalSize === 12 ? 8 : finalSize / 2;

                const finalPlayers = allPlayers
                    .filter((player) => {
                        return player.isActive && player.readyForFinal === 1 && player.partnerId === null;
                    })
                    .sort(
                        compareFields(
                            'stats.rank',
                            'stats.matches-desc',
                            'stats.matchesWon-desc',
                            'firstName',
                            'lastName'
                        )
                    )
                    .slice(0, finalSize)
                    .map((player, index) => ({ ...player, seedNumber: index + 1 }));
                hasBracketContest = isSingles && finalPlayers.length >= config.minPlayersForPrediction;
                if (finalPlayers.length > 1) {
                    const seeds = getSeeds(finalPlayers, true);

                    for (const seed of seeds) {
                        await matches.create({
                            initial: 3,
                            ...(seed.challenger && {
                                challengerId: seed.challenger.id,
                                challengerSeed: seed.challenger.seedNumber <= seedSize ? seed.challenger.seedNumber : 0,
                            }),
                            ...(seed.acceptor && {
                                acceptorId: seed.acceptor.id,
                                acceptorSeed: seed.acceptor.seedNumber <= seedSize ? seed.acceptor.seedNumber : 0,
                            }),
                            type: 'final',
                            finalSpot: seed.finalSpot,
                        });
                    }

                    sendFinalReminders(context, tournamentInfo.id);

                    shouldPopulateTournament = true;
                }

                if (hasBracketContest) {
                    const [finalMatches] = await sequelize.query(
                        `SELECT m.id,
                                m.challengerId,
                                m.acceptorId,
                                m.finalSpot
                           FROM matches AS m,
                                players AS p
                          WHERE m.type="final" AND
                                (m.challengerId=p.id OR m.challengerId IS NULL AND m.acceptorId=p.id) AND
                                p.tournamentId=:tournamentId
                       ORDER BY m.finalSpot DESC`,
                        { replacements: { tournamentId: tournamentInfo.id } }
                    );
                    const botPrediction = generateBotPrediction(finalMatches, data.players);

                    await tournaments.update(
                        { botPrediction: JSON.stringify(botPrediction) },
                        { where: { id: tournamentInfo.id } }
                    );
                }

                // send message about generated brackets
                if (isSingles) {
                    // don't wait for it
                    (async () => {
                        const [players] = await sequelize.query(
                            `
                            SELECT u.firstName, u.lastName, u.email
                              FROM users AS u,
                                   players AS p
                             WHERE u.id=p.userId AND
                                   u.subscribeForReminders=1 AND
                                   p.tournamentId=:tournamentId AND
                                   p.isActive=1`,
                            { replacements: { tournamentId: tournamentInfo.id } }
                        );

                        const emails = players.map(getEmailContact);
                        if (emails.length === 0) {
                            return;
                        }

                        const bracketImage = await renderImage(
                            `${TL_URL}/image/bracket?tournamentId=${tournamentInfo.id}`
                        );

                        await context.app.service('api/emails').create({
                            to: emails,
                            subject: hasBracketContest
                                ? 'Tournament Matchups and Rival Bracket Battle'
                                : 'Tournament Matchups',
                            html: bracketsGeneratedTemplate({
                                config: context.params.config,
                                bracketImage,
                                seasonName: data.season,
                                levelName: data.level,
                                topPlayers: finalSize,
                                hasBracketContest,
                            }),
                        });
                    })();
                }
            }

            events.delete(key);

            if (shouldPopulateTournament) {
                // run this hook once again
                return populateTournament()(context);
            }
        }

        context.result = { data };

        return context;
    };

const isCacheStale = (data: any) => {
    if (!data.createdAt) {
        return true;
    }

    return !dayjs.tz().isSame(dayjs.tz(data.createdAt), 'day');
};

const getFinalMatches = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const tournamentId = Number(context.id);

    const [matches] = await sequelize.query(
        `SELECT m.*
           FROM matches AS m,
                players AS p
          WHERE (m.challengerId=p.id OR m.challengerId IS NULL AND m.acceptorId=p.id) AND
                p.tournamentId=:tournamentId AND
                m.type="final" AND
                m.battleId IS NULL
       ORDER BY m.finalSpot DESC`,
        { replacements: { tournamentId } }
    );

    const [players] = await sequelize.query(
        `SELECT p.id,
                u.firstName,
                u.lastName,
                u.avatar,
                u.id AS userId
           FROM players AS p,
                users AS u
          WHERE p.userId=u.id AND
                p.tournamentId=:tournamentId`,
        { replacements: { tournamentId } }
    );

    context.result = {
        matches,
        players: players.reduce((obj, item) => {
            obj[item.id] = item;
            return obj;
        }, {}),
    };

    return context;
};

const getDoublesInfo = () => async (context: HookContext) => {
    let action;
    try {
        action = decodeAction(context.data.payload);
    } catch (e) {
        throw new Unprocessable((e as Error).message);
    }

    if (action.name !== 'joinDoubles') {
        throw new Unprocessable('The link is broken.');
    }

    const sequelize = context.app.get('sequelizeClient');
    const { config } = context.params;
    const playerId = Number(action.playerId);
    const [[player]] = await sequelize.query(
        `
        SELECT u.firstName,
               u.lastName,
               p.tournamentId,
               s.startDate,
               s.endDate,
               s.year,
               s.season,
               l.slug AS levelSlug,
               l.name AS levelName
          FROM players AS p,
               users AS u,
               tournaments AS t,
               seasons AS s,
               levels AS l
         WHERE p.userId=u.id AND
               p.id=:playerId AND
               p.tournamentId=t.id AND
               p.isActive=1 AND
               (p.partnerId IS NULL OR p.partnerId=:poolPartnerId) AND
               t.seasonId=s.id AND
               t.levelId=l.id`,
        { replacements: { playerId, poolPartnerId: POOL_PARTNER_ID } }
    );
    if (!player) {
        context.result = { status: 'error', message: 'The player who provided this link is no longer a captain.' };
        return context;
    }

    const currentDate = dayjs.tz();
    if (currentDate.isAfter(dayjs.tz(player.endDate))) {
        context.result = { status: 'error', message: 'The season is over.' };
        return context;
    }

    // Check for the team size
    const [teammates] = await sequelize.query(`SELECT id FROM players WHERE id=:playerId OR partnerId=:playerId`, {
        replacements: { playerId },
    });
    if (teammates.length >= config.maxPlayersPerDoublesTeam) {
        context.result = {
            status: 'error',
            message: `The team already has the maximum of ${config.maxPlayersPerDoublesTeam} players.`,
        };
        return context;
    }

    const [allPlayers] = await sequelize.query(`SELECT userId FROM players WHERE tournamentId=:tournamentId`, {
        replacements: { tournamentId: player.tournamentId },
    });

    context.result = {
        status: 'success',
        userIds: allPlayers.map((item) => item.userId),
        partnerName: getPlayerName(player),
        levelName: player.levelName,
        ladderUrl: `/season/${player.year}/${player.season}/${player.levelSlug}`,
        season: { startDate: player.startDate }, // it's enough for our purposes
    };

    return context;
};

const runCustomAction = () => async (context: HookContext) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'getFinalMatches') {
        await getFinalMatches()(context);
    } else if (action === 'getDoublesInfo') {
        await getDoublesInfo()(context);
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
        find: [],
        get: [optionalAuthenticate(), redis.load({ isCacheStale }), populateTournament()],
        create: [disallow()],
        update: [runCustomAction()],
        patch: [disallow()],
        remove: [disallow()],
    },

    after: {
        all: [],
        find: [],
        get: [redis.save(), setAgeCompatibleFlag()],
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
