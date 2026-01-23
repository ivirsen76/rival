import type { Sequelize } from 'sequelize';
import type { HookContext } from '@feathersjs/feathers';
import { disallow } from 'feathers-hooks-common';
import { NotFound, Unprocessable } from '@feathersjs/errors';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { purgeTournamentCache } from '../commonHooks';
import newTeamCreatedTemplate from '../../emailTemplates/newTeamCreated';
import newTeamMemberCandidateTemplate from '../../emailTemplates/newTeamMemberCandidate';
import disbandTeamTemplate from '../../emailTemplates/disbandTeam';
import joinTeamTemplate from '../../emailTemplates/joinTeam';
import teamMemberDeletedTemplate from '../../emailTemplates/teamMemberDeleted';
import teamMemberAddedTemplate from '../../emailTemplates/teamMemberAdded';
import leaveTeamTemplate from '../../emailTemplates/leaveTeam';
import playerInvitedToTeamTemplate from '../../emailTemplates/playerInvitedToTeam';
import playerAcceptedInvitationTemplate from '../../emailTemplates/playerAcceptedInvitation';
import _difference from 'lodash/difference';
import _pick from 'lodash/pick';
import _isEmpty from 'lodash/isEmpty';
import { getTeamName, getTlrLimit, minMatches } from './helpers';
import dayjs from '../../utils/dayjs';
import { getActionLink, decodeAction } from '../../utils/action';
import renderImage from '../../utils/renderImage';
import yup from '../../packages/yup';
import { throwValidationErrors, getSchemaErrors } from '../../helpers';
import { getPlayerName, getEmailContact } from '../users/helpers';

const { TL_URL } = process.env;

const getTeamsUrl = async (sequelize: Sequelize, playerId: number, isFullLink = true) => {
    const [teams] = await sequelize.query(
        `
        SELECT s.year,
               s.season,
               l.slug
          FROM players AS p,
               tournaments AS t,
               seasons AS s,
               levels AS l
         WHERE p.tournamentId=t.id AND
               t.seasonId=s.id AND
               t.levelId=l.id AND
               p.id=:playerId`,
        {
            replacements: { playerId },
        }
    );

    const team = teams[0];

    return `${isFullLink ? TL_URL : ''}/season/${team.year}/${team.season}/${team.slug}/teams`;
};

const getTeamsStat = async (sequelize: Sequelize, tournamentId: number, checkSetupWeek = true) => {
    const [[info]] = await sequelize.query(
        `SELECT s.startDate, t.levelId
           FROM tournaments AS t,
                seasons AS s
          WHERE t.seasonId=s.id AND
                t.id=:tournamentId`,
        { replacements: { tournamentId } }
    );
    if (!info) {
        throw new Unprocessable('The tournament is wrong.');
    }

    if (checkSetupWeek) {
        const currentWeek = Math.ceil(dayjs.tz().diff(dayjs.tz(info.startDate), 'week', true));
        if (currentWeek !== 1) {
            throw new Unprocessable('There is no setup week for the teams.');
        }
    }

    const getInitialStats = async (userId: number) => {
        const [[match]] = await sequelize.query(
            `SELECT m.challengerElo,
                    m.challengerMatches,
                    m.acceptorElo,
                    m.acceptorMatches,
                    pc.userId AS challengerUserId,
                    pa.userId AS acceptorUserId
               FROM matches AS m
               JOIN players AS pc ON m.challengerId=pc.id
               JOIN players AS pa ON m.acceptorId=pa.id
               JOIN tournaments AS t ON pc.tournamentId=t.id
              WHERE m.score IS NOT NULL AND
                    t.levelId=:levelId AND
                    (pc.userId=:userId OR pa.userId=:userId)
           ORDER BY m.playedAt DESC, m.id DESC
              LIMIT 0, 1`,
            { replacements: { userId, levelId: info.levelId } }
        );

        if (!match) {
            return { elo: 1500, matches: 0 };
        }

        return {
            elo: match.challengerUserId === userId ? match.challengerElo : match.acceptorElo,
            matches: match.challengerUserId === userId ? match.challengerMatches : match.acceptorMatches,
        };
    };

    const [players] = await sequelize.query(
        `SELECT p.id,
                p.userId,
                p.joinAnyTeam,
                p.isActive,
                tm.role,
                tm.teamId
           FROM players AS p
      LEFT JOIN teammembers AS tm ON p.id=tm.playerId
          WHERE p.tournamentId=:tournamentId`,
        { replacements: { tournamentId } }
    );

    const result = {
        captains: [],
        members: [],
        unassigned: [],
        restricted: [],
        userIds: {},
        teams: {},
    };

    for (const player of players) {
        result.userIds[player.id] = player.userId;

        if (player.role === 'captain') {
            result.captains.push(player.id);
        } else if (player.role === 'member') {
            result.members.push(player.id);
        } else if (!player.isActive) {
            result.restricted.push(player.id);
        } else {
            const initialStats = await getInitialStats(player.userId);

            if (initialStats.matches < minMatches) {
                result.restricted.push(player.id);
            } else {
                result.unassigned.push(player.id);
            }
        }

        if (player.teamId) {
            result.teams[player.teamId] = result.teams[player.teamId] || {
                id: player.teamId,
                players: [],
                isFull: false,
                captain: 0,
            };

            result.teams[player.teamId].players.push(player.id);
            result.teams[player.teamId].isFull = result.teams[player.teamId].players.length >= 4;

            if (player.role === 'captain') {
                result.teams[player.teamId].captain = player.id;
            }
        }
    }

    return result;
};

