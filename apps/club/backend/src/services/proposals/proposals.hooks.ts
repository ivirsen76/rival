// @ts-nocheck
import type { HookContext } from '@feathersjs/feathers';
import { NotFound, Unprocessable } from '@feathersjs/errors';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import commonValidate from './commonValidate';
import _isEmpty from 'lodash/isEmpty';
import _uniq from 'lodash/uniq';
import dayjs from '../../utils/dayjs';
import { getAge } from '../../utils/helpers';
import { keep, disallow } from 'feathers-hooks-common';
import { purgeTournamentCache, purgeMatchCache, logEvent, generateBadges } from '../commonHooks';
import acceptedProposalTemplate from '../../emailTemplates/acceptedProposal';
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
import type { User } from '../../types';

const validateCreate = () => (context: HookContext) => {
    const errors = commonValidate(context.data);

    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    return context;
};

const completePlayedAt = () => (context: HookContext) => {
    context.data.playedAt += '+00:00';
    return context;
};

const populateChallengerId = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const { players } = context.app.get('sequelizeClient').models;
    const userId = context.params.user!.id;

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

const populateAcceptorData = () => async (context: HookContext) => {
    const matchId = Number(context.id);
    const userId = context.params.user!.id;

    const sequelize = context.app.get('sequelizeClient');
    const { players, matches } = context.app.get('sequelizeClient').models;
    const currentUser = context.params.user as User;

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

    const matchInfo = await getMatchInfo({ app: context.app, currentUser, matchId });
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

const sendAcceptedProposalEmail = () => async (context: HookContext) => {
    const { app } = context;
    const matchId = Number(context.id);
    const { matches } = context.app.get('sequelizeClient').models;
    const currentUser = context.params.user as User;

    const match = await matches.findByPk(matchId);
    const {
        levelName,
        levelType,
        acceptors,
        acceptorName,
        acceptorLinkedName,
        emailsWithoutCurrentUser,
        formattedPlayedAt,
    } = await getMatchInfo({ app: context.app, currentUser, matchId });
    const firstAcceptor = acceptors[0];

    const entity = match.practiceType ? 'practice' : 'match';
    // We don't have to wait for the email sent
    app.service('api/emails').create({
        replyTo: getEmailContact(firstAcceptor),
        to: emailsWithoutCurrentUser,
        subject: `${acceptorName} accepted the ${entity} proposal for ${formattedPlayedAt}`,
        html: acceptedProposalTemplate({
            config: context.params.config,
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

const createProposal = () => async (context: HookContext) => {
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

const acceptProposal = () => async (context: HookContext) => {
    await populateAcceptorData()(context);

    const matchId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { matches } = sequelize.models;
    const currentUser = context.params.user as User;

    await matches.update(context.data, { where: { id: matchId } });

    const matchInfo = await getMatchInfo({ app: context.app, currentUser, matchId });
    for (const id of matchInfo.sameMatchIds) {
        await matches.update({ isActive: 0 }, { where: { id } });
    }

    await purgeMatchCache({ matchId })(context);
    await sendAcceptedProposalEmail()(context);
    await generateBadges()(context);

    return context;
};

const removeProposal = () => async (context: HookContext) => {
    const { app } = context;
    const sequelize = context.app.get('sequelizeClient');
    const matchId = Number(context.id);
    const { matches } = sequelize.models;
    const { config } = context.params;
    const currentUser = context.params.user as User;

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

    const matchInfo = await getMatchInfo({ app: context.app, currentUser, matchId });
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

const getVisibleStats = () => async (context: HookContext) => {
    const sequelize = context.app.get('sequelizeClient');
    const currentUser = context.params.user as User;
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
        { replacements: { tournamentIds: tournaments.map((item) => item.id), userId: currentUser.id } }
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

const sendNewProposalEmail = () => async (context: HookContext) => {
    if (process.env.TL_ENV !== 'production') {
        await sendProposalEmails(context.app, true);
    }
};

const runCustomAction = () => async (context: HookContext) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'acceptProposal') {
        await acceptProposal()(context);
    } else if (action === 'removeProposal') {
        await removeProposal()(context);
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
