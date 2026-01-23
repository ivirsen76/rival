import { getActionLink } from '../../utils/action';
import getCustomEmail from '../../emailTemplates/getCustomEmail';
import { getEmailContact, getPlayerName, getEmailLink, getPhoneLink } from '../users/helpers';
import _capitalize from 'lodash/capitalize';
import { POOL_PARTNER_ID } from '../../constants';
import type { HookContext } from '@feathersjs/feathers';

export const teamNames = [
    'Love Gurus',
    'The Coordinators',
    'Court Crushers',
    'Volley Llamas',
    'Baseline Bandits',
    'Racqueteers',
    'One Hit Wonders',
    'Game Set Match',
    'Breaking Baddies',
    'Grand Advantage',
    'Baseline Unity',
    'Point Masters',
    'Net Force',
    'Challengers',
    'Game Changers',
    'Court Jesters',
    'Silent Serve',
    'Alley Gators',
    'Slice Girls',
    'Steady Duo',
    'Court Kings',
    'Match Point',
    'Racquet Warriors',
    'True Match',
    'Love Handles',
    'The Second Set',
    'Duo Resolve',
    'Momentum',
    'Precision Pair',
    'Unity Spin',
    'Servebots',
    'Grand Slammers',
    'Hall of Framers',
    'Servivors',
    'Ball Hogs',
    'Court Vision',
    'Blabalots',
    'Net Ninjas',
    'Pushers',
    'Baseliners',
    'Drop Shot Divas',
    'Lobbyists',
    'Twin Aces',
    'Elite Pairing',
    'Ace Venturas',
    'Grinders',
    'Court Commanders',
    'Alliance Court',
    'Rally Coalition',
    'The Second Set',
    'Breaking Baddies',
];

export const formatTeamName = (str: string) => {
    const exceptions = new Set(['The', 'A', 'Of', 'For', 'At', 'As', 'By', 'But', 'From', 'On', 'Out', 'To', 'With']);

    return str
        .trim()
        .replace(/\s\s+/g, ' ')
        .replace(/[a-zA-Z0-9]+/g, (s) => _capitalize(s))
        .replace(/\s[a-zA-Z]+/g, (s) => {
            if (exceptions.has(s.slice(1))) {
                return s.toLowerCase();
            }
            return s;
        });
};

export const getJoinDoublesLink = async (playerId: number, app) => {
    // link is active for 4 weeks
    const link = await getActionLink({ payload: { name: 'joinDoubles', playerId }, duration: 28 * 24 * 3600, app });
    return link;
};

export const sendAcceptedTeammateMessage = async (context: HookContext, teammateUserId: number) => {
    const sequelize = context.app.get('sequelizeClient');
    const currentUser = context.params.user;
    const { TL_URL } = process.env;
    const { config } = context.params;
    const { users } = sequelize.models;

    // send message to the player
    const user = await users.findByPk(teammateUserId);
    const fullName = getPlayerName(currentUser);
    const emails = [getEmailContact(user)];
    const profileLink = `${TL_URL}/player/${currentUser.slug}`;

    await context.app.service('api/emails').create({
        to: emails,
        subject: `${fullName} Added You to Their Doubles Team!`,
        html: getCustomEmail({
            config,
            compose: ({ h2 }) => `
    ${h2('Hello, #firstName#!', 'padding-top="10px"')}
    <mj-text>Team Captain <b><a href="${profileLink}">${fullName}</a></b> added you to their Doubles Team! Reach out to ${fullName} to start coordinating with your team:</mj-text>
    <mj-text>
        <b>Email:</b> ${getEmailLink(currentUser)}<br>
        <b>Phone:</b> ${getPhoneLink(currentUser)}
    </mj-text>`,
        }),
    });
};

