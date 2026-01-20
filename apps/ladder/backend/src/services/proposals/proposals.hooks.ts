import { NotFound, Unprocessable } from '@feathersjs/errors';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import commonValidate from './commonValidate';
import _isEmpty from 'lodash/isEmpty';
import _pick from 'lodash/pick';
import _uniq from 'lodash/uniq';
import _intersection from 'lodash/intersection';
import dayjs from '../../utils/dayjs';
import { getAge } from '../../utils/helpers';
import { keep, disallow } from 'feathers-hooks-common';
import { purgeTournamentCache, purgeMatchCache, logEvent, generateBadges } from '../commonHooks';
import newProposalTemplate from '../../emailTemplates/newProposal';
import acceptedProposalTemplate from '../../emailTemplates/acceptedProposal';
import acceptedDoublesProposalTemplate from '../../emailTemplates/acceptedDoublesProposal';
import unacceptedDoublesProposalTemplate from '../../emailTemplates/unacceptedDoublesProposal';
import deletedDoublesProposalTemplate from '../../emailTemplates/deletedDoublesProposal';
import getCustomEmail from '../../emailTemplates/getCustomEmail';
import { getSchemaErrors, throwValidationErrors } from '../../helpers';
import getMatchInfo from '../matches/getMatchInfo';
import yup from '../../packages/yup';
import {
    getPlayerName,
    getEstablishedEloAllUsers,
    getEmailLink,
    getPhoneLink,
    getEmailContact,
} from '../users/helpers';
import sendProposalEmails from '../../utils/sendProposalEmails';

// It is not a hook, just a helper
const sendAcceptedDoublesProposalEmail = ({ context, players, match }) => {
    const challenger = players[match.challengerId || context.data.challengerId];
    const challenger2 = players[match.challenger2Id || context.data.challenger2Id];
    const acceptor = players[match.acceptorId || context.data.acceptorId];
    const acceptor2 = players[match.acceptor2Id || context.data.acceptor2Id];

    const playedAt = dayjs.tz(match.playedAt).format('ddd, MMM D, h:mm A');
    const getName = player => `${player.firstName} ${player.lastName.slice(0, 1)}.`;

    // We don't have to wait for the email sent
    context.app.service('api/emails').create({
        to: [challenger, challenger2, acceptor, acceptor2].map(item => ({
            name: getPlayerName(item),
            email: item.email,
        })),
        subject: `Your upcoming match on ${playedAt}`,
        html: acceptedDoublesProposalTemplate(context.params.config, {
            challenger,
            challenger2,
            acceptor,
            acceptor2,
            level: challenger.levelName,
            proposalDate: playedAt,
            proposalLocation: match.place,
            previewText: `${context.params.config.city}, ${challenger.levelName}, ${match.place}, ${getName(
                challenger
            )}/${getName(challenger2)} vs ${getName(acceptor)}/${getName(acceptor2)}`,
        }),
    });
};

const validateCreate = options => context => {
    const errors = commonValidate(context.data);

    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    return context;
};

const completePlayedAt = options => context => {
    context.data.playedAt += '+00:00';
    return context;
};

