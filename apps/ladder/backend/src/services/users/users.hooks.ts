import type { HookContext } from '@feathersjs/feathers';
import { NotFound, Unprocessable } from '@feathersjs/errors';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { hooks } from '@feathersjs/authentication-local';
import { setField } from 'feathers-authentication-hooks';
import { disallow, keep } from 'feathers-hooks-common';
import { getSeasonName } from '../seasons/helpers';
import { revertScore } from '../matches/helpers';
import { getEmailContact, getPlayerName, hideEmail, hidePhone } from './helpers';
import commonValidate from './commonValidate';
import { throwValidationErrors, getSchemaErrors, generateReferralCode } from '../../helpers';
import { hasAnyRole, purgeUserCache, logEvent, trim, generateBadges, populateSalt } from '../commonHooks';
import _isEmpty from 'lodash/isEmpty';
import _uniq from 'lodash/uniq';
import _uniqWith from 'lodash/uniqWith';
import _omit from 'lodash/omit';
import _pick from 'lodash/pick';
import _set from 'lodash/set';
import dayjs from '../../utils/dayjs';
import { getAge } from '../../utils/helpers';
import newEmailVerificationTemplate from '../../emailTemplates/newEmailVerification';
import emailVerificationTemplate from '../../emailTemplates/emailVerification';
import signUpNotificationTemplate from '../../emailTemplates/signUpNotification';
import referralRegisteredTemplate from '../../emailTemplates/referralRegistered';
import bcrypt from 'bcryptjs';
import yup from '../../packages/yup';
import { getVerificationCode, formatUserName, getTbStats, comeFromOptions } from './helpers';
import { getEmailsFromList } from '../settings/helpers';
import sharp from 'sharp';
import DatauriParser from 'datauri/parser';
import { decodeAction } from '../../utils/action';
import { getUsersStats, applyNewBadges } from '../../utils/applyNewBadges';
import { unless, isProvider } from 'feathers-hooks-common';
import searchReferrer from './searchReferrer';
import compareFields from '../../utils/compareFields';
import checkEmail from './checkEmail';
import { encrypt, decrypt } from '../../utils/crypt';
import md5 from 'md5';
import { BYE_ID, POOL_PARTNER_ID } from '../../constants';
import isObsoleteBadge from './isObsoleteBadge';
import { getStatsMatches } from '../../utils/sqlConditions';
import populateInformation from './populateInformation';
import getCustomEmail from '../../emailTemplates/getCustomEmail';
import merge from 'deepmerge';
import twilio from 'twilio';

const { hashPassword, protect } = hooks;

const limitToUser = setField({
    from: 'params.user.id',
    as: 'params.query.id',
});

// It's not a hook, just a helper
const getUserBadgesStats = async (user, context) => {
    const sequelize = context.app.get('sequelizeClient');
    const { stats, badgesHistory } = await getUsersStats({ sequelize, userId: user.id });

    const [userLevels] = await sequelize.query(
        `SELECT DISTINCT
               l.id,
               l.slug,
               l.name,
               l.position
          FROM players AS p,
               tournaments AS t,
               levels AS l
         WHERE p.tournamentId=t.id AND
               t.levelId=l.id AND
               p.userId=:id`,
        { replacements: { id: user.id } }
    );
    for (const level of userLevels) {
        if (stats.levels[level.id]) {
            stats.levels[level.id].slug = level.slug;
            stats.levels[level.id].name = level.name;
            stats.levels[level.id].position = level.position;
        }
    }

    const [achievedBadges] = await sequelize.query(
        `
        SELECT code,
               achievedAt
          FROM badges
         WHERE userId=:id`,
        { replacements: { id: user.id } }
    );

    // get opponents
    const opponents = {};
    {
        const [rows] = await sequelize.query(`SELECT id, firstName, lastName, avatar, avatarObject FROM users`);
        const allUsers = rows.reduce((obj, row) => {
            obj[row.id] = row;
            return obj;
        }, {});

        const collectUser = (id) => {
            if (!id || opponents[id]) {
                return;
            }

            opponents[id] = allUsers[id];
        };
        const [matches] = await sequelize.query(
            `
            SELECT pc.userId AS challengerUserId,
                   pc2.userId AS challenger2UserId,
                   pa.userId AS acceptorUserId,
                   pa2.userId AS acceptor2UserId
              FROM matches AS m
              JOIN players AS pc ON m.challengerId=pc.id
              JOIN players AS pa ON m.acceptorId=pa.id
         LEFT JOIN players AS pc2 ON m.challenger2Id=pc2.id
         LEFT JOIN players AS pa2 ON m.acceptor2Id=pa2.id
             WHERE m.wonByDefault=0 AND
                   m.unavailable=0 AND
                   (pc.userId=:id OR pa.userId=:id OR pc2.userId=:id OR pa2.userId=:id)`,
            { replacements: { id: user.id } }
        );
        for (const match of matches) {
            collectUser(match.challengerUserId);
            collectUser(match.acceptorUserId);
            collectUser(match.challenger2UserId);
            collectUser(match.acceptor2UserId);
        }
    }

    return {
        stats,
        achievedBadges: _uniqWith([...badgesHistory, ...achievedBadges], (a, b) => a.code === b.code)
            .filter((badge) => !isObsoleteBadge(badge.code))
            .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt)),
        opponents,
    };
};

const getSequelizeData = async (sequelize, ...params) => {
    const [result] = await sequelize.query(...params);
    return result;
};

const validateCreate = () => async (context: HookContext) => {
    const errors = commonValidate(context.data);

    if (!errors.password) {
        if (!context.data.password) {
            errors.password = 'Password is required';
        }
    }

    if (!context.data.birthday) {
        errors.birthday = 'Birth date is required';
    }

    if (_isEmpty(errors) && context.data.comeFromOther !== 'Rabbit') {
        const { isDeliverable, message } = await checkEmail(context.data.email);
        if (!isDeliverable) {
            errors.email = message;
        }
    }

    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    return context;
};

const capitalize =
    (...fields) =>
    (context: HookContext) => {
        for (const field of fields) {
            if (context.data[field] && typeof context.data[field] === 'string') {
                context.data[field] = formatUserName(context.data[field]);
            }
        }

        return context;
    };

const validatePatch = () => async (context: HookContext) => {
    const currentUser = context.params.user;
    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;

    // leave just errors for context.data fields
    const errors = _pick(commonValidate(context.data), Object.keys(context.data));
    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    // populate the rest of the data
    context.data = {
        ...currentUser,
        ...context.data,
    };
    context.data.information = populateInformation(context.data.information);

    if (context.data.email && currentUser.email !== context.data.email) {
        const foundPlayer = await users.findOne({ where: { email: context.data.email } });
        if (foundPlayer) {
            throw new Unprocessable('Invalid request', {
                errors: { email: 'This email is already used by another player.' },
            });
        }

        const { isDeliverable, message } = await checkEmail(context.data.email);
        if (!isDeliverable) {
            throw new Unprocessable('Invalid request', { errors: { email: message } });
        }
    }

    return context;
};

const registerNewEmail = () => async (context: HookContext) => {
    const currentUser = context.params.user;
    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;

    if (currentUser.email !== context.data.email) {
        const code = getVerificationCode();

        await users.update(
            {
                newEmail: context.data.email,
                newEmailCode: code,
            },
            { where: { id: currentUser.id } }
        );

        // We don't have to wait for the email sent
        const fullName = getPlayerName(currentUser);
        context.app.service('api/emails').create({
            to: [{ name: fullName, email: context.data.email, force: true }],
            subject: `${code} is your confirmation code`,
            html: newEmailVerificationTemplate(context.params.config, {
                verificationCode: code,
            }),
        });
    }

    return context;
};