export const sendNewPoolPlayerMessage = async (context: HookContext, playerId: number) => {
    const sequelizeClient = context.app.get('sequelizeClient');
    const currentUser = context.params.user;
    const { config } = context.params;
    const { players } = sequelizeClient.models;
    const { TL_URL } = process.env;
    const profileLink = `${TL_URL}/player/${currentUser.slug}`;
    const fullName = getPlayerName(currentUser);

    const player = await players.findByPk(playerId);
    if (!player) {
        return;
    }

    const [[tournament]] = await sequelizeClient.query(
        `SELECT t.id,
                s.year,
                s.season,
                l.slug AS levelSlug,
                l.type AS levelType,
                l.name AS levelName
           FROM tournaments AS t,
                levels AS l,
                seasons AS s
          WHERE t.seasonId=s.id AND
                t.levelId=l.id AND
                t.id=:tournamentId`,
        { replacements: { tournamentId: player.tournamentId } }
    );
    const doublesLadderLink = `${TL_URL}/season/${tournament.year}/${tournament.season}/${tournament.levelSlug}`;

    const [allPlayers] = await sequelizeClient.query(
        `SELECT p.*,
                u.firstName,
                u.lastName,
                u.email
           FROM players AS p,
                users AS u
          WHERE p.tournamentId=:tournamentId AND
                p.userId=u.id`,
        { replacements: { tournamentId: player.tournamentId } }
    );

    const captainsWithTeammates = allPlayers.reduce((set, item) => {
        if (item.partnerId) {
            set.add(item.partnerId);
        }
        return set;
    }, new Set());
    const captainsWithoutTeammates = allPlayers.filter(
        (item) => !captainsWithTeammates.has(item.id) && item.isActive === 1 && !item.partnerId
    );
    const otherPlayersFromPool = allPlayers.filter(
        (item) => item.id !== playerId && item.isActive === 1 && item.partnerId === POOL_PARTNER_ID
    );

    const emails = [...captainsWithoutTeammates, ...otherPlayersFromPool].map(getEmailContact);

    await context.app.service('api/emails').create({
        to: emails,
        subject: `${fullName} Joined the Doubles Player Pool!`,
        html: getCustomEmail({
            config,
            compose: ({ h2 }) => `
    ${h2('Hello, #firstName#!', 'padding-top="10px"')}
    <mj-text><a href="${profileLink}">${fullName}</a> joined the Player Pool for <a href="${doublesLadderLink}">${
        tournament.levelName
    }</a>! You can now add them to your Doubles Team. If you have any questions, feel free to contact them directly.</mj-text>
    <mj-text>
        <b>Email:</b> ${getEmailLink(currentUser)}<br>
        <b>Phone:</b> ${getPhoneLink(currentUser)}
        ${player.partnerInfo ? `<br><b>Comment:</b> ${player.partnerInfo}` : ''}
    </mj-text>`,
        }),
    });
};

export const sendDoublesTeamInvitation = async (context: HookContext, tournamentIds: number[], partners) => {
    const sequelize = context.app.get('sequelizeClient');
    const currentUser = context.params.user;
    const { config } = context.params;
    const { TL_URL } = process.env;

    if (!partners || tournamentIds.length === 0) {
        return;
    }

    // get season tournaments
    const [doublesTeamTournaments] = await sequelize.query(
        `
        SELECT t.id,
                s.year,
                s.season,
                l.slug AS levelSlug,
                l.type AS levelType,
                l.name AS levelName
            FROM tournaments AS t,
                levels AS l,
                seasons AS s
            WHERE t.seasonId=s.id AND
                t.levelId=l.id AND
                t.id IN (:tournamentIds) AND
                l.type="doubles-team"`,
        { replacements: { tournamentIds } }
    );

    // send invitation emails to Doubles partners
    for (const tournament of doublesTeamTournaments) {
        const { id } = tournament;
        const [[{ id: playerId, partnerId }]] = await sequelize.query(
            `SELECT * FROM players WHERE userId=:userId AND tournamentId=:tournamentId`,
            { replacements: { tournamentId: id, userId: currentUser.id } }
        );

        const fullName = getPlayerName(currentUser);
        const joinDoublesLink = await getJoinDoublesLink(playerId, context.app);
        const profileLink = `${TL_URL}/player/${currentUser.slug}`;
        const doublesLadderLink = `${TL_URL}/season/${tournament.year}/${tournament.season}/${tournament.levelSlug}`;

        if (!partnerId) {
            // send email to the captain itself
            context.app.service('api/emails').create({
                to: [getEmailContact(currentUser)],
                subject: `Your Reign as a Doubles Team Captain Begins Today!`,
                html: getCustomEmail({
                    config,
                    compose: ({ h2 }) => `
    ${h2('Welcome aboard, #firstName#!', 'padding-top="10px"')}
    <mj-text>You are now the Team Captain of your Doubles team. Huzzah!</mj-text>
    <mj-text>You can invite up to 2 teammates to your team. Just talk with your friends and send them this link to join:</mj-text>
    <mj-text><a href="${joinDoublesLink}">${joinDoublesLink}</a></mj-text>
    <mj-text>For other potential teammates, be sure to check the Player Pool.</mj-text>`,
                }),
            });
        }

        const partnerInfo = partners[`partner-${id}`];
        if (partnerInfo.decision === 'email') {
            // TODO: check emails for deliverability
            const emails = [partnerInfo.email1, partnerInfo.email2].filter(Boolean).map((email) => ({ email }));

            context.app.service('api/emails').create({
                to: emails,
                subject: `${fullName} Invited You to Play Doubles!`,
                html: getCustomEmail({
                    config,
                    compose: ({ h2 }) => `
    ${h2('Hello!', 'padding-top="10px"')}
    <mj-text><b><a href="${profileLink}">${fullName}</a></b> invited you to join their Doubles team!</mj-text>
    <mj-button href="${joinDoublesLink}">Join the team</mj-button>
    <mj-text>Learn more about the <a href="${doublesLadderLink}">${tournament.levelName} ladder</a>.</mj-text>`,
                }),
            });
        } else if (partnerInfo.decision === 'pool') {
            // Do not wait for it
            sendNewPoolPlayerMessage(context, playerId);
        } else if (partnerInfo.decision === 'player') {
            const [[player]] = await sequelize.query(`SELECT * FROM players WHERE id=:playerId`, {
                replacements: { playerId: partnerInfo.partnerId },
            });

            if (player) {
                sendAcceptedTeammateMessage(context, player.userId);
            }
        }
    }
};