const getUserInitialTlr = async (sequelize: Sequelize, userId: number, levelId: number) => {
    const weekStart = dayjs.tz().isoWeekday(1).hour(0).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss');

    const [matches] = await sequelize.query(
        `SELECT m.challengerElo,
                m.acceptorElo,
                pc.userId AS challengerUserId,
                pa.userId AS acceptorUserId
           FROM matches AS m
           JOIN players AS pc ON m.challengerId=pc.id
           JOIN players AS pa ON m.acceptorId=pa.id
           JOIN tournaments AS t ON t.id=pc.tournamentId AND t.levelId=:levelId
          WHERE m.score IS NOT NULL AND
                m.playedAt<:date AND
                (pc.userId=:userId OR pa.userId=:userId)
        ORDER BY m.playedAt DESC
           LIMIT 0, 1`,
        { replacements: { userId, levelId, date: weekStart } }
    );

    const match = matches[0];

    if (!match) {
        return 1500;
    }

    return match.challengerUserId === userId ? match.challengerElo : match.acceptorElo;
};

const getTournamentInfo = async (context: HookContext, tournamentId: number) => {
    const sequelize = context.app.get('sequelizeClient');
    const [[params]] = await sequelize.query(
        `SELECT s.year, s.season, l.slug
        FROM tournaments AS t,
             seasons AS s,
             levels AS l
       WHERE t.seasonId=s.id AND
             t.levelId=l.id AND
             t.id=:tournamentId`,
        {
            replacements: { tournamentId },
        }
    );

    const tournamentInfo = await context.app
        .service('api/tournaments')
        .get(1, { query: { year: params.year, season: params.season, level: params.slug } });

    return tournamentInfo.data;
};

