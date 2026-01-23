import type { HookContext } from '@feathersjs/feathers';
import { Unprocessable } from '@feathersjs/errors';
import dayjs, { formatDate } from './utils/dayjs';
import logger from '@rival-tennis-ladder/logger';
import { getStatsMatches } from './utils/sqlConditions';
import populateInformation from './services/users/populateInformation';

// reset changelogSeenAt if user didn't log in for 3 months
// we don't want to overwhelm him with new updates
const resetChangelogSeenAt = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const { id, loggedAt } = context.result.user;

    if (loggedAt) {
        const dateThreeMonthsAgo = dayjs.tz().subtract(3, 'month').format('YYYY-MM-DD HH:mm:ss');
        if (loggedAt > dateThreeMonthsAgo) {
            return context;
        }
    }

    const currentDate = dayjs.tz().format('YYYY-MM-DD HH:mm:ss');
    await sequelize.query(`UPDATE users SET changelogSeenAt="${currentDate}" WHERE id="${id}"`);
    context.result.user.changelogSeenAt = currentDate;

    return context;
};

const populateTournaments = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const userId = context.result.user.id;
    const { config } = context.params;

    // Get tournaments
    {
        const [result] = await sequelize.query(
            `SELECT p.id,
                    p.tournamentId,
                    p.readyForFinal,
                    p.changedCount,
                    p.isActive,
                    p.joinForFree,
                    p.partnerId,
                    l.name AS levelName,
                    l.slug AS levelSlug,
                    l.position AS levelPosition,
                    l.type AS levelType,
                    t.seasonId,
                    t.levelId,
                    s.year,
                    s.season,
                    s.endDate
               FROM players AS p, tournaments AS t, levels AS l, seasons AS s
              WHERE p.tournamentId=t.id AND
                    t.levelId=l.id AND
                    t.seasonId=s.id AND
                    p.userId=${userId}`
        );

        context.result.user.tournaments = {};
        for (const row of result) {
            let needPartner = false;
            if (row.levelType === 'doubles-team' && !row.partnerId) {
                const [[record]] = await sequelize.query(`SELECT id FROM players WHERE partnerId=${row.id}`);
                if (!record) {
                    needPartner = true;
                }
            }

            context.result.user.tournaments[row.tournamentId] = {
                tournamentId: row.tournamentId,
                playerId: row.id,
                partnerId: row.partnerId,
                readyForFinal: row.readyForFinal,
                changedCount: row.changedCount,
                joinForFree: row.joinForFree,
                seasonId: row.seasonId,
                levelId: row.levelId,
                levelName: row.levelName,
                levelType: row.levelType,
                isActive: row.isActive,
                needPartner,
                matchesPlayed: 0,
                regularMatchesPlayed: 0,
            };
        }

        const currentDate = dayjs.tz().format('YYYY-MM-DD HH:mm:ss');
        const currentTournaments = result
            .filter((item) => item.isActive && item.endDate > currentDate)
            .sort((a, b) =>
                a.endDate === b.endDate ? a.levelPosition - b.levelPosition : a.endDate.localeCompare(b.endDate)
            );
        if (currentTournaments.length > 0) {
            const redirectTo = currentTournaments[0];
            context.result.user.redirectAfterLogin = `/season/${redirectTo.year}/${redirectTo.season}/${redirectTo.levelSlug}`;
        }
    }

    // Get matches stats
    {
        const [result] = await sequelize.query(
            `SELECT count(*) AS cnt,
                    p.tournamentId,
                    m.type
               FROM matches AS m,
                    players AS p
              WHERE (m.challengerId=p.id OR m.acceptorId=p.id OR m.challenger2Id=p.id OR m.acceptor2Id=p.id) AND
                    p.userId=${userId} AND
                    ${getStatsMatches('m')}
           GROUP BY p.tournamentId,
                    m.type`
        );

        for (const item of result) {
            context.result.user.tournaments[item.tournamentId].matchesPlayed += item.cnt;

            if (item.type === 'regular') {
                context.result.user.tournaments[item.tournamentId].regularMatchesPlayed += item.cnt;
            }
        }

        context.result.user.totalMatches = result.reduce((sum, item) => sum + item.cnt, 0);
    }

    // Get established TLR
    {
        const [[match]] = await sequelize.query(
            `SELECT m.*,
                    p.id AS playerId
               FROM matches AS m,
                    players AS p
              WHERE (m.challengerId=p.id OR m.acceptorId=p.id) AND
                    p.userId=${userId} AND
                    ${getStatsMatches('m')} AND
                    m.challenger2Id IS NULL
           ORDER BY m.playedAt DESC
              LIMIT 0, 1`
        );

        let establishedElo;
        if (match) {
            const totalMatches =
                match.playerId === match.challengerId ? match.challengerMatches : match.acceptorMatches;
            if (totalMatches && totalMatches >= config.minMatchesToEstablishTlr) {
                establishedElo = match.playerId === match.challengerId ? match.challengerElo : match.acceptorElo;
            }
        }
        context.result.user.establishedElo = establishedElo;
    }

    // Learned the rules?
    {
        const [[row]] = await sequelize.query(`SELECT id FROM logs WHERE userId=${userId} AND code="learnedTheRules"`);

        if (row) {
            context.result.user.learnedTheRules = true;
        } else {
            const START_LEARNING_RULES_DATE = '2024-01-04 00:00:00';
            const MATCHES_PLAYED_TO_LEARN_THE_RULES = 5;

            const [[count]] = await sequelize.query(
                `SELECT count(*) AS cnt
                   FROM matches AS m,
                        players AS p
                  WHERE (m.challengerId=p.id OR m.acceptorId=p.id OR m.challenger2Id=p.id OR m.acceptor2Id=p.id) AND
                        p.userId=${userId} AND
                        ${getStatsMatches('m')} AND
                        m.playedAt>"${START_LEARNING_RULES_DATE}"`
            );

            context.result.user.learnedTheRules = count.cnt >= MATCHES_PLAYED_TO_LEARN_THE_RULES;
        }
    }

    // Get information if user is playing for free
    {
        const [result] = await sequelize.query(
            `SELECT count(*) AS cnt
               FROM payments
              WHERE userId=:userId AND
                    type="product"`,
            { replacements: { userId } }
        );

        context.result.user.isPlayingForFree = result[0].cnt === 0;
    }

    // Get avoided users
    {
        const avoidedUsers = new Set();
        const [rows] = await sequelize.query(
            `SELECT userId, opponentId
               FROM userrelations
              WHERE (userId=:userId OR opponentId=:userId) AND
                    avoid=1`,
            { replacements: { userId } }
        );
        for (const row of rows) {
            avoidedUsers.add(row.userId);
            avoidedUsers.add(row.opponentId);
        }
        avoidedUsers.delete(userId);

        context.result.user.avoidedUsers = [...avoidedUsers];
    }

    // Get possible avoided users (complained and avoided)
    {
        const complainedUsers = {};
        const [rows] = await sequelize.query(
            `SELECT u.id,
                    u.firstName,
                    u.lastName,
                    u.avatar,
                    u.slug,
                    ur.avoid
               FROM users AS u,
                    userrelations AS ur
              WHERE ur.userId=:userId AND
                    ur.opponentId=u.id AND
                    ur.avoidedOnce=1`,
            { replacements: { userId } }
        );
        for (const row of rows) {
            complainedUsers[row.id] = {
                ...row,
                avoid: Boolean(row.avoid),
            };
        }
        context.result.user.complainedUsers = complainedUsers;
    }

    // Get information about personal notes
    {
        const [rows] = await sequelize.query(`SELECT id FROM userrelations WHERE userId=:userId AND note IS NOT NULL`, {
            replacements: { userId },
        });

        context.result.user.enoughPersonalNotes = rows.length >= 3;
    }

    // Get total messages this week
    {
        const monday = dayjs.tz().isoWeekday(1).hour(0).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss');

        const [[row]] = await sequelize.query(
            `SELECT count(*) AS cnt
               FROM messages
              WHERE senderId=:userId AND
                    createdAt>:date`,
            { replacements: { userId, date: monday } }
        );

        context.result.user.totalMessagesThisWeek = row.cnt;
    }

    // Get total comments today
    {
        const midnight = dayjs.tz().hour(0).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss');

        const [[row]] = await sequelize.query(
            `SELECT count(*) AS cnt
               FROM comments
              WHERE userId=:userId AND
                    createdAt>:date`,
            { replacements: { userId, date: midnight } }
        );

        context.result.user.totalCommentsToday = row.cnt;
    }

    // Get recent paw
    {
        const dateWeekAgo = dayjs().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
        const [rows] = await sequelize.query(`SELECT id FROM fingerprints WHERE userId=:userId AND updatedAt>:date`, {
            replacements: { userId, date: dateWeekAgo },
        });

        context.result.user.hasRecentPaw = rows.length > 0;
    }

    // Check if user is logged as
    {
        const tokenPayload = context.result.authentication.payload;
        if (tokenPayload.loginAs) {
            context.result.user.loginAs = true;
            context.result.user.loginAsOriginalUser = tokenPayload.loginAsOriginalUser;
        }
    }

    context.result.user.information = populateInformation(context.result.user.information);

    return context;
};