const populateChallengerId = options => async context => {
    const sequelize = context.app.get('sequelizeClient');
    const { players } = context.app.get('sequelizeClient').models;
    const userId = context.params.user.id;

    const firstTournamentId = context.data.tournaments[0];
    const [[{ startDate, endDate, levelType }]] = await sequelize.query(
        `SELECT s.startDate, s.endDate, l.type AS levelType
           FROM tournaments AS t,
                seasons AS s,
                levels AS l
          WHERE t.seasonId=s.id AND
                t.levelId=l.id AND
                t.id=:id`,
        { replacements: { id: firstTournamentId } }
    );

    const currentTz = dayjs.tz();
    const playedAtTz = dayjs.tz(context.data.playedAt);
    const isAfter = currentTz.isAfter(dayjs.tz(endDate));
    if (isAfter) {
        // It's a friendly match in a break
        const [nextSeasons] = await sequelize.query(
            `SELECT startDate FROM seasons WHERE startDate>"${endDate}" ORDER BY startDate LIMIT 0, 1`
        );

        if (nextSeasons.length === 1 && playedAtTz.isAfter(dayjs.tz(nextSeasons[0].startDate))) {
            throw new Unprocessable('Friendly match is out of break.');
        }
    } else if (
        // If tournament is not open
        playedAtTz.isBefore(dayjs.tz(startDate)) ||
        playedAtTz.isAfter(dayjs.tz(endDate))
    ) {
        throw new Unprocessable('The season has already ended.');
    }

    if (levelType === 'doubles-team') {
        if (context.data.challengers.length !== 2) {
            throw new Unprocessable('Wrong teammates number.');
        }
        const currentPlayer = await players.findOne({ where: { userId, tournamentId: firstTournamentId } });
        const captainId = currentPlayer.partnerId || currentPlayer.id;
        for (const challengerId of context.data.challengers) {
            const challenger = await players.findByPk(challengerId);
            if (!challenger || !challenger.isActive) {
                throw new Unprocessable('Wrong teammate.');
            }
            if (challenger.partnerId !== captainId && challenger.id !== captainId) {
                throw new Unprocessable('You are not in this team.');
            }
        }
        if (context.data.challengers[0] === context.data.challengers[1]) {
            throw new Unprocessable('Teammates should be different.');
        }

        context.params.challengerIds = [context.data.challengers];
    } else {
        const challengerIds = [];
        for (const tournamentId of context.data.tournaments) {
            const foundPlayer = await players.findOne({ where: { userId, tournamentId } });
            if (!foundPlayer) {
                throw new Unprocessable("You're not in this tournament.");
            }
            if (!foundPlayer.isActive) {
                throw new Unprocessable('The player is no longer available for matches.');
            }
            challengerIds.push(foundPlayer.id);
        }
        context.params.challengerIds = challengerIds;

        // Check for overlapped proposals
        {
            const twoHoursEarlier = playedAtTz.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss');
            const twoHoursLater = playedAtTz.add(2, 'hour').format('YYYY-MM-DD HH:mm:ss');
            const [[overlappedProposal]] = await sequelize.query(
                `SELECT *
                FROM matches
                WHERE initial=1 AND
                        challengerId IN (${challengerIds.join(',')}) AND
                        acceptorId IS NULL AND
                        playedAt>:twoHoursEarlier AND
                        playedAt<:twoHoursLater AND
                        playedAt>:currentDate`,
                {
                    replacements: {
                        twoHoursEarlier,
                        twoHoursLater,
                        currentDate: currentTz.format('YYYY-MM-DD HH:mm:ss'),
                    },
                }
            );

            if (overlappedProposal) {
                const time = dayjs.tz(overlappedProposal.playedAt).format('h:mm A');
                throw new Unprocessable('Invalid request', {
                    errors: {
                        playedAt: `You already have a proposal for ${time}. Match proposals must be at least 2 hours apart. If you are flexible on time, please mention it in the proposal comment field.`,
                    },
                });
            }
        }
    }

    return context;
};