const createTeam = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const currentUser = context.params.user;
    const { data } = context;
    const sequelize = context.app.get('sequelizeClient');

    // Validate data
    {
        const schema = yup.object().shape({
            tournamentId: yup.number().required(),
            player1: yup.number().required('The captain is required.'),
            player2: yup.number(),
            player3: yup.number(),
            player4: yup.number(),
            player5: yup.number(),
            name: yup.number(),
            customName: yup.string().max(12),
        });

        const errors = getSchemaErrors(schema, data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const players = ['player1', 'player2', 'player3', 'player4', 'player5'].filter((name) => data[name]);
    if (players.length < 1) {
        throw new Unprocessable('Is has to be at least one player in a team.');
    }

    const teamsStat = await getTeamsStat(sequelize, data.tournamentId);
    if (players.some((name) => teamsStat.captains.includes(data[name]) || teamsStat.members.includes(data[name]))) {
        throw new Unprocessable('Some players are playing in another team.');
    }

    if (players.some((name) => !teamsStat.unassigned.includes(data[name]))) {
        throw new Unprocessable('Some players are not eligible to play in Teams.');
    }

    if (teamsStat.userIds[data.player1] !== currentUser.id) {
        throw new Unprocessable('You have to be a captain.');
    }

    const teamName = getTeamName(data);
    if (!teamName) {
        throw new Unprocessable('Name is required.', { errors: { name: 'Name is required.' } });
    }

    const [teamId] = await sequelize.query(
        `INSERT INTO teams (tournamentId, name, customName) VALUES (:tournamentId, :name, :customName)`,
        {
            replacements: { tournamentId: data.tournamentId, name: data.name, customName: data.customName || null },
        }
    );

    const memberIds = [];
    for (const name of ['player1', 'player2', 'player3', 'player4', 'player5']) {
        if (!data[name]) {
            continue;
        }

        if (name !== 'player1') {
            memberIds.push(data[name]);
        }

        await sequelize.query(`UPDATE players SET joinAnyTeam=0, joinAnyTeamComment=NULL WHERE id=:playerId`, {
            replacements: { playerId: data[name] },
        });
        await sequelize.query(`INSERT INTO teammembers (playerId, teamId, role) VALUES (:playerId, :teamId, :role)`, {
            replacements: { playerId: data[name], teamId, role: name === 'player1' ? 'captain' : 'member' },
        });
    }

    await purgeTournamentCache({ tournamentId: data.tournamentId })(context);

    if (memberIds.length > 0) {
        const [members] = await sequelize.query(`SELECT u.firstName, u.lastName, u.email
            FROM users AS u, players AS p
           WHERE p.userId=u.id AND p.id IN (${memberIds.join(',')})`);
        const teamsUrl = await getTeamsUrl(sequelize, data.player1);

        context.app.service('api/emails').create({
            to: members.map(getEmailContact),
            subject: `You've Been Added to the ${teamName} Team!`,
            html: newTeamCreatedTemplate(context.params.config, {
                captainName: getPlayerName(currentUser),
                teamsUrl,
            }),
        });
    }

    return context;
};

const joinAnyTeam = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const currentUser = context.params.user;
    const sequelize = context.app.get('sequelizeClient');
    const { tournamentId, comment } = context.data;
    const { players } = sequelize.models;

    // Validate data
    {
        const schema = yup.object().shape({
            tournamentId: yup.number().required(),
            comment: yup.string().max(1000),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const teamsStat = await getTeamsStat(sequelize, tournamentId);
    const currentPlayerId = teamsStat.unassigned.find((id) => teamsStat.userIds[id] === currentUser.id);
    if (!currentPlayerId) {
        throw new Unprocessable('You cannot join the Player Pool.');
    }

    const [[playerInfo]] = await sequelize.query(
        `SELECT p.id, p.joinAnyTeam, t.levelId
           FROM players AS p,
                tournaments AS t
          WHERE p.userId=:userId AND
                p.tournamentId=:tournamentId AND
                p.tournamentid=t.id`,
        { replacements: { userId: currentUser.id, tournamentId } }
    );

    if (playerInfo.joinAnyTeam) {
        throw new Unprocessable('You have already sent join request.');
    }

    await players.update({ joinAnyTeam: true, joinAnyTeamComment: comment }, { where: { id: currentPlayerId } });
    await purgeTournamentCache({ tournamentId })(context);

    {
        const initialTlr = await getUserInitialTlr(sequelize, currentUser.id, playerInfo.levelId);
        const teamsUrl = await getTeamsUrl(sequelize, currentPlayerId);

        const tournamentInfo = await getTournamentInfo(context, tournamentId);

        const captains = tournamentInfo.teams
            .filter((team) => {
                const tlrLimit = getTlrLimit(team.players.map((item) => tournamentInfo.players[item.id]));
                return initialTlr <= tlrLimit;
            })
            .map((team) => {
                const captain = team.players.find((item) => item.role === 'captain');
                return tournamentInfo.players[captain.id];
            });

        context.app.service('api/emails').create({
            to: captains.map(getEmailContact),
            subject: `${getPlayerName(currentUser)} Wants to Join a Team!`,
            html: newTeamMemberCandidateTemplate(context.params.config, {
                playerName: getPlayerName(currentUser),
                playerFirstName: currentUser.firstName,
                initialTlr,
                teamsUrl,
                comment,
            }),
        });
    }

    return context;
};

const askToJoin = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const currentUser = context.params.user;
    const sequelize = context.app.get('sequelizeClient');
    const teamId = Number(context.id);
    const { comment } = context.data;

    const [[team]] = await sequelize.query(`SELECT * FROM teams WHERE id=:teamId`, { replacements: { teamId } });
    if (!team) {
        throw new Unprocessable('The team is wrong.');
    }
    const { tournamentId } = team;

    const teamsStat = await getTeamsStat(sequelize, tournamentId);
    const currentPlayerId = teamsStat.unassigned.find((id) => teamsStat.userIds[id] === currentUser.id);
    if (!currentPlayerId) {
        throw new Unprocessable('You cannot send a join request.');
    }

    const ACTION_NAME = `joinRequestForTeam${teamId}`;
    const [actions] = await sequelize.query(`SELECT * FROM actions WHERE tableId=:tableId AND name=:name`, {
        replacements: { tableId: currentPlayerId, name: ACTION_NAME },
    });
    if (actions.length > 0) {
        throw new Unprocessable('You have already sent a join request to this team.');
    }

    await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:tableId, :name)`, {
        replacements: { tableId: currentPlayerId, name: ACTION_NAME },
    });

    const [captains] = await sequelize.query(
        `SELECT u.firstName, u.lastName, u.email, t.levelId
           FROM users AS u,
                players AS p,
                teammembers AS tm,
                tournaments AS t
          WHERE u.id=p.userId AND
                p.id=tm.playerId AND
                p.tournamentId=t.id AND
                tm.teamId=:teamId AND
                tm.role="captain"`,
        { replacements: { teamId } }
    );
    const initialTlr = await getUserInitialTlr(sequelize, currentUser.id, captains[0].levelId);

    const acceptLink = await getActionLink({
        payload: { name: 'acceptTeamMember', teamId, playerId: currentPlayerId },
        duration: 7 * 24 * 3600,
    });
    context.app.service('api/emails').create({
        to: captains.map(getEmailContact),
        subject: `${getPlayerName(currentUser)} Wants to Join Your Team!`,
        html: joinTeamTemplate(context.params.config, {
            playerName: getPlayerName(currentUser),
            playerFirstName: currentUser.firstName,
            initialTlr,
            comment,
            acceptLink,
        }),
    });

    return context;
};

const updateTeam = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const currentUser = context.params.user;
    const { data } = context;
    const teamId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');

    // Validate data
    {
        const schema = yup.object().shape({
            player2: yup.number(),
            player3: yup.number(),
            player4: yup.number(),
            player5: yup.number(),
            name: yup.number(),
            customName: yup.string().max(12),
        });

        const errors = getSchemaErrors(schema, data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const [[team]] = await sequelize.query(`SELECT * FROM teams WHERE id=:teamId`, { replacements: { teamId } });
    if (!team) {
        throw new Unprocessable('The team is wrong.');
    }
    const { tournamentId } = team;

    const teamsStat = await getTeamsStat(sequelize, tournamentId);
    const teamInfo = teamsStat.teams[teamId];
    const currentPlayerId = teamsStat.captains.find((id) => teamsStat.userIds[id] === currentUser.id);
    if (!currentPlayerId || !teamInfo.players.includes(currentPlayerId)) {
        throw new Unprocessable('You are not a captain.');
    }

    const players = ['player2', 'player3', 'player4', 'player5'].filter((name) => data[name]);

    if (players.some((name) => !teamsStat.unassigned.includes(data[name]) && !teamInfo.players.includes(data[name]))) {
        throw new Unprocessable('Some players are not available to join.');
    }

    const teamName = getTeamName(data);
    if (!teamName) {
        throw new Unprocessable('Name is required.', { errors: { name: 'Name is required.' } });
    }

    const newMembers = players.map((name) => data[name]);
    const toBeDeleted = _difference(teamInfo.players, [...newMembers, currentPlayerId]);
    const toBeAdded = _difference(newMembers, teamInfo.players);

    // Update team names
    await sequelize.query(`UPDATE teams SET name=:name, customName=:customName WHERE id=:teamId`, {
        replacements: { name: data.name, customName: data.customName || null, teamId },
    });

    // Delete members
    if (toBeDeleted.length > 0) {
        await sequelize.query(
            `DELETE FROM teammembers WHERE teamId=:teamId AND playerId IN (${toBeDeleted.join(',')})`,
            { replacements: { teamId } }
        );
    }

    // Add members
    for (const playerId of toBeAdded) {
        await sequelize.query('UPDATE players SET joinAnyTeam=0 WHERE id=:playerId', {
            replacements: { playerId },
        });
        await sequelize.query(`INSERT INTO teammembers (playerId, teamId, role) VALUES (:playerId, :teamId, :role)`, {
            replacements: { playerId, teamId, role: 'member' },
        });
    }

    await purgeTournamentCache({ tournamentId })(context);

    const teamsUrl = await getTeamsUrl(sequelize, teamId);

    if (toBeDeleted.length > 0) {
        const [deletedMembers] = await sequelize.query(
            `SELECT u.firstName, u.lastName, u.email
               FROM users AS u,
                    players AS p
              WHERE u.id=p.userId AND
                    p.id IN (${toBeDeleted.join(',')})`
        );

        context.app.service('api/emails').create({
            to: deletedMembers.map(getEmailContact),
            subject: `You've Been Removed From the ${teamName} Team`,
            html: teamMemberDeletedTemplate(context.params.config, {
                captainName: getPlayerName(currentUser),
                teamsUrl,
            }),
        });
    }

    if (toBeAdded.length > 0) {
        const [addedMembers] = await sequelize.query(
            `SELECT u.firstName, u.lastName, u.email
               FROM users AS u,
                    players AS p
              WHERE u.id=p.userId AND
                    p.id IN (${toBeAdded.join(',')})`
        );

        context.app.service('api/emails').create({
            to: addedMembers.map(getEmailContact),
            subject: `You've Been Added to the ${teamName} Team!`,
            html: newTeamCreatedTemplate(context.params.config, {
                captainName: getPlayerName(currentUser),
                teamsUrl,
            }),
        });
    }

    return context;
};