const populateUser = () => async (context: HookContext) => {
    const userSlug = context.data.slug;
    const sequelize = context.app.get('sequelizeClient');
    const { config } = context.params;

    let isLoggedIn = true;
    try {
        await authenticate('jwt')(context);
    } catch (e) {
        isLoggedIn = false;
    }

    const currentDate = dayjs.tz();
    let fullUserInfo;

    // get user info
    {
        const [result] = await sequelize.query('SELECT * FROM users WHERE slug=:slug', {
            replacements: { slug: userSlug },
        });
        if (result.length !== 1) {
            throw new NotFound('Not found');
        }

        fullUserInfo = result[0];
        const data = _omit(result[0], [
            'banDate',
            'banReason',
            'birthday',
            'comeFrom',
            'comeFromOther',
            'referralCode',
            'referrerUserId',
            'createdAt',
            'isVerified',
            'loggedAt',
            'changelogSeenAt',
            'newEmail',
            'newEmailCode',
            'password',
            'salt',
            'subscribeForProposals',
            'subscribeForReminders',
            'subscribeForNews',
            'subscribeForBadges',
            'updatedAt',
            'verificationCode',
            'badgesStats',
            'showAge',
        ]);

        // optionally show age
        if (fullUserInfo.showAge && fullUserInfo.birthday) {
            data.age = Math.floor(getAge(fullUserInfo.birthday));
        }

        const hideContacts = () => {
            data.email = hideEmail(data.email);
            data.phone = hidePhone();
        };

        if (isLoggedIn && context.params.user.roles.includes('admin')) {
            data.comeFrom = result[0].comeFrom;
            data.comeFromOther = result[0].comeFromOther;
            data.createdAt = result[0].createdAt;
            data.loggedAt = result[0].loggedAt;
        }

        if (isLoggedIn) {
            const [[row]] = await sequelize.query(
                'SELECT * FROM userrelations WHERE userId=:userId AND opponentId=:opponentId',
                { replacements: { userId: context.params.user.id, opponentId: fullUserInfo.id } }
            );

            if (row?.note) {
                data.note = decrypt(row.note);
            }
        }

        const isHidingContacts = await (async () => {
            if (!isLoggedIn) {
                return true;
            }
            if (context.params.user.id === data.id) {
                return false;
            }
            if (context.params.user.roles.includes('admin') || context.params.user.roles.includes('manager')) {
                return false;
            }

            // Check Doubles team captains, teammates and pool players
            // For the current and next seasons
            {
                const threeWeeksAgo = currentDate.subtract(3, 'week');
                const doublesTeamTournaments = await getSequelizeData(
                    sequelize,
                    `SELECT t.id
                       FROM tournaments AS t,
                            levels AS l,
                            seasons AS s
                      WHERE t.levelId=l.id AND
                            t.seasonId=s.id AND
                            l.type="doubles-team" AND
                            s.endDate>:threeWeeksAgo AND
                            t.id IN (SELECT tournamentId FROM players WHERE userId=:currentUserId AND isActive=1) AND
                            t.id IN (SELECT tournamentId FROM players WHERE userId=:viewedUserId)
                `,
                    {
                        replacements: {
                            threeWeeksAgo: threeWeeksAgo.format('YYYY-MM-DD HH:mm:ss'),
                            currentUserId: context.params.user.id,
                            viewedUserId: data.id,
                        },
                    }
                );

                if (doublesTeamTournaments.length > 0) {
                    const doublesTeamTournamentIds = doublesTeamTournaments.map((item) => item.id);
                    const players = await getSequelizeData(
                        sequelize,
                        `SELECT id, partnerId, tournamentId
                       FROM players
                      WHERE userId=:currentUserId AND
                            tournamentId IN (${doublesTeamTournamentIds.join(',')})`,
                        { replacements: { currentUserId: context.params.user.id } }
                    );

                    for (const player of players) {
                        // Teammate and Pool player
                        if (player.partnerId) {
                            const teammates = await getSequelizeData(
                                sequelize,
                                `SELECT id, userId FROM players WHERE (id=:partnerId OR partnerId=:partnerId) AND userId=:viewedUserId`,
                                { replacements: { partnerId: player.partnerId, viewedUserId: data.id } }
                            );
                            if (teammates.length > 0) {
                                return false;
                            }
                        } else {
                            // Captain
                            const teammates = await getSequelizeData(
                                sequelize,
                                `SELECT id, userId FROM players WHERE partnerId=:partnerId`,
                                { replacements: { partnerId: player.id } }
                            );
                            if (teammates.find((teammate) => teammate.userId === data.id)) {
                                return false;
                            }
                            // If NOT a full team then check pool players as well
                            if (teammates.length < config.maxPlayersPerDoublesTeam - 1) {
                                const poolPlayers = await getSequelizeData(
                                    sequelize,
                                    `SELECT id
                                   FROM players
                                  WHERE partnerId=:partnerId AND
                                        userId=:viewedUserId AND
                                        tournamentId=:tournamentId`,
                                    {
                                        replacements: {
                                            partnerId: POOL_PARTNER_ID,
                                            viewedUserId: data.id,
                                            tournamentId: player.tournamentId,
                                        },
                                    }
                                );
                                if (poolPlayers.length > 0) {
                                    return false;
                                }
                            }
                        }
                    }
                }
            }

            const [currentSeason] = await getSequelizeData(
                sequelize,
                `SELECT id
                   FROM seasons
                  WHERE startDate<:currentDate
               ORDER BY startDate DESC
                  LIMIT 1
            `,
                { replacements: { currentDate: currentDate.format('YYYY-MM-DD HH:mm:ss') } }
            );
            if (!currentSeason) {
                return true;
            }

            const tournaments = await getSequelizeData(
                sequelize,
                `
                SELECT t.id,
                       l.type AS levelType
                  FROM tournaments AS t,
                       levels AS l
                 WHERE t.levelId=l.id AND
                       t.seasonId=:seasonId AND
                       t.id IN (SELECT tournamentId FROM players WHERE userId=:currentUserId AND isActive=1) AND
                       t.id IN (SELECT tournamentId FROM players WHERE userId=:viewedUserId)
            `,
                {
                    replacements: {
                        seasonId: currentSeason.id,
                        currentUserId: context.params.user.id,
                        viewedUserId: data.id,
                    },
                }
            );
            if (tournaments.length === 0) {
                return true;
            }

            // Check open singles and doubles proposals
            const singleTournamentIds = tournaments
                .filter((item) => ['single', 'doubles-team'].includes(item.levelType))
                .map((item) => item.id);
            if (singleTournamentIds.length > 0) {
                const proposals = await getSequelizeData(
                    sequelize,
                    `
                    SELECT m.id
                      FROM matches AS m,
                           players AS p
                     WHERE m.challengerId=p.id AND
                           p.userId=:viewedUserId AND
                           p.isActive=1 AND
                           p.tournamentId IN (${singleTournamentIds.join(',')}) AND
                           m.initial=1 AND
                           m.acceptedAt IS NULL AND
                           m.playedAt>:currentDate
                `,
                    {
                        replacements: {
                            viewedUserId: data.id,
                            currentDate: currentDate.format('YYYY-MM-DD HH:mm:ss'),
                        },
                    }
                );
                if (proposals.length > 0) {
                    return false;
                }
            }

            // Check open doubles proposals
            const doublesTournamentIds = tournaments
                .filter((item) => item.levelType === 'doubles')
                .map((item) => item.id);
            if (doublesTournamentIds.length > 0) {
                const proposals = await getSequelizeData(
                    sequelize,
                    `
                    SELECT m.id
                      FROM matches AS m
                      JOIN players AS pc ON m.challengerId=pc.id
                 LEFT JOIN players AS pa ON m.acceptorId=pa.id
                 LEFT JOIN players AS pc2 ON m.challenger2Id=pc2.id
                 LEFT JOIN players AS pa2 ON m.acceptor2Id=pa2.id
                     WHERE pc.tournamentId IN (${doublesTournamentIds.join(',')}) AND
                           (pc.userId=:viewedUserId OR pa.userId=:viewedUserId OR pc2.userId=:viewedUserId OR pa2.userId=:viewedUserId) AND
                           m.initial=1 AND
                           m.acceptedAt IS NULL AND
                           m.playedAt>:currentDate
                `,
                    {
                        replacements: {
                            viewedUserId: data.id,
                            currentDate: currentDate.format('YYYY-MM-DD HH:mm:ss'),
                        },
                    }
                );
                if (proposals.length > 0) {
                    return false;
                }
            }

            // Check your matches
            const matches = await getSequelizeData(
                sequelize,
                `
                SELECT m.id
                  FROM matches AS m
                  JOIN players AS pc ON m.challengerId=pc.id
                  JOIN players AS pa ON m.acceptorId=pa.id
                 WHERE m.playedAt IS NOT NULL AND
                       (pc.userId=:viewedUserId OR pa.userId=:viewedUserId) AND
                       (pc.userId=:currentUserId OR pa.userId=:currentUserId)
            `,
                {
                    replacements: {
                        viewedUserId: data.id,
                        currentUserId: context.params.user.id,
                    },
                }
            );
            if (matches.length > 0) {
                return false;
            }

            // Check single final tournament opponents
            const singleFinalMatches = await getSequelizeData(
                sequelize,
                `
                SELECT m.id
                  FROM matches AS m
                  JOIN players AS pc ON m.challengerId=pc.id
                  JOIN players AS pa ON m.acceptorId=pa.id
                  JOIN tournaments AS t ON pc.tournamentId=t.id
                 WHERE m.type="final" AND
                       t.seasonId=:seasonId AND
                       (pc.userId=:viewedUserId OR pa.userId=:viewedUserId) AND
                       (pc.userId=:currentUserId OR pa.userId=:currentUserId)
            `,
                {
                    replacements: {
                        viewedUserId: data.id,
                        currentUserId: context.params.user.id,
                        seasonId: currentSeason.id,
                    },
                }
            );
            if (singleFinalMatches.length > 0) {
                return false;
            }

            // Check doubles final tournament opponents
            const doublesFinalMatches = await getSequelizeData(
                sequelize,
                `
                SELECT dm.id
                  FROM doublesmatches AS dm
                  JOIN players AS p1 ON dm.player1Id=p1.id
                  JOIN players AS p2 ON dm.player2Id=p2.id
                  JOIN players AS p3 ON dm.player3Id=p3.id
                  JOIN players AS p4 ON dm.player4Id=p4.id
                  JOIN tournaments AS t ON p1.tournamentId=t.id
                 WHERE t.seasonId=:seasonId AND
                       (p1.userId=:viewedUserId OR p2.userId=:viewedUserId OR p3.userId=:viewedUserId OR p4.userId=:viewedUserId) AND
                       (p1.userId=:currentUserId OR p2.userId=:currentUserId OR p3.userId=:currentUserId OR p4.userId=:currentUserId)
            `,
                {
                    replacements: {
                        viewedUserId: data.id,
                        currentUserId: context.params.user.id,
                        seasonId: currentSeason.id,
                    },
                }
            );
            if (doublesFinalMatches.length > 0) {
                return false;
            }

            // Check common teams
            const commonTeams = await getSequelizeData(
                sequelize,
                `SELECT tm.teamId,
                        COUNT(*) AS cnt
                   FROM players AS p,
                        teammembers AS tm
                  WHERE p.id=tm.playerId AND
                        (p.userId=:currentUserId OR p.userId=:viewedUserId)
               GROUP BY tm.teamId
                 HAVING cnt>1`,
                { replacements: { viewedUserId: data.id, currentUserId: context.params.user.id } }
            );
            if (commonTeams.length > 0) {
                return false;
            }

            return true;
        })();

        if (isHidingContacts) {
            hideContacts();
        }

        context.result = { data };
    }

    const userId = context.result.data.id;

    // get photos
    {
        const photos = await getSequelizeData(
            sequelize,
            `SELECT id, userId, width, height, url400, url800, url1200, url1600, url2400, allowComments, createdAt, isApproved
               FROM photos
              WHERE userId=:userId AND
                    width IS NOT NULL AND
                    deletedAt IS NULL AND
                    isApproved=1
           ORDER BY id DESC`,
            { replacements: { userId } }
        );

        const sizes = [400, 800, 1200, 1600, 2400];
        context.result.data.photos = photos.map((item) => ({
            ...item,
            srcset: sizes.map((width) => `${item[`url${width}`]} ${width}w`).join(', '),
        }));
    }

    // current active tournaments
    {
        // Get current season
        const [[currentSeason]] = await sequelize.query(
            `SELECT * FROM seasons WHERE startDate<:date ORDER BY startDate DESC LIMIT 0, 1`,
            { replacements: { date: currentDate.format('YYYY-MM-DD HH:mm:ss') } }
        );

        if (!currentSeason) {
            context.result.data.currentTournaments = [];
        } else {
            const currentTournaments = await getSequelizeData(
                sequelize,
                `SELECT t.id
                  FROM players AS p,
                       tournaments AS t
                 WHERE p.userId=:userId AND
                       p.isActive=1 AND
                       p.tournamentId=t.id AND
                       t.seasonId=:seasonId`,
                { replacements: { userId, seasonId: currentSeason.id } }
            );

            context.result.data.currentTournaments = currentTournaments.map((item) => item.id);
        }
    }

    // get matches info
    {
        const [levelsResult] = await sequelize.query('SELECT id, name, position, slug, type FROM levels');
        const [seasonsResult] = await sequelize.query('SELECT id, year, season FROM seasons');

        const levels = levelsResult.reduce((obj, level) => {
            obj[level.id] = level;
            return obj;
        }, {});
        const seasons = seasonsResult.reduce((obj, season) => {
            obj[season.id] = { ...season, name: getSeasonName(season) };
            return obj;
        }, {});

        let rivalries = {};
        const stat = {};

        const stats = {
            matches: 0,
            won: 0,
            lost: 0,
            maxElo: 0,
            currentElo: 0,
            isEloEstablished: false,
            seasons: new Set(),
            startSeason: '',
            endSeason: '',
        };

        // populate base stats based on seasons
        const [userSeasons] = await sequelize.query(
            `
            SELECT t.levelId,
                   t.seasonId
              FROM players AS p,
                   tournaments AS t,
                   seasons AS s
             WHERE p.tournamentId=t.id AND
                   t.seasonId=s.id AND
                   p.userId=:id
          ORDER BY s.startDate`,
            { replacements: { id: userId } }
        );
        for (const season of userSeasons) {
            const seasonInfo = seasons[season.seasonId];

            if (!stats.startSeason) {
                stats.startSeason = seasonInfo.name;
            }
            stats.endSeason = seasonInfo.name;
            stats.seasons.add(season.seasonId);

            stat[season.levelId] = stat[season.levelId] || {
                startSeason: seasonInfo.name,
                endSeason: seasonInfo.name,
                seasons: new Set(),
                level: levels[season.levelId].name,
                levelId: levels[season.levelId].id,
                levelPosition: levels[season.levelId].position,
                levelSlug: levels[season.levelId].slug,
                levelType: levels[season.levelId].type,
                matches: 0,
                won: 0,
                lost: 0,
                stages: {
                    quarterfinal: new Set(),
                    semifinal: new Set(),
                    final: new Set(),
                    champion: new Set(),
                },
                timelines: {
                    minYear: 9999,
                    maxYear: 0,
                    years: {},
                },
            };
            stat[season.levelId].endSeason = seasonInfo.name;
            stat[season.levelId].seasons.add(season.seasonId);

            const timelines = stat[season.levelId].timelines;
            timelines.minYear = Math.min(timelines.minYear, seasonInfo.year);
            timelines.maxYear = Math.max(timelines.maxYear, seasonInfo.year);
            const currentYear = (timelines.years[seasonInfo.year] = timelines.years[seasonInfo.year] || {
                year: seasonInfo.year,
                won: 0,
                lost: 0,
                eloSum: 0,
                eloCount: 0,
                avgTLR: 0,
                tbWon: 0,
                tbLost: 0,
                seasons: {},
            });
            currentYear.seasons[seasonInfo.season] = currentYear.seasons[seasonInfo.season] || {
                result: 'regular',
                won: 0,
                lost: 0,
            };
        }

        // Divide queries for performance reason
        const matches = [];

        // single matches
        for (const name of ['pc.userId', 'pa.userId']) {
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
                       m.score,
                       m.type,
                       m.finalSpot,
                       m.wonByDefault,
                       m.wonByInjury,
                       m.battleId,
                       pc.tournamentId,
                       pc.userId AS challengerUserId,
                       pa.userId AS acceptorUserId,
                       t.seasonId,
                       t.levelId,
                       s.year,
                       s.season,
                       l.baseTlr,
                       l.name AS levelName,
                       l.type AS levelType
                  FROM matches AS m
                  JOIN players AS pc ON m.challengerId=pc.id
                  JOIN players AS pa ON m.acceptorId=pa.id
                  JOIN tournaments AS t ON t.id=pc.tournamentId
                  JOIN seasons AS s ON s.id=t.seasonId
                  JOIN levels AS l ON l.id=t.levelId
                 WHERE ${name}=:id AND
                       ${getStatsMatches('m')} AND
                       m.challenger2Id IS NULL`;
            const [rows] = await sequelize.query(query, { replacements: { id: userId } });
            matches.push(...rows);
        }

        // Doubles matches
        {
            const query = `
            SELECT m.id,
                   m.challengerId,
                   m.acceptorId,
                   m.challengerElo,
                   m.acceptorElo,
                   m.challenger2Id,
                   m.acceptor2Id,
                   m.challenger2Elo,
                   m.acceptor2Elo,
                   m.challengerEloChange,
                   m.acceptorEloChange,
                   m.winner,
                   m.playedAt,
                   m.score,
                   m.type,
                   m.finalSpot,
                   m.wonByDefault,
                   m.wonByInjury,
                   m.battleId,
                   pc.tournamentId,
                   pc.userId AS challengerUserId,
                   pa.userId AS acceptorUserId,
                   pc2.userId AS challenger2UserId,
                   pa2.userId AS acceptor2UserId,
                   t.seasonId,
                   t.levelId,
                   s.year,
                   s.season,
                   l.name AS levelName,
                   l.type AS levelType
              FROM matches AS m
              JOIN players AS pc ON m.challengerId=pc.id
              JOIN players AS pa ON m.acceptorId=pa.id
              LEFT JOIN players AS pc2 ON m.challenger2Id=pc2.id
              LEFT JOIN players AS pa2 ON m.acceptor2Id=pa2.id
              JOIN tournaments AS t ON t.id=pc.tournamentId
              JOIN seasons AS s ON s.id=t.seasonId
              JOIN levels AS l ON l.id=t.levelId
             WHERE (pc.userId=:id OR pa.userId=:id OR pc2.userId=:id OR pa2.userId=:id) AND
                   m.score IS NOT NULL AND
                   m.challenger2Id IS NOT NULL`;
            const [rows] = await sequelize.query(query, { replacements: { id: userId } });
            matches.push(...rows);
        }

        matches.sort(compareFields('playedAt-desc', 'id-desc'));

        const eloHistory = matches
            .filter((match) => match.baseTlr && match.levelType === 'single')
            .map((match) => (match.challengerUserId === userId ? match.challengerElo : match.acceptorElo))
            .reverse()
            .slice(config.minMatchesToEstablishTlr - 1);

        stats.matches = matches.length;
        stats.maxElo = Math.max(...eloHistory);
        stats.currentElo = eloHistory[eloHistory.length - 1];
        stats.isEloEstablished = eloHistory.length > 0;
        stats.seasons = stats.seasons.size;

        const stages = {
            regular: 1,
            roundOf16: 2,
            quarterfinal: 3,
            semifinal: 4,
            final: 5,
            champion: 6,
        };
        for (const match of matches) {
            const isSingle = !match.challenger2UserId;
            const isChallenger = match.challengerUserId === userId || match.challenger2UserId === userId;
            const isWinner = isChallenger ? match.challengerId === match.winner : match.acceptorId === match.winner;
            const elo =
                match.challengerUserId === userId
                    ? match.challengerElo
                    : match.challenger2UserId === userId
                      ? match.challenger2Elo
                      : match.acceptorUserId === userId
                        ? match.acceptorElo
                        : match.acceptor2Elo;
            const isEloEstablished =
                match.challengerUserId === userId
                    ? match.challengerMatches >= config.minMatchesToEstablishTlr
                    : match.challenger2UserId === userId
                      ? match.challenger2Matches >= config.minMatchesToEstablishTlr
                      : match.acceptorUserId === userId
                        ? match.acceptorMatches >= config.minMatchesToEstablishTlr
                        : match.acceptor2Matches >= config.minMatchesToEstablishTlr;

            const stage =
                match.type === 'regular' || match.battleId
                    ? 'regular'
                    : match.finalSpot > 7
                      ? 'roundOf16'
                      : match.finalSpot > 3
                        ? 'quarterfinal'
                        : match.finalSpot > 1
                          ? 'semifinal'
                          : !isWinner
                            ? 'final'
                            : 'champion';

            // populate timeline
            (() => {
                const { year, season } = match;

                const currentLevel = stat[match.levelId].timelines;
                const currentYear = (currentLevel.years[year] = currentLevel.years[year] || {
                    year,
                    won: 0,
                    lost: 0,
                    eloSum: 0,
                    eloCount: 0,
                    avgTLR: 0,
                    tbWon: 0,
                    tbLost: 0,
                    seasons: {},
                });
                const currentSeason = (currentYear.seasons[season] = currentYear.seasons[season] || {
                    result: 'regular',
                    won: 0,
                    lost: 0,
                });

                const tbStats = getTbStats(match);

                currentLevel.minYear = Math.min(year, currentLevel.minYear);
                currentLevel.maxYear = Math.max(year, currentLevel.maxYear);
                currentYear.tbWon += isChallenger ? tbStats[0] : tbStats[1];
                currentYear.tbLost += isChallenger ? tbStats[1] : tbStats[0];
                currentYear.won += isWinner ? 1 : 0;
                currentYear.lost += isWinner ? 0 : 1;
                if (isEloEstablished) {
                    currentYear.eloSum += elo;
                    currentYear.eloCount++;
                }
                currentYear.avgTLR = Math.round(currentYear.eloSum / currentYear.eloCount);
                currentSeason.won += isWinner ? 1 : 0;
                currentSeason.lost += isWinner ? 0 : 1;
                currentSeason.result = stages[stage] > stages[currentSeason.result] ? stage : currentSeason.result;
                stats.won += isWinner ? 1 : 0;
                stats.lost += isWinner ? 0 : 1;
            })();

            // rivalries
            if (isSingle && match.wonByDefault !== 1) {
                const opponentUserId =
                    match.challengerUserId === userId ? match.acceptorUserId : match.challengerUserId;
                rivalries[opponentUserId] = rivalries[opponentUserId] || {
                    opponentUserId,
                    total: 0,
                    won: 0,
                    lost: 0,
                    matches: [],
                };

                rivalries[opponentUserId].won += isWinner ? 1 : 0;
                rivalries[opponentUserId].lost += isWinner ? 0 : 1;
                rivalries[opponentUserId].total++;
                rivalries[opponentUserId].matches.push({
                    id: match.id,
                    date: match.playedAt,
                    season: seasons[match.seasonId].name,
                    level: levels[match.levelId].name,
                    score: match.challengerId === match.winner ? match.score : revertScore(match.score),
                    isWinner,
                });
            }

            stat[match.levelId].matches++;
            stat[match.levelId].won += isWinner ? 1 : 0;
            stat[match.levelId].lost += isWinner ? 0 : 1;

            if (match.type === 'final' && !match.battleId) {
                if (match.finalSpot <= 7) {
                    stat[match.levelId].stages.quarterfinal.add(match.seasonId);
                }
                if (match.finalSpot <= 3) {
                    stat[match.levelId].stages.semifinal.add(match.seasonId);
                }
                if (match.finalSpot === 1) {
                    stat[match.levelId].stages.final.add(match.seasonId);

                    if (isWinner) {
                        stat[match.levelId].stages.champion.add(match.seasonId);
                    }
                }
            }
        }

        const doublesFinalMatches = await getSequelizeData(
            sequelize,
            `
            SELECT dm.player1Id,
                   dm.player2Id,
                   dm.player3Id,
                   dm.player4Id,
                   p1.userId AS user1Id,
                   p2.userId AS user2Id,
                   p3.userId AS user3Id,
                   p4.userId AS user4Id,
                   t.levelId,
                   t.seasonId,
                   dm.winner,
                   dm.finalSpot,
                   s.year,
                   s.season
              FROM doublesmatches AS dm
              JOIN players AS p1 ON dm.player1Id=p1.id
              JOIN players AS p2 ON dm.player2Id=p2.id
              JOIN players AS p3 ON dm.player3Id=p3.id
              JOIN players AS p4 ON dm.player4Id=p4.id
              JOIN tournaments AS t ON p1.tournamentId=t.id
              JOIN seasons AS s ON t.seasonId=s.id
             WHERE p1.userId=:userId OR p2.userId=:userId OR p3.userId=:userId OR p4.userId=:userId
        `,
            { replacements: { userId } }
        );

        for (const match of doublesFinalMatches) {
            const num = match.user1Id === userId ? 1 : match.user2Id === userId ? 2 : match.user3Id === userId ? 3 : 4;
            const isWinner = match.winner === match[`player${num}Id`];
            const stage = match.finalSpot > 1 ? 'semifinal' : !isWinner ? 'final' : 'champion';

            // populate timeline
            {
                const { year, season } = match;

                const currentSeason = stat[match.levelId].timelines.years[year].seasons[season];
                currentSeason.result = stages[stage] > stages[currentSeason.result] ? stage : currentSeason.result;
            }

            // Populate stages
            stat[match.levelId].stages[stage].add(match.seasonId);
        }

        rivalries = Object.values(rivalries).filter((rivalry) => rivalry.total >= 3);

        const opponentUserIds = rivalries.map((rivalry) => rivalry.opponentUserId);
        if (opponentUserIds.length > 0) {
            const [opponentsResult] = await sequelize.query(`
                SELECT id,
                       firstName,
                       lastName,
                       avatar,
                       gender
                  FROM users
                 WHERE id IN (${opponentUserIds.join(',')})`);
            const opponents = opponentsResult.reduce((obj, opponent) => {
                obj[opponent.id] = opponent;
                return obj;
            }, {});

            for (const rivalry of rivalries) {
                rivalry.opponent = opponents[rivalry.opponentUserId];
            }
        }

        context.result.data.eloHistory = eloHistory;
        context.result.data.stats = stats;

        context.result.data.stat = Object.values(stat)
            .sort((a, b) => a.levelPosition - b.levelPosition)
            .map((item) => {
                item.seasonsTotal = item.seasons.size;
                ['quarterfinal', 'semifinal', 'final', 'champion'].forEach((stage) => {
                    item.stages[stage] = item.stages[stage].size;
                });
                delete item.seasons;
                delete item.levelPosition;
                return item;
            });
        context.result.data.rivalries = rivalries.sort((a, b) =>
            a.total === b.total ? a.opponent.firstName.localeCompare(b.opponent.firstName) : b.total - a.total
        );
        context.result.data.badges = await getUserBadgesStats(fullUserInfo, context);
    }

    return context;
};

const populateAvatar = () => async (context: HookContext) => {
    const { data } = context;
    const currentUser = context.params.user;

    if (data.avatar && data.avatar.startsWith('<svg')) {
        const buffer = await sharp(Buffer.from(data.avatar)).png({ quality: 50 }).resize(66, 76).toBuffer();
        const parser = new DatauriParser();
        data.avatar = parser.format('.png', buffer).content;
    } else if (!data.avatar) {
        data.avatar = '';
    }

    if (data.avatar && !currentUser.avatarCreatedAt) {
        data.avatarCreatedAt = dayjs.tz().format('YYYY-MM-DD HH:mm:ss+00:00');
    }

    context.params.userId = Number(context.id);

    return context;
};

const populateProfileCompletedAt = () => async (context: HookContext) => {
    const { data } = context;
    const currentUser = context.params.user;

    if (!currentUser.profileCompletedAt) {
        const hasAbout = Boolean(data.personalInfo);
        const hasTennisStyle = Boolean(
            data.dominantHand || data.forehandStyle || data.backhandStyle || data.playerType || data.shot
        );
        const hasEquipment = Boolean(
            data.racquet || data.strings || data.shoes || data.bag || data.brand || data.overgrip || data.balls
        );

        if (hasAbout && hasTennisStyle && hasEquipment) {
            data.profileCompletedAt = dayjs.tz().format('YYYY-MM-DD HH:mm:ss+00:00');
        }
    }

    return context;
};

const populateSlug = () => async (context: HookContext) => {
    const { data } = context;
    const sequelize = context.app.get('sequelizeClient');

    const getSlug = (str: string) => {
        return str
            .replace(/[^\w-\s]+/g, '')
            .replace(/^\W+/, '')
            .replace(/\W+$/, '')
            .replace(/\W+/g, '-')
            .toLowerCase();
    };

    const base = getSlug(getPlayerName(data));
    let counter = 0;
    while (true) {
        let result;
        if (context.id) {
            const response = await sequelize.query(
                `SELECT id
                  FROM users
                 WHERE slug=:slug AND id!=:id`,
                {
                    replacements: {
                        slug: base + (counter || ''),
                        id: context.id,
                    },
                }
            );
            result = response[0];
        } else {
            const response = await sequelize.query(
                `SELECT id
                  FROM users
                 WHERE slug=:slug`,
                { replacements: { slug: base + (counter || '') } }
            );
            result = response[0];
        }

        if (result.length === 0) {
            break;
        }
        counter++;
    }

    data.slug = base + (counter || '');

    return context;
};

const stringifyInformation = () => async (context: HookContext) => {
    const { data } = context;

    if (data.information) {
        data.information = JSON.stringify(data.information);
    }

    return context;
};

const populateRegisterHistory = () => async (context: HookContext) => {
    const { data } = context;

    try {
        data.registerHistory = JSON.stringify(data.registerHistory);
    } catch {
        data.registerHistory = null;
    }

    return context;
};

const populateShowAge = () => async (context: HookContext) => {
    if ('showAge' in context.data) {
        context.data.showAge = Boolean(context.data.showAge);
    }

    return context;
};

const populateHistory = () => async (context: HookContext) => {
    const { data } = context;
    const currentUser = context.params.user;

    // checking name
    if (data.firstName !== currentUser.firstName || data.lastName !== currentUser.lastName) {
        if (!data.information?.history?.name) {
            _set(data.information, 'history.name', []);
        }

        data.information.history.name.push({
            value: getPlayerName(currentUser),
            date: dayjs.tz().format('YYYY-MM-DD HH:mm:ss'),
        });
    }

    // Checking birthday
    if (data.birthday !== currentUser.birthday) {
        if (!data.information?.history?.birthday) {
            _set(data.information, 'history.birthday', []);
        }

        data.information.history.birthday.push({
            value: currentUser.birthday,
            date: dayjs.tz().format('YYYY-MM-DD HH:mm:ss'),
        });
    }

    return context;
};

const populateReferral = () => async (context: HookContext) => {
    const { data } = context;
    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;

    const userReferralCode = data.referralCode;

    // generate my own referralCode
    while (true) {
        data.referralCode = generateReferralCode();
        const found = await users.findOne({ where: { referralCode: data.referralCode } });
        if (!found) {
            break;
        }
    }

    if (!userReferralCode) {
        return context;
    }

    const referrerUser = await users.findOne({ where: { referralCode: userReferralCode } });
    if (!referrerUser) {
        return context;
    }
    const partnerName = (() => {
        if (!referrerUser.roles.includes('partner') || !referrerUser.information) {
            return;
        }

        const info = JSON.parse(referrerUser.information);
        return info.partnerName;
    })();

    data.referrerUserId = referrerUser.id;
    data.comeFrom = 99;
    data.comeFromOther = partnerName ? `Referral from ${partnerName}` : `Referral from ${getPlayerName(referrerUser)}`;

    return context;
};

const populateChangelogSeenAt = () => async (context: HookContext) => {
    context.data.changelogSeenAt = dayjs.tz().format('YYYY-MM-DD HH:mm:ss+00:00');

    return context;
};

const generateVerificationCode = () => async (context: HookContext) => {
    context.data.verificationCode = getVerificationCode();

    return context;
};

const sendVerificationEmail =
    (options = {}) =>
    async (context: HookContext) => {
        const sequelize = context.app.get('sequelizeClient');
        const user = options.user || context.result;

        const [[userData]] = await sequelize.query('SELECT verificationCode FROM users WHERE id=:id', {
            replacements: { id: user.id },
        });

        // We don't have to wait for the email sent
        context.app.service('api/emails').create({
            to: [{ ...getEmailContact(user), force: true }],
            subject: `${userData.verificationCode} is your confirmation code`,
            html: emailVerificationTemplate(context.params.config, {
                verificationCode: userData.verificationCode,
            }),
        });

        return context;
    };

const verifyEmail = () => async (context: HookContext) => {
    const { TL_URL } = process.env;
    const { email, verificationCode } = context.data;
    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;
    const { config } = context.params;

    const [[user]] = await sequelize.query(
        `
        SELECT id, firstName, lastName, email, phone, slug, comeFrom, comeFromOther, referrerUserId
          FROM users
         WHERE email=:email AND verificationCode=:verificationCode`,
        {
            replacements: { verificationCode, email },
        }
    );
    if (!user) {
        throw new Unprocessable('Invalid request', { errors: { verificationCode: 'Confirmation code is wrong' } });
    }

    await sequelize.query('UPDATE users SET isVerified=1, verificationCode=NULL WHERE id=:id', {
        replacements: { id: user.id },
    });

    // Send notification
    {
        const [[settings]] = await sequelize.query(`SELECT signUpNotification FROM settings WHERE id=1`);

        const emails = getEmailsFromList(settings.signUpNotification);
        if (emails.length > 0) {
            const fullName = getPlayerName(user);

            // Get duplicates
            let duplicates;
            {
                const [candidates] = await sequelize.query(
                    `
                    SELECT id, firstName, lastName, slug, phone, email, information, isVerified
                      FROM users
                     WHERE (firstName=:firstName AND lastName=:lastName) OR
                           phone=:phone OR
                           information IS NOT NULL`,
                    {
                        replacements: {
                            firstName: user.firstName,
                            lastName: user.lastName,
                            phone: user.phone,
                        },
                    }
                );

                duplicates = candidates.filter((candidate) => {
                    if (candidate.isVerified !== 1) {
                        return false;
                    }
                    if (candidate.id === user.id) {
                        return false;
                    }
                    if (candidate.firstName === user.firstName && candidate.lastName === user.lastName) {
                        return true;
                    }
                    if (candidate.phone === user.phone) {
                        return true;
                    }

                    const information = populateInformation(candidate.information);
                    const categories = [
                        { value: 'phone', check: (value) => user.phone === value },
                        { value: 'email', check: (value) => user.email === value },
                        { value: 'name', check: (value) => getPlayerName(user) === value },
                    ];

                    return categories.some((category) => {
                        const array = information?.history?.[category.value];
                        if (!array) {
                            return false;
                        }

                        return array.find((obj) => category.check(obj.value));
                    });
                });
            }

            const comeFromInfo = (() => {
                if (!comeFromOptions[user.comeFrom]) {
                    return '';
                }

                return `${comeFromOptions[user.comeFrom]}${user.comeFromOther ? ` (${user.comeFromOther})` : ''}`;
            })();

            context.app.service('api/emails').create({
                to: emails.map((item) => ({ email: item })),
                subject: `${fullName}${duplicates.length > 0 ? ' (duplicate)' : ''} signed up to the system`,
                html: signUpNotificationTemplate(context.params.config, {
                    userName: fullName,
                    userEmail: user.email,
                    userPhone: user.phone,
                    profileLink: `${TL_URL}/player/${user.slug}`,
                    previewText: `${context.params.config.city}${comeFromInfo ? `, Origin: ${comeFromInfo}` : ''}`,
                    comeFromInfo,
                    duplicates,
                }),
            });
        }
    }

    // Send notification for referrer
    if (user.referrerUserId) {
        const referrerUser = await users.findByPk(user.referrerUserId);

        const referralFullName = getPlayerName(user);
        context.app.service('api/emails').create({
            to: [getEmailContact(referrerUser)],
            subject: `Your Friend ${referralFullName} Just Signed Up!`,
            html: referralRegisteredTemplate(config, {
                referralName: referralFullName,
                referralLink: `${process.env.TL_URL}/player/${user.slug}`,
                refPercent: referrerUser.refPercent,
                refYears: referrerUser.refYears,
            }),
        });
    }

    return context;
};

const verifyNewEmail = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const currentUser = context.params.user;
    const { email, verificationCode } = context.data;

    const sequelize = context.app.get('sequelizeClient');
    {
        const [rows] = await sequelize.query(
            `
            SELECT id
              FROM users
             WHERE id=:id AND newEmail=:email AND newEmailCode=:verificationCode`,
            {
                replacements: { id: currentUser.id, verificationCode, email },
            }
        );
        if (rows.length !== 1) {
            throw new Unprocessable('Invalid request', { errors: { verificationCode: 'Confirmation code is wrong' } });
        }
    }

    {
        const [rows] = await sequelize.query('SELECT id FROM users WHERE email=:email', {
            replacements: { email },
        });
        if (rows.length > 0) {
            throw new Unprocessable('Invalid request', {
                errors: { verificationCode: 'This email is already used by another player.' },
            });
        }
    }

    const information = populateInformation(currentUser.information);
    if (email !== currentUser.email) {
        if (!information.history?.email) {
            _set(information, 'history.email', []);
        }

        information.history.email.push({
            value: currentUser.email,
            date: dayjs.tz().format('YYYY-MM-DD HH:mm:ss'),
        });
    }

    await sequelize.query(
        `UPDATE users
            SET newEmail="",
                newEmailCode="",
                email=:email,
                isWrongEmail=0,
                information=:information
          WHERE id=:id`,
        { replacements: { id: currentUser.id, email, information: JSON.stringify(information) } }
    );

    return context;
};

const resendVerificationCode = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');

    const [rows] = await sequelize.query(
        `
        SELECT id, password, email, firstName, lastName
          FROM users
         WHERE email=:email`,
        {
            replacements: { email: context.data.email },
        }
    );
    if (rows.length !== 1) {
        throw new Unprocessable('The user is not found');
    }
    const user = rows[0];
    if (!(await bcrypt.compare(context.data.password, user.password))) {
        throw new Unprocessable('The user is not found');
    }

    await sendVerificationEmail({ user })(context);

    return context;
};

const sendPhoneVerificationCode = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    // Validate data
    {
        const schema = yup.object().shape({
            phone: yup
                .string()
                .required()
                .matches(/^[1-9]\d{9}$/),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    if (process.env.NODE_ENV !== 'test' && !process.env.CI) {
        const { phone } = context.data;

        const accountSid = process.env.TL_TWILIO_ACCOUNT_SID;
        const authToken = process.env.TL_TWILIO_AUTH_TOKEN;
        const serviceId = process.env.TL_TWILIO_SERVICE_ID;
        const client = twilio(accountSid, authToken);

        client.verify.v2.services(serviceId).verifications.create({ to: `+1${phone}`, channel: 'sms' });
    }

    return context;
};

const verifyPhone = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const { phone, code } = context.data;

    // Validate data
    {
        const schema = yup.object().shape({
            phone: yup
                .string()
                .required()
                .matches(/^[1-9]\d{9}$/),
            code: yup
                .string()
                .required()
                .matches(/^\d{6}$/),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const currentUser = context.params.user;
    const sequelize = context.app.get('sequelizeClient');

    if (process.env.NODE_ENV === 'test' || process.env.CI) {
        if (code !== '111111') {
            throw new Unprocessable('Invalid request', { errors: { code: 'Confirmation code is wrong' } });
        }
    } else {
        const accountSid = process.env.TL_TWILIO_ACCOUNT_SID;
        const authToken = process.env.TL_TWILIO_AUTH_TOKEN;
        const serviceId = process.env.TL_TWILIO_SERVICE_ID;
        const client = twilio(accountSid, authToken);

        const result = await client.verify.v2.services(serviceId).verificationChecks.create({ to: `+1${phone}`, code });
        if (result.status !== 'approved') {
            throw new Unprocessable('Invalid request', { errors: { code: 'Confirmation code is wrong' } });
        }
    }

    // Save old phone in history
    const information = populateInformation(currentUser.information);
    if (phone !== currentUser.phone) {
        if (!information.history?.phone) {
            _set(information, 'history.phone', []);
        }

        information.history.phone.push({
            value: currentUser.phone,
            date: dayjs.tz().format('YYYY-MM-DD HH:mm:ss'),
        });
    }

    await sequelize.query('UPDATE users SET phone=:phone, isPhoneVerified=1, information=:information WHERE id=:id', {
        replacements: { phone, id: currentUser.id, information: JSON.stringify(information) },
    });

    return context;
};

const validatePhone =
    ({ isExistingUser = true } = {}) =>
    async (context: HookContext) => {
        // Validate data
        {
            const schema = yup.object().shape({
                phone: yup
                    .string()
                    .required()
                    .matches(/^[1-9]\d{9}$/, 'Phone number should contain exactly 10 digits.'),
            });

            const errors = getSchemaErrors(schema, context.data);

            if (!_isEmpty(errors)) {
                throwValidationErrors(errors);
            }
        }

        if (isExistingUser) {
            await authenticate('jwt')(context);
            const currentUser = context.params.user;
            const sequelize = context.app.get('sequelizeClient');
            const { phone } = context.data;

            // Save old phone in history
            const information = populateInformation(currentUser.information);
            if (phone !== currentUser.phone) {
                if (!information.history?.phone) {
                    _set(information, 'history.phone', []);
                }

                information.history.phone.push({
                    value: currentUser.phone,
                    date: dayjs.tz().format('YYYY-MM-DD HH:mm:ss'),
                });
            }

            await sequelize.query(
                'UPDATE users SET phone=:phone, isPhoneVerified=1, information=:information WHERE id=:id',
                { replacements: { phone, id: currentUser.id, information: JSON.stringify(information) } }
            );
        }

        return context;
    };

const getManagers = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin'])(context);

    const sequelize = context.app.get('sequelizeClient');

    const [rows] = await sequelize.query(
        `
            SELECT id, email, firstName, lastName, slug
              FROM users
             WHERE roles LIKE '%manager%'
          ORDER BY firstName, lastName`
    );

    context.result = { data: rows };

    return context;
};

const searchUser = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin', 'manager'])(context);

    const search = context.data.query;

    if (search.length >= 3) {
        const sequelize = context.app.get('sequelizeClient');
        const [rows] = await sequelize.query(
            `
            SELECT id, email, firstName, lastName, createdAt
              FROM users
             WHERE isVerified=1 AND
                   (CONCAT(firstName, ' ', lastName) LIKE :search OR
                   email LIKE :search)
          ORDER BY firstName, lastName`,
            { replacements: { search: `%${search}%` } }
        );

        context.result = rows;
    } else {
        context.result = [];
    }

    return context;
};

const assignManagerRole = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin'])(context);

    const userId = Number(context.data.userId);
    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;

    const user = await users.findByPk(userId);
    if (!user) {
        throw new Unprocessable('The user is not found');
    }

    if (!user.isVerified) {
        throw new Unprocessable('The user email is not verified');
    }

    const newRoles = _uniq(user.roles.split(',').concat(['manager'])).join(',');
    await sequelize.query(
        `
            UPDATE users
               SET roles=:roles
             WHERE id=:userId`,
        {
            replacements: { roles: newRoles, userId },
        }
    );

    logEvent(`Assigned manager role to the user ${getPlayerName(user)} [${user.id}]`)(context);

    return context;
};

const revokeManagerRole = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin'])(context);

    const userId = Number(context.data.userId);
    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;

    const user = await users.findByPk(userId);
    if (!user) {
        throw new Unprocessable('The user is not found');
    }

    const newRoles = user.roles
        .split(',')
        .filter((role) => role !== 'manager')
        .join(',');
    await sequelize.query(
        `
            UPDATE users
               SET roles=:roles
             WHERE id=:userId`,
        {
            replacements: { roles: newRoles, userId },
        }
    );

    logEvent(`Revoked manager role from the user ${getPlayerName(user)} [${user.id}]`)(context);

    return context;
};

const getBanUsers = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin'])(context);

    const sequelize = context.app.get('sequelizeClient');
    const currentDate = dayjs.tz();

    const [rows] = await sequelize.query(
        `
            SELECT id, email, firstName, lastName, slug, banDate, banReason
              FROM users
             WHERE banDate IS NOT NULL AND banDate>:currentDate
          ORDER BY firstName, lastName`,
        {
            replacements: { currentDate: currentDate.format('YYYY-MM-DD HH:mm:ss') },
        }
    );

    context.result = { data: rows };

    return context;
};

const addBan = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin'])(context);

    const schema = yup.object().shape({
        userId: yup.number().required().integer(),
        reason: yup.string().required('Reason is required').max(200),
        duration: yup.number().required().integer().min(1).max(9999),
    });
    const errors = getSchemaErrors(schema, context.data);

    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;

    const user = await users.findByPk(context.data.userId);
    if (!user) {
        throw new Unprocessable('The user is not found');
    }

    await sequelize.query(
        `
            UPDATE users
               SET banDate=:banDate,
                   banReason=:banReason
             WHERE id=:userId`,
        {
            replacements: {
                userId: context.data.userId,
                banReason: context.data.reason,
                banDate:
                    context.data.duration === 9999
                        ? '2099-01-01 00:00:00'
                        : dayjs.tz().add(context.data.duration, 'day').format('YYYY-MM-DD HH:mm:ss'),
            },
        }
    );

    logEvent(`Banned user ${getPlayerName(user)} [${user.id}] for ${context.data.duration} days`)(context);

    return context;
};

const removeBan = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin'])(context);

    const userId = Number(context.id);

    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;

    const user = await users.findByPk(userId);
    if (!user) {
        throw new Unprocessable('The user is not found');
    }

    await sequelize.query(
        `
            UPDATE users
               SET banDate=NULL,
                   banReason=NULL
             WHERE id=:userId`,
        {
            replacements: { userId },
        }
    );

    logEvent(`Removed ban from the user ${getPlayerName(user)} [${user.id}]`)(context);

    return context;
};

const changePassword = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const { user } = context.params;

    if (!(await bcrypt.compare(context.data.oldPassword, user.password))) {
        throw new Unprocessable('Invalid request', { errors: { oldPassword: 'Current password is wrong' } });
    }

    // check validation errors
    {
        const schema = yup.object().shape({
            password: yup.string().min(8, 'Password must be at least 8 characters').max(20),
        });
        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const sequelize = context.app.get('sequelizeClient');
    const salt = encrypt(context.data.password);
    await sequelize.query(`UPDATE users SET password=:password, salt=:salt WHERE id=:userId`, {
        replacements: {
            userId: user.id,
            password: await bcrypt.hash(context.data.password, 10),
            salt,
        },
    });

    logEvent('User changed password')(context);

    return context;
};

const changeUserPassword = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin', 'manager'])(context);

    // check validation errors
    {
        const schema = yup.object().shape({
            password: yup.string().min(8, 'Password must be at least 8 characters').max(20),
        });
        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const userId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const salt = encrypt(context.data.password);
    await sequelize.query(`UPDATE users SET password=:password, salt=:salt WHERE id=:userId`, {
        replacements: { userId, password: await bcrypt.hash(context.data.password, 10), salt },
    });

    logEvent(`Changed password for the user with id=${userId}`)(context);

    return context;
};

const getAllUsers = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin', 'manager'])(context);

    const sequelize = context.app.get('sequelizeClient');

    const [rows] = await sequelize.query(
        `
            SELECT u.id,
                   u.email,
                   u.firstName,
                   u.lastName,
                   u.slug,
                   u.phone,
                   u.birthday,
                   u.isPhoneVerified,
                   u.createdAt,
                   u.loggedAt,
                   u.comeFrom,
                   u.comeFromOther,
                   u.referrerUserId,
                   u.deletedAt,
                   0 as totalReferrals,
                   COALESCE(p.count, 0) AS totalLadders
              FROM users AS u
         LEFT JOIN (SELECT userId, COUNT(*) AS count FROM players GROUP BY userId) AS p ON u.id=p.userId
             WHERE u.email NOT LIKE "fake%@gmail.com" AND
                   u.isVerified=1`
    );

    const hash = rows.reduce((obj, item) => {
        obj[item.id] = item;
        return obj;
    }, {});

    for (const user of rows) {
        if (user.referrerUserId && hash[user.referrerUserId]) {
            hash[user.referrerUserId].totalReferrals++;
        }
    }

    context.result = { data: rows };

    return context;
};

const getDuplicatedUsers = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin', 'manager'])(context);

    const sequelize = context.app.get('sequelizeClient');
    const { config } = context.params;

    const metrics = {
        email: { data: {}, getConfidence: () => 1 },
        phone: { data: {}, getConfidence: () => 0.9 },
        name: {
            data: {},
            getConfidence: (value) => {
                const minWordLength = Math.min(...value.split(' ').map((item) => item.length));
                return minWordLength < 3 ? 0.8 : 0.9;
            },
        },
        birthday: { data: {}, getConfidence: () => 0.5 },
        cookie: { data: {}, getConfidence: () => 0.95 },
    };

    const addMetric = (code, userId, value) => {
        if (!value || !value.trim() || !metrics[code]) {
            return;
        }
        metrics[code].data[value] = metrics[code].data[value] || new Set();
        metrics[code].data[value].add(userId);
    };

    let [ignoredDuplicates] = await sequelize.query(`SELECT payload FROM actions WHERE name="ignoreDuplicates"`);
    ignoredDuplicates = new Set(ignoredDuplicates.map((item) => JSON.parse(item.payload).join('-')));

    const [users] = await sequelize.query(
        `SELECT id,
                email,
                avatar,
                firstName,
                lastName,
                slug,
                phone,
                birthday,
                createdAt,
                loggedAt,
                information,
                cheatingAttempts
           FROM users
          WHERE roles="player" AND isVerified=1`
    );

    const userObj = users.reduce((obj, item) => {
        obj[item.id] = {
            ...item,
            information: item.information ? JSON.parse(item.information) : null,
        };
        return obj;
    }, {});
    for (const user of users) {
        const information = user.information ? JSON.parse(user.information) : {};

        addMetric('phone', user.id, user.phone);
        addMetric('email', user.id, user.email);
        addMetric('name', user.id, getPlayerName(user));
        addMetric('birthday', user.id, user.birthday);

        const phoneHistory = information.history?.phone || [];
        for (const item of phoneHistory) {
            addMetric('phone', user.id, item.value);
        }

        const emailHistory = information.history?.email || [];
        for (const item of emailHistory) {
            addMetric('email', user.id, item.value);
        }

        const nameHistory = information.history?.name || [];
        for (const item of nameHistory) {
            addMetric('name', user.id, item.value);
        }
    }

    const dateThreeMonthsAgo = dayjs.tz().subtract(3, 'month');
    const [rows] = await sequelize.query(`SELECT * FROM identifications WHERE updatedAt>:date`, {
        replacements: { date: dateThreeMonthsAgo.format('YYYY-MM-DD HH:mm:ss') },
    });
    for (const row of rows) {
        if (row.userId in userObj) {
            addMetric('cookie', row.userId, row.code);
        }
    }

    let duplicates = {};
    for (const code of Object.keys(metrics)) {
        const { data, getConfidence } = metrics[code];

        for (const set of Object.values(data)) {
            if (set.size < 2) {
                continue;
            }
            const ids = [...set].sort((a, b) => a - b);
            for (let i = 0; i < ids.length - 1; i++) {
                for (let j = i + 1; j < ids.length; j++) {
                    const id1 = ids[i];
                    const id2 = ids[j];
                    const key = `${id1}-${id2}`;

                    duplicates[key] ||= {
                        key,
                        users: [userObj[id1], userObj[id2]],
                        confidence: 0,
                        metrics: new Set(),
                    };

                    duplicates[key].confidence = 1 - (1 - duplicates[key].confidence) * (1 - getConfidence(code));
                    duplicates[key].metrics.add(code);
                }
            }
        }
    }

    duplicates = Object.values(duplicates)
        .filter((item) => item.confidence > 0.5)
        .sort((a, b) => b.confidence - a.confidence)
        .map((item) => ({
            ...item,
            metrics: [...item.metrics],
            ignored: ignoredDuplicates.has(item.key),
        }));

    // get number of matches for every user
    {
        const [matches] = await sequelize.query(
            `SELECT m.id,
                pc.userId AS challengerUserId,
                pa.userId AS acceptorUserId,
                pc2.userId AS challenger2UserId,
                pa2.userId AS acceptor2UserId
           FROM matches AS m
           JOIN players AS pc ON m.challengerId=pc.id
           JOIN players AS pa ON m.acceptorId=pa.id
      LEFT JOIN players AS pc2 ON m.challenger2Id=pc2.id
      LEFT JOIN players AS pa2 ON m.acceptor2Id=pa2.id
          WHERE m.score IS NOT NULL`
        );
        const userMatches = matches.reduce((obj, item) => {
            obj[item.challengerUserId] ||= 0;
            obj[item.challengerUserId]++;

            obj[item.acceptorUserId] ||= 0;
            obj[item.acceptorUserId]++;

            obj[item.challenger2UserId] ||= 0;
            obj[item.challenger2UserId]++;

            obj[item.acceptor2UserId] ||= 0;
            obj[item.acceptor2UserId]++;

            return obj;
        }, {});

        for (const duplicate of duplicates) {
            for (const user of duplicate.users) {
                user.matches = userMatches[user.id] || 0;
            }
        }
    }

    // detect cheaters
    {
        let [currentPlayers] = await sequelize.query(
            `SELECT p.userId AS id
               FROM players AS p,
                    tournaments AS t,
                    seasons AS s
              WHERE p.tournamentId=t.id AND
                    t.seasonId=s.id AND
                    s.endDate>:date`,
            { replacements: { date: dayjs.tz().format('YYYY-MM-DD HH:mm:ss') } }
        );
        currentPlayers = new Set(currentPlayers.map((item) => item.id));

        for (const duplicate of duplicates) {
            const first = duplicate.users[0];
            const second = duplicate.users[1];

            if (currentPlayers.has(second.id) && first.matches >= config.minMatchesToPay) {
                first.isCheater = true;
                second.isCheater = true;
            }
        }
    }

    context.result = { data: duplicates };

    return context;
};

const mergeUsers = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin', 'manager'])(context);

    // check validation errors
    {
        const schema = yup.object().shape({
            userIdTo: yup.number().integer().required().min(1),
            userIdFrom: yup.number().integer().required().min(1),
            decision: yup.string().required().oneOf(['nothing', 'info', 'warning']),
        });
        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const { userIdTo, userIdFrom, decision } = context.data;
    const allUserIds = [userIdTo, userIdFrom];
    const client = context.app.get('redisClient');
    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;
    const { config } = context.params;

    if (userIdTo === userIdFrom) {
        throw new Unprocessable('The ids are the same');
    }

    const userTo = await users.findByPk(userIdTo);
    if (!userTo) {
        throw new Unprocessable('Users are not found');
    }

    const userFrom = await users.findByPk(userIdFrom);
    if (!userFrom) {
        throw new Unprocessable('Users are not found');
    }

    const [duplicatedTournaments] = await sequelize.query(`
        SELECT tournamentId AS id,
               count(*) AS cnt
          FROM players
         WHERE userId=${userIdTo} OR userId=${userIdFrom}
      GROUP BY tournamentId
        HAVING cnt=2`);

    const playerIdToBeDeleted = [];
    for (const tournament of duplicatedTournaments) {
        for (const userId of [userIdFrom, userIdTo]) {
            const [[player]] = await sequelize.query(
                `SELECT id FROM players WHERE userId=:userId AND tournamentId=:tournamentId`,
                { replacements: { userId, tournamentId: tournament.id } }
            );

            const [matches] = await sequelize.query(
                `SELECT id
                   FROM matches
                  WHERE score IS NOT NULL AND
                        (challengerId=:id OR acceptorId=:id OR challenger2Id=:id OR acceptor2Id=:id)`,
                { replacements: { id: player.id } }
            );

            if (matches.length === 0) {
                playerIdToBeDeleted.push(player.id);
                break;
            }
        }
    }
    if (duplicatedTournaments.length !== playerIdToBeDeleted.length) {
        throw new Unprocessable('Users have the same active ladders');
    }

    {
        // Fix statAddedBy field
        await sequelize.query(`UPDATE matches SET statAddedBy=${userIdTo} WHERE statAddedBy=${userIdFrom}`);

        // Delete empty duplicated tournaments
        for (const playerId of playerIdToBeDeleted) {
            await sequelize.query(
                `DELETE FROM matches
                       WHERE score IS NULL AND
                             (challengerId=:id OR acceptorId=:id OR challenger2Id=:id OR acceptor2Id=:id)`,
                { replacements: { id: playerId } }
            );
            await sequelize.query(`DELETE FROM players WHERE id=${playerId}`);
        }

        // Delete records from related tables
        for (const table of ['views', 'logs']) {
            await sequelize.query(`DELETE FROM ${table} WHERE userId=${userIdFrom}`);
        }

        // Change related tables
        for (const table of [
            'feedbacks',
            'payments',
            'orders',
            'players',
            'photos',
            'reactions',
            'comments',
            'reports',
        ]) {
            await sequelize.query(`UPDATE ${table} SET userId=${userIdTo} WHERE userId=${userIdFrom}`);
        }

        // Messages
        {
            await sequelize.query(`UPDATE messages SET senderId=${userIdTo} WHERE senderId=${userIdFrom}`);
            await sequelize.query(`UPDATE messages SET recipientId=${userIdTo} WHERE recipientId=${userIdFrom}`);
        }

        // Complaints
        {
            await sequelize.query(`UPDATE complaints SET userId=${userIdTo} WHERE userId=${userIdFrom}`);
            await sequelize.query(`UPDATE complaints SET opponentId=${userIdTo} WHERE opponentId=${userIdFrom}`);
        }

        // Userrelations
        {
            // Delete duplicated user relations
            {
                let [userRelationsFromIds] = await sequelize.query(
                    `SELECT opponentId AS id FROM userrelations WHERE userId=${userIdTo}`
                );
                userRelationsFromIds = userRelationsFromIds.map((item) => item.id);
                if (userRelationsFromIds.length > 0) {
                    await sequelize.query(
                        `DELETE FROM userrelations
                            WHERE userId=${userIdFrom} AND
                                  opponentId IN (${userRelationsFromIds.join(',')})`
                    );
                }

                let [userRelationsToIds] = await sequelize.query(
                    `SELECT userId AS id FROM userrelations WHERE opponentId=${userIdTo}`
                );
                userRelationsToIds = userRelationsToIds.map((item) => item.id);
                if (userRelationsToIds.length > 0) {
                    await sequelize.query(
                        `DELETE FROM userrelations
                            WHERE opponentId=${userIdFrom} AND
                                  userId IN (${userRelationsToIds.join(',')})`
                    );
                }
            }

            await sequelize.query(`UPDATE userrelations SET userId=${userIdTo} WHERE userId=${userIdFrom}`);
            await sequelize.query(`UPDATE userrelations SET opponentId=${userIdTo} WHERE opponentId=${userIdFrom}`);
        }

        // fingerprints and identifications
        {
            const entities = [
                { table: 'fingerprints', field: 'whole' },
                { table: 'identifications', field: 'code' },
            ];

            for (const entity of entities) {
                const { table, field } = entity;

                const [rows] = await sequelize.query(
                    `SELECT id, ${field}
                       FROM ${table}
                      WHERE userId=${userIdFrom} OR userId=${userIdTo}
                   ORDER BY updatedAt DESC`
                );

                // Remove duplicates. Leave the latest one.
                const processed = new Set();
                for (const row of rows) {
                    if (processed.has(row[field])) {
                        await sequelize.query(`DELETE FROM ${table} WHERE id=${row.id}`);
                    } else {
                        processed.add(row[field]);
                    }
                }

                await sequelize.query(`UPDATE ${table} SET userId=${userIdTo} WHERE userId=${userIdFrom}`);
            }
        }

        // Badges
        {
            const [badgesFrom] = await sequelize.query(`SELECT * FROM badges WHERE userId=${userIdFrom}`);
            const [badgesTo] = await sequelize.query(`SELECT * FROM badges WHERE userId=${userIdTo}`);

            const badgesFromMatch = badgesFrom.reduce((obj, item) => {
                obj[item.code] = item;
                return obj;
            }, {});

            // check duplicated badges
            for (const badge of badgesTo) {
                const oldBadge = badgesFromMatch[badge.code];
                if (!oldBadge) {
                    continue;
                }

                delete badgesFromMatch[badge.code];

                const [[badgePayment]] = await sequelize.query(`SELECT * FROM payments WHERE badgeId=${badge.id}`);
                const [[oldBadgePayment]] = await sequelize.query(
                    `SELECT * FROM payments WHERE badgeId=${oldBadge.id}`
                );
                if (!badgePayment && oldBadgePayment) {
                    await sequelize.query(
                        `UPDATE payments SET userId=${userIdTo}, badgeId=${badge.id} WHERE badgeId=${oldBadge.id}`
                    );
                }

                if (oldBadge.achievedAt >= badge.achievedAt) {
                    continue;
                }

                await sequelize.query(`UPDATE badges SET achievedAt="${oldBadge.achievedAt}" WHERE id=${badge.id}`);
            }

            // check new badges
            for (const badge of Object.values(badgesFromMatch)) {
                await sequelize.query(`UPDATE badges SET userId=${userIdTo} WHERE id=${badge.id}`);
            }

            // remove old duplicated badges and payments related to them
            {
                await sequelize.query(
                    `DELETE FROM payments WHERE badgeId IN (SELECT id FROM badges WHERE userId=${userIdFrom})`
                );
                await sequelize.query(`DELETE FROM badges WHERE userId=${userIdFrom}`);
            }
        }

        // Delete old user
        await sequelize.query(`DELETE FROM users WHERE id=${userIdFrom}`);
    }

    // regenerate badges state
    await applyNewBadges(sequelize, true);

    // Remove unachieved referral bonus
    for (const user of [userTo, userFrom]) {
        const bonusDescription = `Referral credit for ${getPlayerName(user)}`;
        await sequelize.query(
            `DELETE FROM payments WHERE userId=${userIdTo} AND description LIKE "${bonusDescription}%"`
        );
    }

    // Update createdAt and slug for new user
    const minCreatedAt = [userTo, userFrom].reduce(
        (min, user) => (user.createdAt < min ? user.createdAt : min),
        userTo.createdAt
    );
    const newSlug = /\d/.test(userTo.slug)
        ? [userTo, userFrom].reduce((slug, user) => (user.slug.length < slug.length ? user.slug : slug), userTo.slug)
        : userTo.slug;

    const referrerUserId =
        [userTo, userFrom]
            .map((user) => user.referrerUserId)
            .find((userId) => userId > 0 && !allUserIds.includes(userId)) || 0;

    const avatar = [userTo, userFrom].reduce((result, user) => result || user.avatar, null);
    const avatarObject = [userTo, userFrom].reduce((result, user) => result || user.avatarObject, null);

    // Merge user information
    const information = [userTo, userFrom].reduce(
        (result, user) => {
            if (!result) {
                return user.information ? JSON.parse(user.information) : null;
            }
            if (user.information) {
                // merge
                return merge(JSON.parse(user.information), result || {});
            }

            return result;
        },
        {
            history: {
                email: [{ value: userFrom.email, date: userFrom.createdAt }],
                name: [{ value: getPlayerName(userFrom), date: userFrom.createdAt }],
                phone: [{ value: userFrom.phone, date: userFrom.createdAt }],
                birthday: [{ value: userFrom.birthday, date: userFrom.createdAt }],
            },
        }
    );

    await sequelize.query(
        `
        UPDATE users
           SET createdAt=:createdAt,
               slug=:slug,
               referrerUserId=:referrerUserId,
               comeFromOther=:comeFromOther,
               avatar=:avatar,
               avatarObject=:avatarObject,
               information=:information
         WHERE id=:id`,
        {
            replacements: {
                createdAt: minCreatedAt,
                slug: newSlug,
                referrerUserId,
                comeFromOther: referrerUserId === 0 ? '' : userTo.comeFromOther,
                avatar,
                avatarObject,
                id: userIdTo,
                information: information ? JSON.stringify(information) : null,
            },
        }
    );

    const isCheating = decision === 'warning';

    // update cheatingAttempts
    await sequelize.query(`UPDATE users SET cheatingAttempts=:cheatingAttempts WHERE id=:id`, {
        replacements: {
            id: userIdTo,
            cheatingAttempts: userTo.cheatingAttempts + userFrom.cheatingAttempts + (isCheating ? 1 : 0),
        },
    });

    const [[currentSeason]] = await sequelize.query(`SELECT * FROM seasons WHERE endDate>:date ORDER BY endDate DESC`, {
        replacements: { date: dayjs.tz().format('YYYY-MM-DD HH:mm:ss') },
    });

    // Disable current ladders
    if (isCheating) {
        await sequelize.query(
            `UPDATE players
                SET isActive=0
              WHERE userId=:id AND
                    tournamentId IN (SELECT t.id
                                       FROM tournaments AS t,
                                            seasons AS s
                                      WHERE t.seasonId=s.id AND
                                            s.endDate>:date)`,
            {
                replacements: {
                    id: userIdTo,
                    date: dayjs.tz().add(3, 'week').format('YYYY-MM-DD HH:mm:ss'),
                },
            }
        );
    }

    // send email
    const emails = [userTo, userFrom].map(getEmailContact);
    if (decision === 'info') {
        // do not wait for it
        context.app.service('api/emails').create({
            to: emails,
            subject: 'Merging Your Accounts',
            html: getCustomEmail({
                config,
                compose: ({ h2, signature }) => `
${h2('Hey, #firstName#!', 'padding-top="10px"')}
<mj-text>We noticed you recently created a <b>duplicate account</b> on Rival Tennis Ladder.</mj-text>
<mj-text>To ensure accurate rankings and history, we have a <b>strict one-account policy for all players</b>.</mj-text>
<mj-text>Consequently, we have <b>merged your duplicate profile</b> into the account under the email <b>${
                    userTo.email
                }</b>.</mj-text>
<mj-text>If you experience any issues logging in, please contact us.</mj-text>
<mj-text>Rival Tennis Ladder Support</mj-text>`,
            }),
        });
    } else if (decision === 'warning') {
        // do not wait for it
        context.app.service('api/emails').create({
            to: emails,
            subject: `‼️ Action Required: Duplicate Account Detected`,
            html: getCustomEmail({
                config,
                compose: ({ h2 }) => `
${h2('Hey, #firstName#!', 'padding-top="10px"')}
<mj-text>We noticed you recently created a <b>duplicate account</b> on Rival Tennis Ladder.</mj-text>
<mj-text>To ensure accurate rankings and history, we have a <b>strict one-account policy for all players</b>.</mj-text>
<mj-text>Consequently, we have <b>merged your duplicate profile</b> into the account under the email <b>${
                    userTo.email
                }</b>.</mj-text>
<mj-text><b>Action required</b>: you must <a href="${
                    process.env.TL_URL
                }/register">register again</a> for the ${getSeasonName(currentSeason)} season.</mj-text>
<mj-text><b>Please note</b>: Creating duplicate accounts to circumvent season fees is against our policy. Future violations may result in a <b>suspension or permanent ban</b> from Rival Tennis Ladder.</mj-text>
<mj-text>If you experience any issues logging in, please contact us.</mj-text>
<mj-text>Rival Tennis Ladder Support</mj-text>`,
            }),
        });
    }

    logEvent(`Merged user ${getPlayerName(userTo)} [${userIdFrom} -> ${userIdTo}]`)(context);

    client.flushall();

    return context;
};

const updateChangelogSeenAt = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const currentUser = context.params.user;
    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;

    await users.update(
        { changelogSeenAt: dayjs.tz().format('YYYY-MM-DD HH:mm:ss+00:00') },
        { where: { id: currentUser.id } }
    );

    return context;
};

const getRecentEmails = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin'])(context);

    const { email } = context.data;
    const sequelize = context.app.get('sequelizeClient');

    let [emails] = await sequelize.query(
        `
            SELECT id, subject, html, variables, createdAt
              FROM emails
             WHERE recipientEmail LIKE :email
          ORDER BY createdAt DESC`,
        { replacements: { email: `%${email}%` } }
    );

    // replace variables
    emails = emails.map((item) => {
        const result = _omit(item, ['variables']);

        if (!item.variables) {
            return result;
        }

        const variables = JSON.parse(item.variables)[email];
        if (!variables) {
            return result;
        }

        for (const [key, value] of Object.entries(variables)) {
            result.html = result.html.replaceAll(key, value);
        }

        return result;
    });

    context.result = {
        data: emails,
    };

    return context;
};

const getRegisterHistory = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['superadmin'])(context);

    const userId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');

    const [[row]] = await sequelize.query(`SELECT registerHistory FROM users WHERE id=:id`, {
        replacements: { id: userId },
    });

    const list = row.registerHistory ? JSON.parse(row.registerHistory) : [];
    context.result = { data: list.map((item, index) => ({ id: index + 1, ...item })) };

    return context;
};

const getReferrals = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const currentUser = context.params.user;
    const sequelize = context.app.get('sequelizeClient');

    const [users] = await sequelize.query(
        `
            SELECT id, firstName, lastName, slug, createdAt
              FROM users
             WHERE referrerUserId=:id
          ORDER BY createdAt DESC`,
        { replacements: { id: currentUser.id } }
    );

    if (users.length > 0) {
        const userIds = users.map((user) => user.id);
        const [matches] = await sequelize.query(
            `
                SELECT DISTINCT p.userId
                  FROM matches AS m
             LEFT JOIN players AS p ON (m.challengerId=p.id || m.acceptorId=p.id || m.challenger2Id=p.id || m.acceptor2Id=p.id)
                 WHERE ${getStatsMatches('m')} AND
                       p.userId IN (${userIds.join(',')})`
        );
        const usersWithMatch = new Set(matches.map((row) => row.userId));

        const [payments] = await sequelize.query(
            `
                SELECT DISTINCT userId
                  FROM payments
                 WHERE type="payment" AND
                       userId IN (${userIds.join(',')})`
        );
        const usersWithPayment = new Set(payments.map((row) => row.userId));

        for (const user of users) {
            if (usersWithMatch.has(user.id)) {
                user.playedMatch = true;
            }
            if (usersWithPayment.has(user.id)) {
                user.madePayment = true;
            }
        }
    }

    context.result = { data: users };

    return context;
};

const getPartnerReferrals = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const currentUser = context.params.user;
    const sequelize = context.app.get('sequelizeClient');

    if (!currentUser.refPercent) {
        throw new Unprocessable('You are not using partner referral program.');
    }

    const [users] = await sequelize.query(
        `
            SELECT id, firstName, lastName, slug, createdAt
              FROM users
             WHERE referrerUserId=:id
          ORDER BY createdAt DESC`,
        { replacements: { id: currentUser.id } }
    );

    if (users.length > 0) {
        const userIds = users.map((user) => user.id);
        const [payments] = await sequelize.query(
            `
                SELECT userId,
                       SUM(amount) AS sum
                  FROM payments
                 WHERE type="payment" AND
                       userId IN (${userIds.join(',')})
              GROUP BY userId`
        );
        const usersWithPayment = payments.reduce((obj, item) => {
            obj[item.userId] = item.sum;
            return obj;
        }, {});

        for (const user of users) {
            user.payments = usersWithPayment[user.id] || 0;
        }
    }

    const [payouts] = await sequelize.query(
        `
            SELECT id, amount, description, createdAt
              FROM payouts
             WHERE userId=:id
          ORDER BY createdAt DESC`,
        { replacements: { id: currentUser.id } }
    );

    context.result = { data: { referrals: users, payouts } };

    return context;
};

const getUserSubscriptions = () => async (context: HookContext) => {
    let action;
    try {
        action = decodeAction(context.data.payload);
    } catch (e) {
        throw new Unprocessable(e.message);
    }

    if (action.name !== 'unsubscribe' && action.name !== 'adjustProposals') {
        throw new Unprocessable('The link is broken');
    }

    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;

    const user = await users.findOne({ where: { email: action.email } });
    if (!user) {
        throw new Unprocessable('There is no user.');
    }

    context.result = {
        data: {
            ..._pick(user, [
                'email',
                'subscribeForProposals',
                'subscribeForReminders',
                'subscribeForNews',
                'subscribeForBadges',
            ]),
            information: populateInformation(user.information),
        },
    };

    return context;
};

const updateUserSubscriptions = () => async (context: HookContext) => {
    // check validation errors
    {
        const schema = yup.object().shape({
            payload: yup.string(),
            subscribeForProposals: yup.boolean().required(),
            subscribeForReminders: yup.boolean().required(),
            subscribeForNews: yup.boolean().required(),
            subscribeForBadges: yup.boolean().required(),
            information: yup.object().shape({
                subscribeForProposals: yup.object().shape({
                    playFormats: yup.array(yup.number().oneOf([0, 1, 2, 99])),
                    onlyNotPlaying: yup.boolean(),
                    onlyCompetitive: yup.boolean(),
                    onlyAgeCompatible: yup.boolean(),
                    onlyMySchedule: yup.boolean(),
                    weeklySchedule: yup.array(yup.array().max(6)).length(7),
                }),
            }),
        });
        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    let action;
    try {
        action = decodeAction(context.data.payload);
    } catch (e) {
        throw new Unprocessable(e.message);
    }

    if (action.name !== 'unsubscribe' && action.name !== 'adjustProposals') {
        throw new Unprocessable('The link is broken');
    }

    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;

    await users.update(
        {
            subscribeForProposals: context.data.subscribeForProposals,
            subscribeForReminders: context.data.subscribeForReminders,
            subscribeForNews: context.data.subscribeForNews,
            subscribeForBadges: context.data.subscribeForBadges,
            information: JSON.stringify(context.data.information),
        },
        { where: { email: action.email } }
    );

    return context;
};

const unsubscribe = () => async (context: HookContext) => {
    // check validation errors
    {
        const schema = yup.object().shape({
            date: yup
                .string()
                .required()
                .matches(/^\d\d\d\d-\d\d-\d\d$/),
            hash: yup.string().required(),
        });
        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const userId = Number(context.id);
    const { date, hash } = context.data;
    const { config } = context.params;
    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;

    const calculatedHash = md5([config.url, userId, date, process.env.TL_SECURE_KEY].join(':')).slice(0, 10);
    if (calculatedHash !== hash) {
        throw new Unprocessable('The request is broken');
    }

    const isTestUser = userId === BYE_ID;

    if (!isTestUser && dayjs.tz().subtract(30, 'day').format('YYYY-MM-DD') > date) {
        throw new Unprocessable('The request is expired');
    }
    if (!isTestUser) {
        const user = await users.findByPk(userId);
        if (!user) {
            throw new Unprocessable('The user is not found.');
        }
    }

    await sequelize.query(
        `UPDATE users
        SET subscribeForProposals=0,
            subscribeForNews=0,
            subscribeForReminders=0,
            subscribeForBadges=0
      WHERE id=:id`,
        { replacements: { id: isTestUser ? 1 : userId } }
    );

    logEvent(`Unsubscribe request for userId=${userId}: ${JSON.stringify(context.data)}`)(context);

    return context;
};

const getMyBadgesStats = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await limitToUser(context);

    const currentUser = context.params.user;

    context.result = {
        data: await getUserBadgesStats(currentUser, context),
    };

    return context;
};

const getReferrer = () => async (context: HookContext) => {
    // check validation errors
    {
        const schema = yup.object().shape({
            search: yup.string().required().min(1).max(200),
        });
        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            // TODO: return no result
            throwValidationErrors(errors);
        }
    }

    if (context.data.search.length <= 3) {
        context.result = {
            status: 'fail',
            message: 'Friend not found.',
        };
        return context;
    }

    const sequelize = context.app.get('sequelizeClient');
    const [allUsers] = await sequelize.query('SELECT id, firstName, lastName, email, phone, referralCode FROM users');
    const found = searchReferrer(allUsers, context.data.search);

    if (found.length === 0) {
        context.result = {
            status: 'fail',
            message: 'Friend not found.',
        };
    } else if (found.length > 1) {
        context.result = {
            status: 'fail',
            message: 'More than 1 player is found. Could you use email, phone, or referral code to narrow your search?',
        };
    } else {
        context.result = {
            status: 'success',
            player: _pick(found[0], ['firstName', 'lastName', 'referralCode']),
        };
    }
    return context;
};

const addPersonalNote = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    {
        const schema = yup.object().shape({
            opponentId: yup.number().required(),
            note: yup.string().min(0).max(1000),
        });
        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;
    const currentUser = context.params.user;
    const { opponentId, note } = context.data;

    const foundOpponent = await users.findOne({ where: { id: opponentId } });
    if (!foundOpponent) {
        throw new Unprocessable('Invalid request', {
            errors: { note: 'Opponent is not found' },
        });
    }
    if (currentUser.id === opponentId) {
        throw new Unprocessable('Invalid request', {
            errors: { note: 'You cannot add note for yourself' },
        });
    }

    const [[row]] = await sequelize.query(
        'SELECT * FROM userrelations WHERE userId=:userId AND opponentId=:opponentId',
        { replacements: { userId: currentUser.id, opponentId } }
    );

    if (row) {
        await sequelize.query(`UPDATE userrelations SET note=:note WHERE id=:id`, {
            replacements: { id: row.id, note: encrypt(note.trim()) },
        });
    } else {
        await sequelize.query(
            `INSERT INTO userrelations (userId, opponentId, note) VALUES (:userId, :opponentId, :note)`,
            { replacements: { userId: currentUser.id, opponentId, note: encrypt(note.trim()) } }
        );
    }

    return context;
};

const disableUser = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['superadmin'])(context);

    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;
    const userId = Number(context.id);

    const user = await users.findByPk(userId);
    if (!user) {
        throw new Unprocessable('There is no user.');
    }
    if (user.deletedAt) {
        throw new Unprocessable('The user is already disabled.');
    }

    await users.update({ deletedAt: dayjs.tz().format('YYYY-MM-DD HH:mm:ss+00:00') }, { where: { id: userId } });
    logEvent(`Disabled user ${getPlayerName(user)} [${user.id}]`)(context);

    return context;
};

const restoreUser = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['superadmin'])(context);

    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;
    const userId = Number(context.id);

    const user = await users.findByPk(userId);
    if (!user) {
        throw new Unprocessable('There is no user.');
    }
    if (!user.deletedAt) {
        throw new Unprocessable('The user is already restored.');
    }

    await users.update({ deletedAt: null }, { where: { id: userId } });
    logEvent(`Restored user ${getPlayerName(user)} [${user.id}]`)(context);

    return context;
};

const getPhotos = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const sequelize = context.app.get('sequelizeClient');
    const currentUser = context.params.user;

    const photos = await getSequelizeData(
        sequelize,
        `SELECT p.id,
                p.width,
                p.height,
                p.url400,
                p.url800,
                p.url1200,
                p.url1600,
                p.url2400,
                p.createdAt,
                p.title,
                p.allowShare,
                p.allowComments,
                p.isApproved,
                p.userId,
                r.cnt AS reactions,
                c.cnt AS comments
           FROM photos AS p
      LEFT JOIN (SELECT photoId, COUNT(*) AS cnt FROM reactions GROUP BY photoId) r ON r.photoId = p.id
      LEFT JOIN (SELECT photoId, COUNT(*) AS cnt FROM comments GROUP BY photoId) c ON c.photoId = p.id
          WHERE p.userId=:userId AND
                p.deletedAt IS NULL
       ORDER BY p.id DESC`,
        { replacements: { userId: currentUser.id } }
    );

    const sizes = [400, 800, 1200, 1600, 2400];
    context.result = {
        data: photos.map((item) => ({
            ...item,
            reactions: item.reactions || 0,
            comments: item.comments || 0,
            srcset: sizes.map((width) => `${item[`url${width}`]} ${width}w`).join(', '),
        })),
    };

    return context;
};

const avoidPlayers = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    {
        const schema = yup.object().shape({
            avoidedUsers: yup.array(yup.number().integer().min(1)).required(),
        });
        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const sequelize = context.app.get('sequelizeClient');
    const currentUser = context.params.user;
    const { avoidedUsers } = context.data;

    const [rows] = await sequelize.query(
        `SELECT opponentId FROM userrelations WHERE userId=:userId AND avoidedOnce=1`,
        { replacements: { userId: currentUser.id } }
    );
    const avoidedOnceUsers = new Set(rows.map((item) => item.opponentId));

    if (!avoidedUsers.every((id) => avoidedOnceUsers.has(id))) {
        throw new Unprocessable('Wrong player list.');
    }

    const [userRelations] = await sequelize.query(
        `SELECT id, opponentId, avoid FROM userrelations WHERE userId=:userId`,
        { replacements: { userId: currentUser.id } }
    );
    const relations = userRelations.reduce((obj, item) => {
        obj[item.opponentId] = item;
        return obj;
    }, {});

    for (const opponentId of avoidedUsers) {
        if (relations[opponentId]?.avoid) {
            continue;
        }
        if (relations[opponentId]) {
            await sequelize.query(`UPDATE userrelations SET avoid=1 WHERE id=:id`, {
                replacements: { id: relations[opponentId].id },
            });
        } else {
            await sequelize.query(
                `INSERT INTO userrelations (userId, opponentId, avoid) VALUES (:userId, :opponentId, 1)`,
                { replacements: { userId: currentUser.id, opponentId } }
            );
        }
    }
    for (const relation of userRelations) {
        if (relation.avoid && !avoidedUsers.includes(relation.opponentId)) {
            await sequelize.query(`UPDATE userrelations SET avoid=0 WHERE id=:id`, {
                replacements: { id: relation.id },
            });
        }
    }

    return context;
};

const registerPartner = () => async (context: HookContext) => {
    let action;
    try {
        action = decodeAction(context.data.payload);
    } catch (e) {
        throw new Unprocessable(e.message);
    }

    if (action.name !== 'registerPartner' || !action.percent || !action.years) {
        throw new Unprocessable('The link is broken');
    }

    {
        const errors = commonValidate(context.data);

        if (!context.data.partnerName) {
            errors.partnerName = 'Partner name is required';
        }

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;

    const ACTION_NAME = 'registerPartner';
    const [actions] = await sequelize.query(`SELECT * FROM actions WHERE name=:name AND payload=:payload`, {
        replacements: { name: ACTION_NAME, payload: action.code },
    });
    if (actions.length !== 0) {
        return;
    }

    await trim('firstName', 'lastName', 'email')(context);
    await capitalize('firstName', 'lastName')(context);
    await hashPassword('password')(context);
    await populateSlug()(context);
    await populateChangelogSeenAt()(context);
    await populateReferral()(context);

    const user = await users.create({
        firstName: context.data.firstName,
        lastName: context.data.lastName,
        email: context.data.email,
        password: context.data.password,
        slug: context.data.slug,
        isVerified: 1,
        roles: 'partner',
        subscribeForNews: 0,
        subscribeForReminders: 0,
        information: JSON.stringify({ partnerName: context.data.partnerName }),
        changelogSeenAt: context.data.changelogSeenAt,
        referralCode: context.data.referralCode,
        refPercent: action.percent,
        refYears: action.years,
    });

    await sequelize.query(`UPDATE users SET refStartedAt=createdAt WHERE id=:id`, {
        replacements: { id: user.dataValues.id },
    });

    return context;
};

const getUserMatches = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const userId = Number(context.id);

    const [matches] = await sequelize.query(
        `SELECT m.id,
                m.challengerId,
                m.acceptorId,
                m.challengerElo,
                m.acceptorElo,
                m.challengerEloChange,
                m.acceptorEloChange,
                m.challengerMatches,
                m.acceptorMatches,
                m.challenger2Id,
                m.acceptor2Id,
                m.winner,
                m.playedAt,
                m.score,
                m.type,
                m.wonByDefault,
                m.wonByInjury,
                pc.userId AS challengerUserId,
                pa.userId AS acceptorUserId,
                pc2.userId AS challenger2UserId,
                pa2.userId AS acceptor2UserId,
                l.name AS levelName
            FROM matches AS m
            JOIN players AS pc ON m.challengerId=pc.id
            JOIN players AS pa ON m.acceptorId=pa.id
       LEFT JOIN players AS pc2 ON m.challenger2Id=pc2.id
       LEFT JOIN players AS pa2 ON m.acceptor2Id=pa2.id
            JOIN tournaments AS t ON pc.tournamentId=t.id
            JOIN levels AS l ON t.levelId=l.id
           WHERE (pc.userId=:id OR pa.userId=:id OR pc2.userId=:id OR pa2.userId=:id) AND
                 ${getStatsMatches('m')}
        ORDER BY m.playedAt DESC`,
        { replacements: { id: userId } }
    );

    const matchesUserIds = matches.reduce((set, match) => {
        [match.challengerUserId, match.acceptorUserId, match.challenger2UserId, match.acceptor2UserId].forEach((id) => {
            if (id) {
                set.add(id);
            }
        });
        return set;
    }, new Set());

    const [users] = await sequelize.query(
        `SELECT id,
                firstName,
                lastName,
                avatar
           FROM users
          WHERE id IN (:ids)`,
        { replacements: { ids: [...matchesUserIds] } }
    );

    context.result = {
        data: {
            matches,
            users: users.reduce((obj, item) => {
                obj[item.id] = {
                    ...item,
                    search: `${item.firstName} ${item.lastName}`.toLowerCase(),
                };
                return obj;
            }, {}),
        },
    };

    return context;
};

const savePaw = () => async (context: HookContext) => {
    try {
        await authenticate('jwt')(context);
    } catch (e) {
        // return if not logged in
        return;
    }

    // skip if is loggedInAs
    if (context.params.authentication.payload.loginAs) {
        return;
    }

    {
        const regex = /^[a-f0-9]{64}$/;
        const schema = yup.object().shape({
            whole: yup.string().matches(regex).required(),
            canvas: yup.string().matches(regex).required(),
            device: yup.string().matches(regex).required(),
            screen: yup.string().matches(regex).required(),
            userAgent: yup.string().matches(regex).required(),
            webgl: yup.string().matches(regex).required(),
        });
        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const sequelize = context.app.get('sequelizeClient');
    const currentUser = context.params.user;
    const currentDateStr = dayjs.tz().format('YYYY-MM-DD HH:mm:ss');

    const [[paw]] = await sequelize.query(`SELECT id FROM fingerprints WHERE userId=:userId AND whole=:whole`, {
        replacements: { userId: currentUser.id, whole: context.data.whole },
    });

    if (paw) {
        await sequelize.query(`UPDATE fingerprints SET updatedAt=:date WHERE id=:id`, {
            replacements: { id: paw.id, date: currentDateStr },
        });
    } else {
        await sequelize.query(
            `INSERT INTO fingerprints
                     SET userId=:userId,
                         updatedAt=:date,
                         whole=:whole,
                         canvas=:canvas,
                         device=:device,
                         screen=:screen,
                         userAgent=:userAgent,
                         webgl=:webgl`,
            { replacements: { userId: currentUser.id, date: currentDateStr, ...context.data } }
        );
    }

    return context;
};

const saveIdentification = () => async (context: HookContext) => {
    try {
        await authenticate('jwt')(context);
    } catch (e) {
        // return if not logged in
        return;
    }

    // skip if is loggedInAs
    if (context.params.authentication.payload.loginAs) {
        return;
    }

    if (!/^[a-f0-9]{64}$/.test(context.data.code)) {
        throw new Unprocessable('The code is incorrect');
    }

    const sequelize = context.app.get('sequelizeClient');
    const currentUser = context.params.user;
    const currentDateStr = dayjs.tz().format('YYYY-MM-DD HH:mm:ss');

    const [[identification]] = await sequelize.query(
        `SELECT id FROM identifications WHERE userId=:userId AND code=:code`,
        { replacements: { userId: currentUser.id, code: context.data.code } }
    );

    if (identification) {
        await sequelize.query(`UPDATE identifications SET updatedAt=:date WHERE id=:id`, {
            replacements: { id: identification.id, date: currentDateStr },
        });
    } else {
        await sequelize.query(`INSERT INTO identifications SET userId=:userId, updatedAt=:date, code=:code`, {
            replacements: { userId: currentUser.id, date: currentDateStr, code: context.data.code },
        });
    }

    return context;
};

const ignoreDuplicatedUsers = () => async (context: HookContext) => {
    await authenticate('jwt')(context);
    await hasAnyRole(['admin', 'manager'])(context);

    // check validation errors
    {
        const schema = yup.object().shape({
            userId1: yup.number().integer().required().min(1),
            userId2: yup.number().integer().required().min(1),
        });
        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const { userId1, userId2 } = context.data;
    const sequelize = context.app.get('sequelizeClient');
    const { users } = sequelize.models;

    if (userId1 >= userId2) {
        throw new Unprocessable('Wrong user ids');
    }

    const user1 = await users.findByPk(userId1);
    const user2 = await users.findByPk(userId2);

    if (!user1 || !user2) {
        throw new Unprocessable('Wrong users');
    }

    const ACTION_NAME = 'ignoreDuplicates';
    const payload = JSON.stringify([userId1, userId2]);
    const [[action]] = await sequelize.query(`SELECT * FROM actions WHERE name=:name AND payload=:payload`, {
        replacements: { name: ACTION_NAME, payload },
    });
    if (!action) {
        await sequelize.query(`INSERT INTO actions SET name=:name, payload=:payload`, {
            replacements: { name: ACTION_NAME, payload },
        });
    }

    return context;
};

const parseInformation = () => async (context: HookContext) => {
    context.result.information = populateInformation(context.result.information);
    return context;
};

const runCustomAction = () => async (context: HookContext) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'getUserInfo') {
        await populateUser()(context);
    } else if (action === 'verifyEmail') {
        await verifyEmail()(context);
    } else if (action === 'verifyNewEmail') {
        await verifyNewEmail()(context);
    } else if (action === 'resendVerificationCode') {
        await resendVerificationCode()(context);
    } else if (action === 'sendPhoneVerificationCode') {
        await sendPhoneVerificationCode()(context);
    } else if (action === 'verifyPhone') {
        await verifyPhone()(context);
    } else if (action === 'getManagers') {
        await getManagers()(context);
    } else if (action === 'searchUser') {
        await searchUser()(context);
    } else if (action === 'assignManagerRole') {
        await assignManagerRole()(context);
    } else if (action === 'revokeManagerRole') {
        await revokeManagerRole()(context);
    } else if (action === 'getBanUsers') {
        await getBanUsers()(context);
    } else if (action === 'addBan') {
        await addBan()(context);
    } else if (action === 'removeBan') {
        await removeBan()(context);
    } else if (action === 'changePassword') {
        await changePassword()(context);
    } else if (action === 'changeUserPassword') {
        await changeUserPassword()(context);
    } else if (action === 'getAllUsers') {
        await getAllUsers()(context);
    } else if (action === 'getDuplicatedUsers') {
        await getDuplicatedUsers()(context);
    } else if (action === 'mergeUsers') {
        await mergeUsers()(context);
    } else if (action === 'updateChangelogSeenAt') {
        await updateChangelogSeenAt()(context);
    } else if (action === 'getRecentEmails') {
        await getRecentEmails()(context);
    } else if (action === 'getRegisterHistory') {
        await getRegisterHistory()(context);
    } else if (action === 'getReferrals') {
        await getReferrals()(context);
    } else if (action === 'getPartnerReferrals') {
        await getPartnerReferrals()(context);
    } else if (action === 'getUserSubscriptions') {
        await getUserSubscriptions()(context);
    } else if (action === 'updateUserSubscriptions') {
        await updateUserSubscriptions()(context);
    } else if (action === 'getMyBadgesStats') {
        await getMyBadgesStats()(context);
    } else if (action === 'getReferrer') {
        await getReferrer()(context);
    } else if (action === 'addPersonalNote') {
        await addPersonalNote()(context);
    } else if (action === 'validatePhone') {
        await validatePhone()(context);
    } else if (action === 'unsubscribe') {
        await unsubscribe()(context);
    } else if (action === 'disableUser') {
        await disableUser()(context);
    } else if (action === 'restoreUser') {
        await restoreUser()(context);
    } else if (action === 'getPhotos') {
        await getPhotos()(context);
    } else if (action === 'avoidPlayers') {
        await avoidPlayers()(context);
    } else if (action === 'registerPartner') {
        await registerPartner()(context);
    } else if (action === 'getUserMatches') {
        await getUserMatches()(context);
    } else if (action === 'savePaw') {
        await savePaw()(context);
    } else if (action === 'saveIdentification') {
        await saveIdentification()(context);
    } else if (action === 'ignoreDuplicatedUsers') {
        await ignoreDuplicatedUsers()(context);
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
        find: [authenticate('jwt')],
        get: [authenticate('jwt')],
        create: [
            validateCreate(),
            validatePhone({ isExistingUser: false }),
            populateRegisterHistory(),
            keep(
                'firstName',
                'lastName',
                'email',
                'phone',
                'password',
                'comeFrom',
                'comeFromOther',
                'referralCode',
                'registerHistory',
                'zip',
                'birthday'
            ),
            trim('firstName', 'lastName', 'email'),
            capitalize('firstName', 'lastName'),
            populateSalt(),
            hashPassword('password'),
            populateSlug(),
            populateReferral(),
            populateChangelogSeenAt(),
            generateVerificationCode(),
        ],
        update: [runCustomAction()],
        patch: [
            authenticate('jwt'),
            limitToUser,
            populateShowAge(),
            validatePatch(),
            registerNewEmail(),
            keep(
                'appearance',
                'firstName',
                'lastName',
                'gender',
                'birthday',
                'subscribeForProposals',
                'subscribeForReminders',
                'subscribeForNews',
                'subscribeForBadges',
                'avatar',
                'avatarObject',
                'personalInfo',
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
                'showAge',
                'information'
            ),
            trim('firstName', 'lastName'),
            capitalize('firstName', 'lastName'),
            populateAvatar(),
            populateSlug(),
            populateSalt(),
            hashPassword('password'),
            populateProfileCompletedAt(),
            populateHistory(),
            stringifyInformation(),
        ],
        remove: [disallow()],
    },

    after: {
        all: [
            // Make sure the password field is never sent to the client
            // Always must be the last hook
            protect('password', 'salt', 'verificationCode', 'registerHistory'),
        ],
        find: [],
        get: [],
        create: [unless(isProvider('server'), sendVerificationEmail())],
        update: [],
        patch: [purgeUserCache(), generateBadges(), parseInformation()],
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