const populateAcceptorData = options => async context => {
    const matchId = Number(context.id);
    const userId = context.params.user.id;

    const sequelize = context.app.get('sequelizeClient');
    const { players, matches } = context.app.get('sequelizeClient').models;

    // Validate
    {
        const schema = yup.object().shape({
            acceptors: yup.array(yup.number().integer()).min(2).max(2),
        });
        const errors = getSchemaErrors(schema, context.data);
        if (errors.acceptors) {
            errors.acceptors = 'Pick a teammate';
        }

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const match = await matches.findByPk(matchId);
    if (!match) {
        throw new Unprocessable('The proposal does not exist.');
    }

    if (match.acceptorId) {
        const [[acceptor]] = await sequelize.query(
            `SELECT u.firstName, u.lastName
               FROM users AS u, players AS p
              WHERE u.id=p.userId AND p.id=:id`,
            { replacements: { id: match.acceptorId } }
        );

        // TODO: make it work for doubles
        throw new Unprocessable(`The proposal is already accepted by ${getPlayerName(acceptor)}.`);
    }

    const currentTz = dayjs.tz();
    const playedAtTz = dayjs.tz(match.playedAt);
    if (currentTz.isAfter(playedAtTz)) {
        throw new Unprocessable('The proposal is expired.');
    }

    const matchInfo = await getMatchInfo({ app: context.app, currentUser: context.params.user, matchId });
    if (!matchInfo.canAcceptProposal) {
        throw new Unprocessable('You cannot accept this proposal.');
    }

    const isAfter = currentTz.isAfter(dayjs.tz(matchInfo.seasonStartDate));
    if (isAfter) {
        // It's a friendly match in a break
        const [nextSeasons] = await sequelize.query(
            `SELECT startDate FROM seasons WHERE startDate>"${matchInfo.seasonEndDate}" ORDER BY startDate LIMIT 0, 1`
        );

        if (nextSeasons.length === 1 && playedAtTz.isAfter(dayjs.tz(nextSeasons[0].startDate))) {
            throw new Unprocessable('Friendly match is out of break.');
        }
    } else if (
        // If tournament is not open
        playedAtTz.isBefore(dayjs.tz(matchInfo.seasonStartDate)) ||
        playedAtTz.isAfter(dayjs.tz(matchInfo.seasonEndDate))
    ) {
        throw new Unprocessable('The season has already ended.');
    }

    if (matchInfo.levelType === 'doubles-team') {
        if (context.data.acceptors.length !== 2) {
            throw new Unprocessable('Wrong teammates number.');
        }

        const currentPlayer = await players.findOne({ where: { userId, tournamentId: matchInfo.tournamentId } });
        const captainId = currentPlayer.partnerId || currentPlayer.id;
        for (const acceptorId of context.data.acceptors) {
            const acceptor = await players.findByPk(acceptorId);
            if (!acceptor?.isActive) {
                throw new Unprocessable('Wrong teammate.');
            }
            if (acceptor.partnerId !== captainId && acceptor.id !== captainId) {
                throw new Unprocessable('You are not in this team.');
            }
        }
        if (context.data.acceptors[0] === context.data.acceptors[1]) {
            throw new Unprocessable('Teammates should be different.');
        }

        context.data = {
            acceptorId: context.data.acceptors[0],
            acceptor2Id: context.data.acceptors[1],
        };
    } else {
        const acceptor = await players.findOne({ where: { userId, tournamentId: matchInfo.tournamentId } });
        if (!acceptor) {
            throw new Unprocessable('The proposal is not for you.');
        }

        context.data = {
            acceptorId: acceptor.id,
        };
    }

    for (const otherMatchId of matchInfo.sameMatchIds) {
        const otherMatch = await matches.findByPk(otherMatchId);
        if (otherMatch.acceptedAt) {
            throw new Unprocessable(`The proposal is already accepted.`);
        }
    }

    context.data.acceptedAt = dayjs.tz().format('YYYY-MM-DD HH:mm:ss+00:00');

    return context;
};

const sendAcceptedProposalEmail = options => async context => {
    const { app } = context;
    const matchId = Number(context.id);
    const { matches } = context.app.get('sequelizeClient').models;

    const match = await matches.findByPk(matchId);
    const {
        levelName,
        levelType,
        acceptors,
        acceptorName,
        acceptorLinkedName,
        emailsWithoutCurrentUser,
        formattedPlayedAt,
    } = await getMatchInfo({ app: context.app, currentUser: context.params.user, matchId });
    const firstAcceptor = acceptors[0];

    const entity = match.practiceType ? 'practice' : 'match';
    // We don't have to wait for the email sent
    app.service('api/emails').create({
        replyTo: getEmailContact(firstAcceptor),
        to: emailsWithoutCurrentUser,
        subject: `${acceptorName} accepted the ${entity} proposal for ${formattedPlayedAt}`,
        html: acceptedProposalTemplate(context.params.config, {
            acceptorName: acceptorLinkedName,
            contact: firstAcceptor,
            levelName,
            levelType,
            proposal: match,
            previewText: [context.params.config.city, levelName, match.place, match.comment].filter(Boolean).join(', '),
        }),
    });

    return context;
};

const createProposal = options => async context => {
    const { data } = context;
    const { challengerIds } = context.params;
    const { matches } = context.app.get('sequelizeClient').models;

    const matchIds = [];
    for (const challengerId of challengerIds) {
        const result = await matches.create({
            ...data,
            ...(Array.isArray(challengerId)
                ? { challengerId: challengerId[0], challenger2Id: challengerId[1] }
                : { challengerId }),
            initial: 1,
        });
        matchIds.push(result.dataValues.id);
    }

    if (matchIds.length > 1) {
        for (const matchId of matchIds) {
            await matches.update({ same: matchIds.join(',') }, { where: { id: matchId } });
        }
    }

    for (const tournamentId of data.tournaments) {
        await purgeTournamentCache({ tournamentId })(context);
    }

    context.params.matchIds = matchIds;

    return context;
};

const acceptProposal = options => async context => {
    await populateAcceptorData()(context);

    const matchId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { matches } = sequelize.models;

    await matches.update(context.data, { where: { id: matchId } });

    const matchInfo = await getMatchInfo({ app: context.app, currentUser: context.params.user, matchId });
    for (const id of matchInfo.sameMatchIds) {
        await matches.update({ isActive: 0 }, { where: { id } });
    }

    await purgeMatchCache({ matchId })(context);
    await sendAcceptedProposalEmail()(context);
    await generateBadges()(context);

    return context;
};

const addDoublesProposal = options => async context => {
    const { TL_URL } = process.env;
    const currentUser = context.params.user;
    const sequelize = context.app.get('sequelizeClient');
    const { matches } = sequelize.models;

    const errors = commonValidate(context.data);
    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    // additional validation
    {
        const schema = yup.object().shape({
            challengerId: yup.number().nullable().min(0),
            challenger2Id: yup.number().nullable().min(0),
            acceptorId: yup.number().nullable().min(0),
            acceptor2Id: yup.number().nullable().min(0),
        });
        const errors1 = getSchemaErrors(schema, context.data);
        if (!_isEmpty(errors1)) {
            throwValidationErrors(errors1);
        }
    }

    await completePlayedAt()(context);

    const tournamentId = context.data.tournaments[0];
    const [seasons] = await sequelize.query(
        `SELECT s.startDate, s.endDate, l.type AS levelType
           FROM tournaments AS t, seasons AS s, levels AS l
          WHERE t.seasonId=s.id AND t.levelId=l.id AND t.id=:id`,
        { replacements: { id: tournamentId } }
    );
    const { startDate, endDate, levelType } = seasons[0];

    if (levelType !== 'doubles') {
        throw new Unprocessable('It should be a doubles level.');
    }

    const currentTz = dayjs.tz();
    const playedAtTz = dayjs.tz(context.data.playedAt);
    const isAfter = currentTz.isAfter(dayjs.tz(endDate));
    if (isAfter) {
        // It's a friendly match in a break
        const [nextSeasons] = await sequelize.query(
            `SELECT startDate FROM seasons WHERE startDate>"${endDate}" ORDER BY startDate LIMIT 0, 1`
        );

        if (nextSeasons.length === 1 && playedAtTz.isAfter(dayjs.tz(nextSeasons[0].startDate))) {
            throw new Unprocessable('Friendly match is out of break.');
        }
    } else if (
        // If tournament is not open
        playedAtTz.isBefore(dayjs.tz(startDate)) ||
        playedAtTz.isAfter(dayjs.tz(endDate))
    ) {
        throw new Unprocessable('The date is out of season.');
    }

    const allPlayersIds = [
        context.data.challengerId,
        context.data.challenger2Id,
        context.data.acceptorId,
        context.data.acceptor2Id,
    ].filter(Boolean);

    if (allPlayersIds.length !== _uniq(allPlayersIds).length) {
        throw new Unprocessable('Player should not be duplicated.');
    }

    // get all players for the tournament
    let [players] = await sequelize.query(
        `SELECT p.id, p.isActive, p.userId, u.firstName, u.lastName, u.email, l.name AS levelName
           FROM players AS p,
                users AS u,
                tournaments AS t,
                levels AS l
          WHERE p.userId=u.id AND
                p.tournamentId=t.id AND
                t.levelId=l.id AND
                p.tournamentId=:tournamentId`,
        { replacements: { tournamentId } }
    );
    players = players.reduce((obj, item) => {
        obj[item.id] = item;
        return obj;
    }, {});

    allPlayersIds.forEach(playerId => {
        if (!players[playerId]) {
            throw new Unprocessable('Player is not in the tournament.');
        }
        if (!players[playerId].isActive) {
            throw new Unprocessable('Player is not active.');
        }
    });

    if (!players[context.data.challengerId]) {
        throw new Unprocessable('There is no challenger.');
    }
    if (players[context.data.challengerId].userId !== currentUser.id) {
        throw new Unprocessable('You are supposed to be a challenger.');
    }

    const data = _pick(context.data, ['place', 'comment', 'challengerId', 'playedAt']);

    const result = await matches.create({
        ...data,
        ...(context.data.challenger2Id && { challenger2Id: context.data.challenger2Id }),
        ...(context.data.acceptorId && { acceptorId: context.data.acceptorId }),
        ...(context.data.acceptor2Id && { acceptor2Id: context.data.acceptor2Id }),
        ...(allPlayersIds.length === 4 && { acceptedAt: dayjs.tz().format('YYYY-MM-DD HH:mm:ss+00:00') }),
        initial: 1,
    });
    const matchId = result.dataValues.id;
    const match = await matches.findByPk(matchId);

    await purgeMatchCache({ matchId })(context);

    if (allPlayersIds.length === 4) {
        sendAcceptedDoublesProposalEmail({ context, players, match });
    } else {
        // Send an email about proposal
        const [rows] = await sequelize.query(
            `SELECT u.firstName,
                    u.lastName,
                    u.email,
                    l.name AS levelName,
                    l.slug AS levelSlug,
                    p.tournamentId,
                    s.year AS seasonYear,
                    s.season AS season,
                    s.endDate AS seasonEndDate,
                    m.playedAt
               FROM levels AS l, seasons AS s, tournaments AS t, players AS p, matches AS m, users AS u
              WHERE m.challengerId=p.id
                AND p.userId=u.id
                AND p.tournamentId=t.id
                AND t.levelId=l.id
                AND t.seasonId=s.id
                AND m.id=:matchId`,
            { replacements: { matchId } }
        );
        const info = rows[0];

        const [users] = await sequelize.query(
            `SELECT u.id, u.firstName, u.lastName, u.email, u.subscribeForProposals, p.id AS playerId
               FROM users AS u, players AS p
              WHERE p.userId=u.id
                AND p.tournamentId=:tournamentId
                AND p.isActive=1`,
            { replacements: { tournamentId: info.tournamentId } }
        );

        const playedAt = dayjs.tz(info.playedAt).format('ddd, MMM D, h:mm A');
        const proposalPlayer = getPlayerName(info);
        const emails = users
            .filter(
                user =>
                    user.subscribeForProposals &&
                    ![
                        context.data.challengerId,
                        context.data.challenger2Id,
                        context.data.acceptorId,
                        context.data.acceptor2Id,
                    ].includes(user.playerId)
            )
            .map(getEmailContact);

        const teamDetails = (() => {
            const getName = playerId => {
                const player = users.find(user => user.playerId === playerId);
                return player ? `<b>${getPlayerName(player)}</b>` : '<span class="open">open</span>';
            };

            return `<mj-text>
                Team 1:&nbsp;&nbsp;${getName(context.data.challengerId)} / ${getName(context.data.challenger2Id)}<br>
                Team 2:&nbsp;&nbsp;${getName(context.data.acceptorId)} / ${getName(context.data.acceptor2Id)}
            </mj-text>`;
        })();

        // We don't have to wait for the email sent
        const isFriendlyProposal = info.seasonEndDate < dayjs.tz().format('YYYY-MM-DD HH:mm:ss');
        context.app.service('api/emails').create({
            replyTo: getEmailContact(info),
            to: emails,
            subject: `${proposalPlayer} proposed a new ${isFriendlyProposal ? 'friendly ' : ''}match for ${playedAt}`,
            html: newProposalTemplate(context.params.config, {
                level: info.levelName,
                proposal: context.data,
                proposalPlayer,
                proposalLink: `${TL_URL}/season/${info.seasonYear}/${info.season}/${info.levelSlug}`,
                isFriendlyProposal,
                teamDetails,
                previewText: `${context.params.config.city}, ${info.levelName}, ${context.data.place}`,
            }),
        });
    }

    return context;
};

const acceptDoublesProposal = options => async context => {
    const currentUser = context.params.user;
    const matchId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { matches } = sequelize.models;
    const match = await matches.findByPk(matchId);

    // Validation
    {
        const schema = yup.object().shape({
            challenger2Id: yup.number().nullable().min(0),
            acceptorId: yup.number().nullable().min(0),
            acceptor2Id: yup.number().nullable().min(0),
        });
        const errors1 = getSchemaErrors(schema, context.data);
        if (!_isEmpty(errors1)) {
            throwValidationErrors(errors1);
        }
    }

    if (dayjs.tz().isAfter(dayjs.tz(match.playedAt))) {
        throw new Unprocessable('The proposal is expired.');
    }

    const [seasons] = await sequelize.query(
        `SELECT s.startDate,
                s.endDate,
                l.type AS levelType,
                p.tournamentId
           FROM players AS p,
                tournaments AS t,
                seasons AS s,
                levels AS l
          WHERE p.id=:id AND
                p.tournamentId=t.id AND
                t.seasonId=s.id AND
                t.levelId=l.id`,
        { replacements: { id: match.challengerId } }
    );
    const { startDate, endDate, tournamentId, levelType } = seasons[0];

    if (levelType !== 'doubles') {
        throw new Unprocessable('It should be a doubles level.');
    }

    const currentTz = dayjs.tz();
    const playedAtTz = dayjs.tz(context.data.playedAt);
    const isAfter = currentTz.isAfter(dayjs.tz(endDate));
    if (isAfter) {
        // It's a friendly match in a break
        const [nextSeasons] = await sequelize.query(
            `SELECT startDate FROM seasons WHERE startDate>"${endDate}" ORDER BY startDate LIMIT 0, 1`
        );

        if (nextSeasons.length === 1 && playedAtTz.isAfter(dayjs.tz(nextSeasons[0].startDate))) {
            throw new Unprocessable('Friendly match is out of break.');
        }
    } else if (
        // If tournament is not open
        playedAtTz.isBefore(dayjs.tz(startDate)) ||
        playedAtTz.isAfter(dayjs.tz(endDate))
    ) {
        throw new Unprocessable('The season has already ended.');
    }

    if (
        ['challengerId', 'challenger2Id', 'acceptorId', 'acceptor2Id'].some(
            field => match[field] && context.data[field]
        )
    ) {
        throw new Unprocessable('Open slots are already taken.');
    }

    const existingIds = ['challengerId', 'challenger2Id', 'acceptorId', 'acceptor2Id']
        .map(field => match[field])
        .filter(Boolean);
    const newIds = ['challenger2Id', 'acceptorId', 'acceptor2Id']
        .filter(field => !match[field] && context.data[field])
        .map(field => context.data[field]);

    if (newIds.length === 0) {
        throw new Unprocessable('You have to include at least one new player.');
    }
    if (newIds.length !== _uniq(newIds).length) {
        throw new Unprocessable('You cannot include duplicated players.');
    }
    if (_intersection(newIds, existingIds).length > 0) {
        throw new Unprocessable('You cannot duplicate players.');
    }

    // get all players for the tournament
    let [players] = await sequelize.query(
        `SELECT p.id, p.isActive, p.userId, u.firstName, u.lastName, u.email, l.name AS levelName
           FROM players AS p,
                users AS u,
                tournaments AS t,
                levels AS l
          WHERE p.userId=u.id AND
                p.tournamentId=t.id AND
                t.levelId=l.id AND
                p.tournamentId=:tournamentId`,
        { replacements: { tournamentId } }
    );
    players = players.reduce((obj, item) => {
        obj[item.id] = item;
        return obj;
    }, {});

    if (newIds.some(playerId => !players[playerId])) {
        throw new Unprocessable('Some new players are from another tournament.');
    }
    if (newIds.some(playerId => !players[playerId].isActive)) {
        throw new Unprocessable('Some new players are not active.');
    }
    if (!newIds.some(playerId => players[playerId].userId === currentUser.id)) {
        throw new Unprocessable('You have to be one of the acceptors.');
    }

    const allAccepted =
        (match.challenger2Id || context.data.challenger2Id) &&
        (match.acceptorId || context.data.acceptorId) &&
        (match.acceptor2Id || context.data.acceptor2Id);

    await matches.update(
        {
            ...(!match.challenger2Id && context.data.challenger2Id && { challenger2Id: context.data.challenger2Id }),
            ...(!match.acceptorId && context.data.acceptorId && { acceptorId: context.data.acceptorId }),
            ...(!match.acceptor2Id && context.data.acceptor2Id && { acceptor2Id: context.data.acceptor2Id }),
            ...(allAccepted && { acceptedAt: dayjs.tz().format('YYYY-MM-DD HH:mm:ss+00:00') }),
        },
        { where: { id: matchId } }
    );

    await purgeMatchCache({ matchId })(context);

    // Send an email
    if (allAccepted) {
        sendAcceptedDoublesProposalEmail({ context, players, match });
    }

    return context;
};

const removeProposal = options => async context => {
    const { app } = context;
    const sequelize = context.app.get('sequelizeClient');
    const matchId = Number(context.id);
    const { matches } = sequelize.models;
    const { config } = context.params;

    // Validate
    {
        const schema = yup.object().shape({
            reason: yup.string().max(200),
        });
        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    const matchInfo = await getMatchInfo({ app: context.app, currentUser: context.params.user, matchId });
    if (matchInfo.canManageChallengers && !matchInfo.canDeleteProposal) {
        throw new Unprocessable('You cannot delete this proposal.');
    }
    if (matchInfo.canManageAcceptors && !matchInfo.canUnacceptProposal) {
        throw new Unprocessable('You cannot unaccept this proposal.');
    }
    if (matchInfo.hasAcceptors && !context.data.reason) {
        throwValidationErrors({ reason: 'The reason is required.' });
    }

    if (matchInfo.canManageChallengers) {
        // purge cache
        await purgeMatchCache({ matchId })(context);

        // remove proposal and all related proposals
        for (const id of [matchId, ...matchInfo.sameMatchIds]) {
            await matches.destroy({ where: { id } });
        }

        const contact = matchInfo.challengers[0];

        // We don't have to wait for the email sent
        app.service('api/emails').create({
            replyTo: getEmailContact(contact),
            to: matchInfo.emailsWithoutCurrentUser,
            subject: `${matchInfo.challengerName} deleted the proposal for ${matchInfo.formattedPlayedAt}`,
            html: getCustomEmail({
                config,
                compose: () => `
<mj-text><b>${matchInfo.challengerLinkedName}</b> deleted the proposal for a match in ${matchInfo.levelName}.</mj-text>
${context.data.reason ? `<mj-text><b>Reason:</b> ${context.data.reason}.</mj-text>` : ''}
<mj-text padding-bottom="0px">You can contact ${getPlayerName(contact, true)} for more information:</mj-text>
<mj-text>
    <b>Email:</b> ${getEmailLink(contact)}<br>
    <b>Phone:</b> ${getPhoneLink(contact)}
</mj-text>`,
            }),
        });

        logEvent(`Proposal with id=${matchId} was deleted`)(context);
    } else if (matchInfo.canManageAcceptors) {
        await matches.update({ acceptorId: null, acceptor2Id: null, acceptedAt: null }, { where: { id: matchId } });

        for (const id of matchInfo.sameMatchIds) {
            await matches.update({ isActive: 1 }, { where: { id } });
        }

        // purge cache
        await purgeMatchCache({ matchId })(context);

        const contact = matchInfo.acceptors[0];

        // We don't have to wait for the email sent
        app.service('api/emails').create({
            replyTo: getEmailContact(contact),
            to: matchInfo.emailsWithoutCurrentUser,
            subject: `${matchInfo.acceptorName} unaccepted the proposal for ${matchInfo.formattedPlayedAt}`,
            html: getCustomEmail({
                config,
                compose: () => `
<mj-text><b>${matchInfo.acceptorLinkedName}</b> unaccepted the proposal for a match in ${matchInfo.levelName}.</mj-text>
<mj-text><b>Reason:</b> ${context.data.reason}.</mj-text>
<mj-text padding-bottom="0px">You can contact ${getPlayerName(contact, true)} for more information:</mj-text>
<mj-text>
    <b>Email:</b> ${getEmailLink(contact)}<br>
    <b>Phone:</b> ${getPhoneLink(contact)}
</mj-text>
`,
            }),
        });

        logEvent(`Proposal with id=${matchId} was unaccepted`)(context);
    } else {
        throw new Unprocessable('You are not part of this proposal.');
    }

    return context;
};

const removeDoublesProposal = options => async context => {
    const sequelize = context.app.get('sequelizeClient');
    const matchId = Number(context.id);
    const currentUser = context.params.user;
    const userId = currentUser.id;

    const { players, matches } = sequelize.models;
    const match = await matches.findByPk(matchId);

    // Validate
    {
        const schema = yup.object().shape({
            reason: yup.string().max(200),
        });
        const errors = getSchemaErrors(schema, context.data);

        if (!_isEmpty(errors)) {
            throwValidationErrors(errors);
        }
    }

    if (!match) {
        throw new Unprocessable('The proposal does not exist.');
    }
    if (!match.isActive) {
        throw new Unprocessable('The proposal does not exist.');
    }
    if (match.score) {
        throw new Unprocessable('You cannot remove a match with score.');
    }

    const [seasons] = await sequelize.query(
        `SELECT l.type AS levelType,
                p.tournamentId
           FROM players AS p,
                tournaments AS t,
                levels AS l
          WHERE p.id=:id AND
                p.tournamentId=t.id AND
                t.levelId=l.id`,
        { replacements: { id: match.challengerId } }
    );
    const { tournamentId, levelType } = seasons[0];

    if (levelType !== 'doubles') {
        throw new Unprocessable('It should be a doubles level.');
    }

    const challenger = match.challengerId ? await players.findByPk(match.challengerId) : null;
    const challenger2 = match.challenger2Id ? await players.findByPk(match.challenger2Id) : null;
    const acceptor = match.acceptorId ? await players.findByPk(match.acceptorId) : null;
    const acceptor2 = match.acceptor2Id ? await players.findByPk(match.acceptor2Id) : null;

    const allUserIds = [challenger, challenger2, acceptor, acceptor2].filter(Boolean).map(player => player.userId);

    if (!allUserIds.includes(userId)) {
        throw new Unprocessable('You cannot delete this proposal.');
    }
    if (allUserIds.length > 1 && !context.data.reason) {
        throwValidationErrors({ reason: 'The reason is required.' });
    }

    // Get all users for the tournament
    const [result] = await sequelize.query(
        `SELECT p.id, u.firstName, u.lastName, u.email, u.phone, l.name AS levelName
           FROM players AS p,
                users AS u,
                tournaments AS t,
                levels AS l
          WHERE p.userId=u.id AND
                p.tournamentId=t.id AND
                t.levelId=l.id AND
                p.tournamentId=:tournamentId`,
        { replacements: { tournamentId } }
    );
    const users = result.reduce((obj, item) => {
        obj[item.id] = item;
        return obj;
    }, {});

    if (challenger.userId === userId) {
        // Send notification
        if (allUserIds.length > 1) {
            const challengerName = getPlayerName(currentUser);
            const playedAt = dayjs.tz(match.playedAt).format('ddd, MMM D, h:mm A');

            // We don't have to wait for the email sent
            context.app.service('api/emails').create({
                to: [match.challenger2Id, match.acceptorId, match.acceptor2Id].filter(Boolean).map(playerId => {
                    return getEmailContact(users[playerId]);
                }),
                subject: `${challengerName} deleted the proposal for ${playedAt}`,
                html: deletedDoublesProposalTemplate(context.params.config, {
                    challengerName,
                    challengerEmail: users[match.challengerId].email,
                    challengerPhone: users[match.challengerId].phone,
                    level: users[match.challengerId].levelName,
                    reason: context.data.reason,
                    previewText: `${context.params.config.city}, ${users[match.challengerId].levelName}, Reason: ${
                        context.data.reason
                    }`,
                }),
            });
        }

        // purge cache
        await purgeMatchCache({ matchId })(context);
        await matches.destroy({ where: { id: matchId } });
    } else {
        let columnName;
        if (challenger2 && challenger2.userId === userId) {
            columnName = 'challenger2Id';
        } else if (acceptor && acceptor.userId === userId) {
            columnName = 'acceptorId';
        } else if (acceptor2 && acceptor2.userId === userId) {
            columnName = 'acceptor2Id';
        }
        await matches.update(
            {
                [columnName]: null,
                ...(allUserIds.length === 4 && { acceptedAt: null }),
            },
            { where: { id: matchId } }
        );

        // purge cache
        await purgeMatchCache({ matchId })(context);

        if (allUserIds.length === 4) {
            const refuserName = getPlayerName(currentUser);
            const playedAt = dayjs.tz(match.playedAt).format('ddd, MMM D, h:mm A');
            const refuser = users[match[columnName]];

            // We don't have to wait for the email sent
            context.app.service('api/emails').create({
                to: [match.challengerId, match.challenger2Id, match.acceptorId, match.acceptor2Id]
                    .filter(playerId => Boolean(playerId) && playerId !== match[columnName])
                    .map(playerId => {
                        const user = users[playerId];

                        return {
                            name: getPlayerName(user),
                            email: user.email,
                        };
                    }),
                subject: `${refuserName} unaccepted the proposal for ${playedAt}`,
                html: unacceptedDoublesProposalTemplate(context.params.config, {
                    refuserName,
                    refuserEmail: refuser.email,
                    refuserPhone: refuser.phone,
                    level: refuser.levelName,
                    reason: context.data.reason,
                    previewText: `${context.params.config.city}, ${refuser.levelName}, Reason: ${context.data.reason}`,
                }),
            });
        }
    }

    logEvent(`Proposal with id=${matchId} was deleted`)(context);

    return context;
};

const getVisibleStats = options => async context => {
    const sequelize = context.app.get('sequelizeClient');
    const currentUser = context.params.user;
    const { config } = context.params;

    const currentDate = dayjs.tz();
    const [[currentSeason]] = await sequelize.query(
        `SELECT * FROM seasons WHERE startDate<:date ORDER BY startDate DESC LIMIT 0, 1`,
        { replacements: { date: currentDate.format('YYYY-MM-DD HH:mm:ss') } }
    );
    if (!currentSeason) {
        throw new Unprocessable('The season is not started yet.');
    }

    const [tournaments] = await sequelize.query(
        `SELECT p.tournamentId AS id
           FROM players AS p,
                tournaments AS t,
                levels AS l
          WHERE p.tournamentId=t.id AND
                t.levelId=l.id AND
                l.type="single" AND
                t.seasonId=:seasonId AND
                p.userId=:userId AND
                p.isActive=1`,
        { replacements: { seasonId: currentSeason.id, userId: currentUser.id } }
    );

    context.result = {
        tournaments: {},
        competitivePlayers: [],
        ageCompatiblePlayers: [],
    };

    if (tournaments.length === 0) {
        return context;
    }

    const establishedEloAllUsers = await getEstablishedEloAllUsers({ config, sequelize });
    const currentUserElo = establishedEloAllUsers[currentUser.id];
    const currentUserAge = currentUser.birthday ? getAge(currentUser.birthday) : 9999;

    const [players] = await sequelize.query(
        `SELECT p.userId,
                u.birthday,
                p.tournamentId
           FROM players AS p,
                users AS u
          WHERE p.userId=u.id AND
                p.tournamentId IN (:tournamentIds) AND
                p.userId!=:userId AND
                p.isActive=1`,
        { replacements: { tournamentIds: tournaments.map(item => item.id), userId: currentUser.id } }
    );

    for (const player of players) {
        context.result.tournaments[player.tournamentId] ||= [];
        context.result.tournaments[player.tournamentId].push(player.userId);

        if (
            currentUserElo &&
            establishedEloAllUsers[player.userId] &&
            Math.abs(currentUserElo - establishedEloAllUsers[player.userId]) <= config.maxCompetitiveTlrGap
        ) {
            context.result.competitivePlayers.push(player.userId);
        }

        if (player.birthday && Math.abs(currentUserAge - getAge(player.birthday)) <= config.maxAgeCompatibleGap) {
            context.result.ageCompatiblePlayers.push(player.userId);
        }
    }

    context.result.competitivePlayers = _uniq(context.result.competitivePlayers);
    context.result.ageCompatiblePlayers = _uniq(context.result.ageCompatiblePlayers);

    return context;
};

const sendNewProposalEmail = options => async context => {
    if (process.env.TL_ENV !== 'production') {
        await sendProposalEmails(context.app, true);
    }
};

const runCustomAction = options => async context => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'acceptProposal') {
        await acceptProposal()(context);
    } else if (action === 'removeProposal') {
        await removeProposal()(context);
    } else if (action === 'addDoublesProposal') {
        await addDoublesProposal()(context);
    } else if (action === 'acceptDoublesProposal') {
        await acceptDoublesProposal()(context);
    } else if (action === 'removeDoublesProposal') {
        await removeDoublesProposal()(context);
    } else if (action === 'getVisibleStats') {
        await getVisibleStats()(context);
    } else {
        throw new NotFound();
    }

    if (!context.result) {
        context.result = { status: 'success' };
    }
};

export default {
    before: {
        all: [authenticate('jwt')],
        find: [disallow()],
        get: [disallow()],
        create: [
            validateCreate(),
            completePlayedAt(),
            populateChallengerId(),
            keep(
                'place',
                'comment',
                'challengerIds',
                'playedAt',
                'tournaments',
                'isCompetitive',
                'isAgeCompatible',
                'practiceType',
                'matchFormat',
                'duration'
            ),
        ],
        update: [runCustomAction()],
        patch: [disallow()],
        remove: [disallow()],
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [createProposal(), sendNewProposalEmail(), generateBadges()],
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