const disbandTeam = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const currentUser = context.params.user;
    const teamId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { reason } = context.data;

    // Validate data
    {
        const schema = yup.object().shape({
            reason: yup.string().max(1000),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const [[team]] = await sequelize.query(`SELECT * FROM teams WHERE id=:teamId`, { replacements: { teamId } });
    if (!team) {
        throw new Unprocessable('The team is wrong.');
    }
    const { tournamentId } = team;
    const teamName = getTeamName(team);

    const teamsStat = await getTeamsStat(sequelize, tournamentId);
    const teamInfo = teamsStat.teams[teamId];
    const currentPlayerId = teamsStat.captains.find((id) => teamsStat.userIds[id] === currentUser.id);
    if (!currentPlayerId || !teamInfo.players.includes(currentPlayerId)) {
        throw new Unprocessable('You are not a captain.');
    }

    const [members] = await sequelize.query(
        `SELECT u.firstName, u.lastName, u.email
           FROM users AS u,
                players AS p,
                teammembers AS tm
          WHERE u.id=p.userId AND
                p.id=tm.playerId AND
                tm.teamId=:teamId AND
                tm.role="member"`,
        { replacements: { teamId } }
    );

    await sequelize.query(`DELETE FROM teammembers WHERE teamId=:teamId`, { replacements: { teamId } });
    await sequelize.query(`DELETE FROM teams WHERE id=:teamId`, { replacements: { teamId } });

    await purgeTournamentCache({ tournamentId })(context);

    if (members.length > 0) {
        const teamsUrl = await getTeamsUrl(sequelize, teamId);

        context.app.service('api/emails').create({
            to: members.map(getEmailContact),
            subject: `${getPlayerName(currentUser)} Disbanded the ${teamName} Team`,
            html: disbandTeamTemplate(context.params.config, {
                captainName: getPlayerName(currentUser),
                teamsUrl,
                reason,
            }),
        });
    }

    return context;
};

const leaveTeam = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const currentUser = context.params.user;
    const teamId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { reason } = context.data;

    // Validate data
    {
        const schema = yup.object().shape({
            reason: yup.string().max(1000),
        });

        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const [[team]] = await sequelize.query(`SELECT * FROM teams WHERE id=:teamId`, { replacements: { teamId } });
    if (!team) {
        throw new Unprocessable('The team is wrong.');
    }
    const { tournamentId } = team;

    const teamsStat = await getTeamsStat(sequelize, tournamentId);
    const teamInfo = teamsStat.teams[teamId];
    const currentPlayerId = teamInfo.players.find((id) => teamsStat.userIds[id] === currentUser.id);
    if (!currentPlayerId) {
        throw new Unprocessable('You are not a member of the team.');
    }
    if (teamsStat.captains.includes(currentPlayerId)) {
        throw new Unprocessable('You cannot leave as a captain.');
    }

    if (teamInfo.players.length === 2) {
        // Delete the whole team
        await sequelize.query(`DELETE FROM teammembers WHERE teamId=:teamId`, { replacements: { teamId } });
        await sequelize.query(`DELETE FROM teams WHERE id=:teamId`, { replacements: { teamId } });
    } else {
        // Delete just myself
        await sequelize.query(`DELETE FROM teammembers WHERE teamId=:teamId AND playerId=:playerId`, {
            replacements: { teamId, playerId: currentPlayerId },
        });
    }

    await purgeTournamentCache({ tournamentId })(context);

    const [captains] = await sequelize.query(
        `SELECT u.firstName, u.lastName, u.email
           FROM users AS u,
                players AS p
          WHERE u.id=p.userId AND
                p.id=:playerId`,
        { replacements: { playerId: teamInfo.captain } }
    );

    const teamsUrl = await getTeamsUrl(sequelize, teamId);

    context.app.service('api/emails').create({
        to: captains.map(getEmailContact),
        subject: `${getPlayerName(currentUser)} Left Your Team!`,
        html: leaveTeamTemplate(context.params.config, {
            memberName: getPlayerName(currentUser),
            isDisbanded: teamInfo.players.length === 2,
            teamsUrl,
            reason,
        }),
    });

    return context;
};

const acceptMember = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const currentUser = context.params.user;
    const teamId = Number(context.id);
    const { playerId } = context.data;
    const sequelize = context.app.get('sequelizeClient');

    const [[team]] = await sequelize.query(`SELECT * FROM teams WHERE id=:teamId`, { replacements: { teamId } });
    if (!team) {
        throw new Unprocessable('The team is wrong.');
    }
    const { tournamentId } = team;

    const teamsStat = await getTeamsStat(sequelize, tournamentId);
    const teamInfo = teamsStat.teams[teamId];
    const currentPlayerId = teamInfo.players.find((id) => teamsStat.userIds[id] === currentUser.id);
    if (!currentPlayerId || currentPlayerId !== teamInfo.captain) {
        throw new Unprocessable('You are not a captain.');
    }
    if (!teamsStat.unassigned.includes(playerId)) {
        throw new Unprocessable('This user is not available.');
    }

    await sequelize.query(`UPDATE players SET joinAnyTeam=0, joinAnyTeamComment=NULL WHERE id=:playerId`, {
        replacements: { playerId },
    });
    await sequelize.query(`INSERT INTO teammembers (playerId, teamId) VALUES (:playerId, :teamId)`, {
        replacements: { playerId, teamId },
    });

    await purgeTournamentCache({ tournamentId })(context);

    const [members] = await sequelize.query(
        `SELECT u.firstName, u.lastName, u.email
           FROM users AS u,
                players AS p
          WHERE u.id=p.userId AND
                p.id=:playerId`,
        { replacements: { playerId } }
    );

    const teamName = getTeamName(team);

    context.app.service('api/emails').create({
        to: members.map(getEmailContact),
        subject: `You've Been Added to the ${teamName} Team!`,
        html: teamMemberAddedTemplate(context.params.config, {
            captainName: getPlayerName(currentUser),
            teamName,
        }),
    });

    return context;
};

const deleteCandidate = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const currentUser = context.params.user;
    const { playerId } = context.data;
    const sequelize = context.app.get('sequelizeClient');
    const { players } = sequelize.models;

    const player = await players.findByPk(playerId);

    if (!player || currentUser.id !== player.userId) {
        throw new Unprocessable('The user is wrong.');
    }

    await sequelize.query(`UPDATE players SET joinAnyTeam=0, joinAnyTeamComment=NULL WHERE id=:playerId`, {
        replacements: { playerId },
    });

    await purgeTournamentCache({ tournamentId: player.tournamentId })(context);

    return context;
};