const checkIfVerified = () => async (context: HookContext) => {
    const { user } = context.result;

    if (user.deletedAt) {
        throw new Unprocessable('Invalid request', {
            errors: {
                email: `The user with this email is deleted. To restore the user send a message to info@tennis-ladder.com.`,
            },
        });
    }

    if (!user.isVerified) {
        throw new Unprocessable('Invalid request', { errors: { email: 'Your email is not verified.' } });
    }

    if (user.banDate && dayjs.tz().isBefore(dayjs.tz(user.banDate))) {
        throw new Unprocessable('Invalid request', {
            errors: { email: `You are banned till ${formatDate(user.banDate)}. Reason: ${user.banReason}` },
        });
    }

    return context;
};

const updateLoggedAt = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const userId = context.result.user.id;
    const currentDate = dayjs.tz().format('YYYY-MM-DD HH:mm:ss');

    const tokenPayload = context.result.authentication.payload;
    if (!tokenPayload.loginAs) {
        await sequelize.query(`UPDATE users SET loggedAt="${currentDate}" WHERE id="${userId}"`);
    }

    return context;
};

const errorHandler = () => (context: HookContext) => {
    if (context.error) {
        if (context.data.strategy === 'local') {
            logger.info(`Invalid login with email "${context.data.email}"`);
            throw context.error;
        }
        if (context.data.strategy === 'jwt') {
            logger.info(`${context.error} (accessToken: "${context.data.token}")`);
            throw context.error;
        }
    }

    return context;
};

export default {
    before: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [resetChangelogSeenAt(), checkIfVerified(), populateTournaments(), updateLoggedAt()],
        update: [],
        patch: [],
        remove: [],
    },

    error: {
        all: [],
        find: [],
        get: [],
        create: [errorHandler()],
        update: [],
        patch: [],
        remove: [],
    },
};