export const getPlayersUpdates = ({ players, playerId, captainId, replaceCaptain }) => {
    const result = [];

    if (captainId === 999999 && replaceCaptain) {
        replaceCaptain = false;
    }

    const player = players.find((item) => item.id === playerId);
    const captain = players.find((item) => item.id === captainId);
    const isPlayerCaptain = !player.partnerId;

    if (isPlayerCaptain && playerId === captainId && replaceCaptain) {
        return [];
    }

    result.push({
        id: playerId,
        partnerId: replaceCaptain ? null : captainId,
        teamName: replaceCaptain ? captain.teamName : null,
    });

    if (player.partnerId === captainId && replaceCaptain) {
        players
            .filter((item) => (item.partnerId === captainId || item.id === captainId) && item.id !== playerId)
            .forEach((item) => {
                result.push({
                    id: item.id,
                    partnerId: playerId,
                    teamName: null,
                });
            });
    } else {
        if (isPlayerCaptain) {
            const newCaptain = players.find((item) => item.partnerId === playerId);

            // captain is moving to partner at the same team
            if (newCaptain && playerId === captainId) {
                result[0].partnerId = newCaptain.id;
            }

            players
                .filter((item) => item.partnerId === playerId)
                .forEach((item) => {
                    result.push({
                        id: item.id,
                        partnerId: item.id === newCaptain.id ? null : newCaptain.id,
                        teamName: item.id === newCaptain.id ? player.teamName : null,
                    });
                });
        }
        if (replaceCaptain && playerId !== captainId) {
            players
                .filter((item) => item.partnerId === captainId || item.id === captainId)
                .forEach((item) => {
                    result.push({
                        id: item.id,
                        partnerId: playerId,
                        teamName: null,
                    });
                });
        }
    }

    return result.sort((a, b) => a.id - b.id);
};

export function splitAddress(address: string) {
    const designators = ['Apartment', 'Apt', 'Unit', 'Suite', 'Ste', 'Floor', 'Fl', 'Room'];
    const designatorRegex = new RegExp(`\\s*(${designators.join('|')})\\s*#?\\s*([\\w\\-]+)$`, 'i');

    const match = address.match(designatorRegex);
    if (match) {
        return {
            line1: address.replace(match[0], '').trim(),
            line2: `${_capitalize(match[1])} ${match[2]}`,
        };
    }

    // No secondary unit found, return original as line1 only
    return {
        line1: address,
        line2: '',
    };
}