const acceptMemberByLink = () => async (context: HookContext) => {
    let action;
    try {
        action = decodeAction(context.data.payload);
    } catch (e) {
        throw new Unprocessable(e.message);
    }

    if (action.name !== 'acceptTeamMember') {
        throw new Unprocessable('The link is broken');
    }

    const sequelize = context.app.get('sequelizeClient');
    const path = await getTeamsUrl(sequelize, action.playerId, false);
    const playerId = Number(action.playerId);
    const teamId = Number(action.teamId);

    const [[team]] = await sequelize.query(`SELECT * FROM teams WHERE id=:teamId`, { replacements: { teamId } });
    if (!team) {
        throw new Unprocessable('The team is wrong.');
    }
    const { tournamentId } = team;

    const teamsStat = await getTeamsStat(sequelize, tournamentId);
    if (!teamsStat.unassigned.includes(playerId)) {
        throw new Unprocessable('This user is not available.');
    }

    await sequelize.query(`UPDATE players SET joinAnyTeam=0, joinAnyTeamComment=NULL WHERE id=:playerId`, {
        replacements: { playerId },
    });
    await sequelize.query(`INSERT INTO teammembers (playerId, teamId) VALUES (:playerId, :teamId)`, {
        replacements: { playerId, teamId },
    });

    const [[player]] = await sequelize.query(
        `SELECT u.firstName, u.lastName, u.email
           FROM users AS u,
                players AS p
          WHERE u.id=p.userId AND
                p.id=:playerId`,
        { replacements: { playerId } }
    );

    context.result = {
        path,
        playerName: getPlayerName(player),
    };

    await purgeTournamentCache({ tournamentId })(context);

    {
        const [[captain]] = await sequelize.query(
            `SELECT u.firstName, u.lastName
               FROM users AS u,
                    players AS p,
                    teammembers AS tm
              WHERE u.id=p.userId AND
                    p.id=tm.playerId AND
                    tm.teamId=:teamId AND
                    tm.role="captain"`,
            { replacements: { teamId } }
        );

        const teamName = getTeamName(team);

        context.app.service('api/emails').create({
            to: [getEmailContact(player)],
            subject: `You've Been Added to the ${teamName} Team!`,
            html: teamMemberAddedTemplate(context.params.config, {
                captainName: getPlayerName(captain),
                teamName,
            }),
        });
    }

    return context;
};

