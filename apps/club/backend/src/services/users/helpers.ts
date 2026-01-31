import _upperFirst from 'lodash/upperFirst';
import dayjs from '../../utils/dayjs';
import { getStatsMatches } from '../../utils/sqlConditions';
import type { Config, Match, User } from '../../types';
import type { Sequelize } from 'sequelize';

export const formatPhone = (str: string) => {
    if (!str) {
        return '';
    }

    return str.replace(/(\d{3})(\d{4})$/g, '-$1-$2');
};

export const hidePhone = () => {
    return 'XXX-XXX-XXXX';
};

export const formatUserName = (str: string) => {
    return str
        .split(' ')
        .filter(Boolean)
        .map((part) => {
            if (!/^\w+$/.test(part)) {
                return part;
            }
            if (part.length < 3) {
                return part;
            }
            if (part !== part.toLowerCase() && part !== part.toUpperCase()) {
                return part;
            }

            return _upperFirst(part.toLowerCase());
        })
        .join(' ');
};

export const getPlayerName = (players: User | User[], withLink = false) => {
    const arr = Array.isArray(players) ? players : [players];

    const useInitials = arr.length > 1;
    const getInitials = (player: User) => player.lastName.slice(0, 1).toUpperCase() + '.';

    return arr
        .map((player) => {
            const name = [player.firstName, useInitials ? getInitials(player) : player.lastName].join(' ');

            if (withLink) {
                return `<a href="${process.env.TL_URL}/player/${player.slug}">${name}</a>`;
            }

            return name;
        })
        .join(' / ');
};

export const getEmailLink = (user: User) => {
    return `<a href="mailto:${user.email}">${user.email}</a>`;
};

export const getPhoneLink = (user: User) => {
    return `<a href="sms:${user.phone}">${formatPhone(user.phone)}</a>`;
};

export const getEmailContact = (user: User) => {
    return { name: getPlayerName(user), email: user.email };
};

export const hideEmail = (str: string) => {
    if (!str) {
        return 'a***@*****.com';
    }

    return str
        .replace(/^(.*)@/, (s) => s.slice(0, 1) + '*'.repeat(s.length - 2) + '@')
        .replace(/@(.*)(\.[^.]+)$/, (_, domain, com) => '@' + '*'.repeat(domain.length) + com);
};

export const getVerificationCode = () =>
    Math.ceil(Math.random() * 900000 + 100000)
        .toString()
        .slice(0, 6);

export const getWeekNumber = (str: string) => {
    // Split date and time, take only the date part
    const [datePart] = str.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);

    // Create date in local time
    const date = new Date(year, month - 1, day);

    // JS: Sunday = 0, Monday = 1, ..., Saturday = 6
    const dayOfWeek = date.getDay();

    // Calculate how many days to subtract to get Monday
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    date.setDate(date.getDate() - diff);

    // Format as YYYY-MM-DD
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return Number(`${yyyy}${mm}${dd}`);
};

export const getDateByWeekNumber = (num: number) => {
    const year = Math.floor(num / 10000);
    const month = Math.floor((num % 10000) / 100);
    const day = Math.floor(num % 100);

    return dayjs.tz(`${year}-${month}-${day} 00:00:00`).isoWeekday(1).format('YYYY-MM-DD HH:mm:ss');
};

export const getTbStats = (match: Match) => {
    const { score, wonByInjury } = match;
    let won = 0;
    let lost = 0;

    score.split(' ').forEach((set, index) => {
        if (['1-0', '0-1'].includes(set) && wonByInjury) {
            return;
        }

        if (set === '7-6' || set === '1-0') {
            won++;
        }
        if (set === '6-7' || set === '0-1') {
            lost++;
        }
    });

    return [won, lost];
};

export const getEstablishedElo = async ({
    userId,
    config,
    sequelize,
}: {
    userId: number;
    config: Config;
    sequelize: Sequelize;
}) => {
    const [[match]] = (await sequelize.query(
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
    )) as [Match & { playerId: number }][];

    let establishedElo;
    if (match) {
        const totalMatches = match.playerId === match.challengerId ? match.challengerMatches : match.acceptorMatches;
        if (totalMatches && totalMatches >= config.minMatchesToEstablishTlr) {
            establishedElo = match.playerId === match.challengerId ? match.challengerElo : match.acceptorElo;
        }
    }

    return establishedElo;
};

export const getEstablishedEloAllUsers = async ({ config, sequelize }: { config: Config; sequelize: Sequelize }) => {
    const [matches] = await sequelize.query(
        `SELECT m.challengerMatches,
                m.challengerElo,
                m.acceptorMatches,
                m.acceptorElo,
                pc.userId AS challengerUserId,
                pa.userId AS acceptorUserId
           FROM matches AS m
           JOIN players AS pc ON m.challengerId=pc.id
           JOIN players AS pa ON m.acceptorId=pa.id
          WHERE ${getStatsMatches('m')} AND
                m.challenger2Id IS NULL
       ORDER BY m.playedAt DESC,
                m.id DESC`
    );

    const result: Record<string, number> = {};
    for (const match of matches as Match[]) {
        if (match.challengerMatches >= config.minMatchesToEstablishTlr && !result[match.challengerUserId]) {
            result[match.challengerUserId] = match.challengerElo;
        }
        if (match.acceptorMatches >= config.minMatchesToEstablishTlr && !result[match.acceptorUserId]) {
            result[match.acceptorUserId] = match.acceptorElo;
        }
    }

    return result;
};
