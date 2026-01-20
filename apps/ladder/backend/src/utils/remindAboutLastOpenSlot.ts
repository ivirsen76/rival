import dayjs from './dayjs';
import lastOpenSlotReminderTemplate from '../emailTemplates/lastOpenSlotReminder';
import staticConfig from '../config';
import getCombinedConfig from './getCombinedConfig';
import { getEmailContact, getPlayerName } from '../services/users/helpers';

// Helpers
const getConfig = async sequelize => {
    const config = await getCombinedConfig();
    return { ...staticConfig, ...config };
};
const isActionDone = async (sequelize, name, tableId) => {
    const [actions] = await sequelize.query(`SELECT * FROM actions WHERE tableId=:tableId AND name=:name`, {
        replacements: { tableId, name },
    });

    return actions.length > 0;
};

export default async (app, settings = {}) => {
    const { TL_URL } = process.env;
    const sequelize = app.get('sequelizeClient');
    const { ignoreNightTime } = settings;

    const config = await getConfig(sequelize);

    const currentDate = dayjs.tz();
    const hour = currentDate.hour();

    // Don't send reminder at night
    if (!ignoreNightTime && (hour <= 6 || hour >= 23)) {
        return;
    }

    const createdAtMax = currentDate.subtract(1, 'day');
    const playedAtMin = currentDate.hour(23).minute(59).second(59);
    const playedAtMax = playedAtMin.add(1, 'day');

    const [matches] = await sequelize.query(
        `
        SELECT m.id,
               m.playedAt,
               m.place,
               m.comment,
               l.name AS levelName,
               l.slug AS levelSlug,
               s.year AS seasonYear,
               s.season AS season,
               pc.tournamentId,
               pc.userId AS challengerUserId,
               pc2.userId AS challenger2UserId,
               pa.userId AS acceptorUserId,
               pa2.userId AS acceptor2UserId
          FROM matches AS m
          JOIN players AS pc ON m.challengerId=pc.id
     LEFT JOIN players AS pc2 ON m.challenger2Id=pc2.id
     LEFT JOIN players AS pa ON m.acceptorId=pa.id
     LEFT JOIN players AS pa2 ON m.acceptor2Id=pa2.id
          JOIN tournaments AS t ON pc.tournamentId=t.id
          JOIN levels AS l ON t.levelId=l.id
          JOIN seasons AS s ON t.seasonId=s.id
         WHERE m.score IS NULL AND
               m.acceptedAt IS NULL AND
               (m.challenger2Id IS NOT NULL OR m.acceptor2Id IS NOT NULL) AND
               m.createdAt<:createdAtMax AND
               m.playedAt>:playedAtMin AND
               m.playedAt<:playedAtMax`,
        {
            replacements: {
                createdAtMax: createdAtMax.format('YYYY-MM-DD HH:mm:ss'),
                playedAtMin: playedAtMin.format('YYYY-MM-DD HH:mm:ss'),
                playedAtMax: playedAtMax.format('YYYY-MM-DD HH:mm:ss'),
            },
        }
    );

    for (const match of matches) {
        const total = ['challengerUserId', 'challenger2UserId', 'acceptorUserId', 'acceptor2UserId'].filter(
            field => match[field]
        ).length;

        if (total !== 3) {
            continue;
        }

        const ACTION_NAME = 'remindAboutLastOpenSlot';
        if (await isActionDone(sequelize, ACTION_NAME, match.id)) {
            continue;
        }

        const [users] = await sequelize.query(
            `SELECT u.id, u.firstName, u.lastName, u.email, u.subscribeForProposals
               FROM users AS u, players AS p
              WHERE p.userId=u.id
                AND p.tournamentId=:tournamentId
                AND p.isActive=1`,
            { replacements: { tournamentId: match.tournamentId } }
        );

        const playedAt = dayjs.tz(match.playedAt).format('ddd, MMM D, h:mm A');
        const emails = users
            .filter(
                user =>
                    user.subscribeForProposals &&
                    ![
                        match.challengerUserId,
                        match.challenger2UserId,
                        match.acceptorUserId,
                        match.acceptor2UserId,
                    ].includes(user.id)
            )
            .map(getEmailContact);

        const teamDetails = (() => {
            const getName = userId => {
                const user = users.find(item => item.id === userId);
                return user ? `<b>${getPlayerName(user)}</b>` : '<span class="open">open</span>';
            };

            return `<mj-text>
                Team 1:&nbsp;&nbsp;${getName(match.challengerUserId)} / ${getName(match.challenger2UserId)}<br>
                Team 2:&nbsp;&nbsp;${getName(match.acceptorUserId)} / ${getName(match.acceptor2UserId)}
            </mj-text>`;
        })();

        // We don't have to wait for the email sent
        app.service('api/emails').create({
            to: emails,
            subject: `Just One Player Needed for Upcoming Doubles Match!`,
            html: lastOpenSlotReminderTemplate(config, {
                proposalDate: playedAt,
                proposalLocation: match.place,
                proposalComment: match.comment,
                teamDetails,
                ladderLink: `${TL_URL}/season/${match.seasonYear}/${match.season}/${match.levelSlug}`,
                ladderName: match.levelName,
            }),
        });

        await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:matchId, :name)`, {
            replacements: { matchId: match.id, name: ACTION_NAME },
        });
    }
};