const invitePlayers = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const teamId = Number(context.id);
    const currentUser = context.params.user;
    const sequelize = context.app.get('sequelizeClient');

    if (context.data.players.length > 3) {
        throw new Unprocessable('Just three players could be invited.');
    }

    const [[team]] = await sequelize.query(`SELECT * FROM teams WHERE id=:teamId`, { replacements: { teamId } });
    if (!team) {
        throw new Unprocessable('The team is wrong.');
    }
    const { tournamentId } = team;

    const teamsStat = await getTeamsStat(sequelize, tournamentId);
    const teamInfo = teamsStat.teams[teamId];
    const currentPlayerId = teamInfo.players.find((id) => teamsStat.userIds[id] === currentUser.id);
    if (!currentPlayerId || currentPlayerId !== teamInfo.captain) {
        throw new Unprocessable('You are not a captain.');
    }

    if (context.data.players.some((id) => !teamsStat.unassigned.includes(id))) {
        throw new Unprocessable('Some players are not available to join.');
    }

    const invitedPlayers = team.invitedPlayers ? team.invitedPlayers.split(',').map(Number) : [];
    const currentDate = dayjs.tz();

    if (context.data.players.some((id) => invitedPlayers.includes(id))) {
        throw new Unprocessable('You already invited some of these players.');
    }
    if (team.invitedAt && currentDate.isSame(dayjs.tz(team.invitedAt), 'day')) {
        throw new Unprocessable('You already invited players today.');
    }

    await sequelize.query(`UPDATE teams SET invitedPlayers=:invitedPlayers, invitedAt=:invitedAt WHERE id=:teamId`, {
        replacements: {
            invitedPlayers: [...invitedPlayers, ...context.data.players].join(','),
            invitedAt: currentDate.format('YYYY-MM-DD HH:mm:ss'),
            teamId,
        },
    });

    await purgeTournamentCache({ tournamentId })(context);

    (async () => {
        const tournamentInfo = await getTournamentInfo(context, tournamentId);
        const teamName = getTeamName(team);
        const teamsUrl = await getTeamsUrl(sequelize, teamId);

        const props = encodeURIComponent(
            JSON.stringify({
                team: tournamentInfo.teams.find((item) => item.id === teamId),
                players: teamInfo.players.reduce((obj, id) => {
                    obj[id] = _pick(tournamentInfo.players[id], ['id', 'firstName', 'lastName', 'avatar', 'weekTlr']);
                    return obj;
                }, {}),
            })
        );
        const img = await renderImage(`${process.env.TL_URL}/image/team?props=${props}`);

        for (const playerId of context.data.players) {
            const recipient = tournamentInfo.players[playerId];

            const acceptLink = await getActionLink({
                payload: { name: 'acceptTeamInvitation', playerId, teamId },
                duration: 7 * 24 * 3600,
            });
            context.app.service('api/emails').create({
                to: [getEmailContact(recipient)],
                subject: `You've Been Invited to the ${teamName} Team!`,
                html: playerInvitedToTeamTemplate(context.params.config, {
                    captainName: getPlayerName(currentUser),
                    teamName,
                    teamsUrl,
                    img,
                    comment: context.data.comment,
                    acceptLink,
                }),
            });
        }
    })();

    return context;
};

const joinTeamByLink = () => async (context: HookContext) => {
    let action;
    try {
        action = decodeAction(context.data.payload);
    } catch (e) {
        throw new Unprocessable(e.message);
    }

    if (action.name !== 'acceptTeamInvitation') {
        throw new Unprocessable('The link is broken');
    }

    const playerId = Number(action.playerId);
    const teamId = Number(action.teamId);
    const sequelize = context.app.get('sequelizeClient');

    const [[team]] = await sequelize.query(`SELECT * FROM teams WHERE id=:teamId`, { replacements: { teamId } });
    if (!team) {
        throw new Unprocessable('The team is wrong.');
    }
    const { tournamentId } = team;

    const teamsStat = await getTeamsStat(sequelize, tournamentId);
    if (!teamsStat.unassigned.includes(playerId)) {
        throw new Unprocessable('This user is not available.');
    }

    const path = await getTeamsUrl(sequelize, playerId, false);
    const teamName = getTeamName(team);

    await sequelize.query(`UPDATE players SET joinAnyTeam=0, joinAnyTeamComment=NULL WHERE id=:playerId`, {
        replacements: { playerId },
    });
    await sequelize.query(`INSERT INTO teammembers (playerId, teamId) VALUES (:playerId, :teamId)`, {
        replacements: { playerId, teamId },
    });

    context.result = { path, teamName };

    await purgeTournamentCache({ tournamentId: team.tournamentId })(context);

    {
        const [[player]] = await sequelize.query(
            `SELECT u.firstName, u.lastName
               FROM users AS u,
                    players AS p
              WHERE u.id=p.userId AND
                    p.id=:playerId`,
            { replacements: { playerId } }
        );

        const [[captain]] = await sequelize.query(
            `SELECT u.firstName, u.lastName, u.email
               FROM users AS u,
                    players AS p,
                    teammembers AS tm
              WHERE u.id=p.userId AND
                    p.id=tm.playerId AND
                    tm.teamId=:teamId AND
                    tm.role="captain"`,
            { replacements: { teamId } }
        );

        context.app.service('api/emails').create({
            to: [getEmailContact(captain)],
            subject: `${getPlayerName(player)} Joined Your Team!`,
            html: playerAcceptedInvitationTemplate(context.params.config, {
                playerName: getPlayerName(player),
            }),
        });
    }

    return context;
};

const pickPlayersForNextWeek = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const teamId = Number(context.id);
    const currentUser = context.params.user;
    const sequelize = context.app.get('sequelizeClient');

    if (context.data.players.length > 3) {
        throw new Unprocessable('Too many players', {
            errors: { playingNextWeek: 'You cannot pick more than 3 players.' },
        });
    }

    const [[team]] = await sequelize.query(`SELECT * FROM teams WHERE id=:teamId`, { replacements: { teamId } });
    if (!team) {
        throw new Unprocessable('The team is wrong.');
    }
    const { tournamentId } = team;

    const teamsStat = await getTeamsStat(sequelize, tournamentId, false);
    const teamInfo = teamsStat.teams[teamId];
    const currentPlayerId = teamInfo.players.find((id) => teamsStat.userIds[id] === currentUser.id);
    if (!currentPlayerId || currentPlayerId !== teamInfo.captain) {
        throw new Unprocessable('You are not a captain.');
    }

    if (context.data.players.some((id) => !teamInfo.players.includes(id))) {
        throw new Unprocessable('Players are not from your team.');
    }

    await sequelize.query(`UPDATE teams SET playingNextWeek=:playingNextWeek WHERE id=:teamId`, {
        replacements: {
            playingNextWeek: context.data.players.join(','),
            teamId,
        },
    });

    await purgeTournamentCache({ tournamentId })(context);

    return context;
};

const runCustomAction = () => async (context: HookContext) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'joinAnyTeam') {
        await joinAnyTeam()(context);
    } else if (action === 'updateTeam') {
        await updateTeam()(context);
    } else if (action === 'disbandTeam') {
        await disbandTeam()(context);
    } else if (action === 'leaveTeam') {
        await leaveTeam()(context);
    } else if (action === 'askToJoin') {
        await askToJoin()(context);
    } else if (action === 'acceptMember') {
        await acceptMember()(context);
    } else if (action === 'deleteCandidate') {
        await deleteCandidate()(context);
    } else if (action === 'acceptMemberByLink') {
        await acceptMemberByLink()(context);
    } else if (action === 'invitePlayers') {
        await invitePlayers()(context);
    } else if (action === 'joinTeamByLink') {
        await joinTeamByLink()(context);
    } else if (action === 'pickPlayersForNextWeek') {
        await pickPlayersForNextWeek()(context);
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
        get: [disallow()],
        create: [createTeam()],
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
