import type { HookContext } from '@feathersjs/feathers';
import { authenticate } from '@feathersjs/authentication/lib/hooks';
import { throwValidationErrors } from '../../helpers';
import _isEmpty from 'lodash/isEmpty';
import _omit from 'lodash/omit';
import { NotFound, Unprocessable } from '@feathersjs/errors';
import dayjs from '../../utils/dayjs';
import validate from './validate';
import { disallow } from 'feathers-hooks-common';
import { purgeTournamentCache, logEvent } from '../commonHooks';
import compareFields from '../../utils/compareFields';

// These are just helpers
const getPoints = (score) => {
    const positions = [
        [0, 0, 0],
        [0, 1, 1],
        [1, 0, 1],
        [1, 1, 0],
    ];

    return positions.map((position) =>
        score.reduce((sum, pair, index) => {
            return sum + (pair[position[index]] || 0);
        }, 0)
    );
};

const isAdmin = (user) => {
    const roles = user.roles.split(',');

    return roles.includes('admin') || roles.includes('manager');
};

// This is not a hook, just a helper
const populateNextFinalMatch = async (context: HookContext, prevMatch) => {
    const finalMatchConnections = {
        3: {
            finalSpot: 1,
            players: ['player1', 'player2'],
        },
        2: {
            finalSpot: 1,
            players: ['player3', 'player4'],
        },
    };

    const nextConnection = finalMatchConnections[prevMatch.finalSpot];
    if (!nextConnection) {
        return;
    }

    const sequelize = context.app.get('sequelizeClient');
    const { doublesmatches } = context.app.get('sequelizeClient').models;

    const points = getPoints([
        prevMatch.score1.split('-').map(Number),
        prevMatch.score2.split('-').map(Number),
        prevMatch.score3.split('-').map(Number),
    ]);

    let allPlayers = {};
    {
        const [rows] = await sequelize.query(
            `SELECT s.year, s.season, l.slug
               FROM tournaments AS t,
                    seasons AS s,
                    levels AS l
              WHERE t.id=:tournamentId AND
                    t.seasonId=s.id AND
                    t.levelId=l.id`,
            { replacements: { tournamentId: context.params.tournamentId } }
        );

        const tournamentInfo = await context.app
            .service('api/tournaments')
            .get(1, { query: { year: rows[0].year, season: rows[0].season, level: rows[0].slug } });
        allPlayers = tournamentInfo.data.players;
    }

    const positions = [
        { id: prevMatch.player1Id, seed: prevMatch.player1Seed },
        { id: prevMatch.player2Id, seed: prevMatch.player2Seed },
        { id: prevMatch.player3Id, seed: prevMatch.player3Seed },
        { id: prevMatch.player4Id, seed: prevMatch.player4Seed },
    ]
        .map((player, index) => ({
            ...allPlayers[player.id],
            seed: player.seed,
            points: points[index],
            index,
        }))
        .sort(
            compareFields(
                'points-desc',
                'stats.rank',
                'stats.matches-desc',
                'stats.matchesWon-desc',
                'firstName',
                'lastName'
            )
        );
    const prevMatchPlayerIds = positions.map((player) => player.id);

    const [result] = await sequelize.query(
        `SELECT dm.*
           FROM doublesmatches AS dm, players AS p
          WHERE (dm.player1Id=p.id OR dm.player4Id=p.id) AND
                p.tournamentId=:tournamentId AND
                dm.finalSpot=:finalSpot`,
        { replacements: { tournamentId: context.params.tournamentId, finalSpot: nextConnection.finalSpot } }
    );

    const createNewMatch = async () => {
        await doublesmatches.create({
            ...nextConnection.players.reduce((obj, player) => {
                const nextPlayer = positions.shift();
                obj[`${player}Id`] = nextPlayer.id;
                obj[`${player}Seed`] = nextPlayer.seed;

                return obj;
            }, {}),
            finalSpot: nextConnection.finalSpot,
        });
    };

    if (result.length > 0) {
        const nextMatch = result[0];
        if (nextMatch.score1) {
            throw new Unprocessable('Next match is already played');
        }

        const hasOtherPlayers = ['player1', 'player2', 'player3', 'player4'].some(
            (player) => nextMatch[`${player}Id`] && !prevMatchPlayerIds.includes(nextMatch[`${player}Id`])
        );

        await sequelize.query(`DELETE FROM doublesmatches WHERE id=${nextMatch.id}`);
        if (hasOtherPlayers) {
            await doublesmatches.create({
                ..._omit(nextMatch, ['id']),
                ...['player1', 'player2', 'player3', 'player4'].reduce((obj, player) => {
                    if (nextMatch[`${player}Id`] && !prevMatchPlayerIds.includes(nextMatch[`${player}Id`])) {
                        return obj;
                    }
                    const nextPlayer = positions.shift();
                    obj[`${player}Id`] = nextPlayer.id;
                    obj[`${player}Seed`] = nextPlayer.seed;

                    return obj;
                }, {}),
            });
        } else {
            await createNewMatch();
        }
    } else {
        await createNewMatch();
    }
};

const setScore = () => async (context: HookContext) => {
    await authenticate('jwt')(context);

    const errors = validate(context.data);

    if (!_isEmpty(errors)) {
        throwValidationErrors(errors);
    }

    const currentUser = context.params.user as User;
    const matchId = Number(context.id);
    const sequelize = context.app.get('sequelizeClient');
    const { doublesmatches } = context.app.get('sequelizeClient').models;

    let match = await doublesmatches.findByPk(matchId);
    if (!match) {
        throw new Unprocessable('The match does not exist.');
    }

    const playerIds = [match.player1Id, match.player2Id, match.player3Id, match.player4Id];

    // check if user is part of the match
    let userIds;
    let tournamentId;
    {
        const query = `
            SELECT userId,
                   tournamentId
              FROM players
             WHERE id IN (${playerIds.join(',')})`;
        const [rows] = await sequelize.query(query);
        userIds = rows.map((obj) => obj.userId);
        tournamentId = rows[0].tournamentId;
    }

    if (!isAdmin(context.params.user) && !userIds.includes(currentUser.id)) {
        throw new Unprocessable('You are not the part of the match.');
    }

    context.params.tournamentId = tournamentId;

    // check if we have the tournament and it's closed
    {
        const [rows] = await sequelize.query(
            `
            SELECT s.endDate
              FROM tournaments AS t,
                   seasons AS s
             WHERE t.seasonId=s.id AND
                   t.id=:tournamentId
        `,
            { replacements: { tournamentId } }
        );

        const diff = dayjs.tz().diff(dayjs.tz(rows[0].endDate), 'week', true);
        if (diff > 3) {
            throw new Unprocessable('It is too late to change the score.');
        }
    }

    const { score } = context.data;

    // get winner and runner-up
    let winner = 0;
    let runnerUp = 0;
    {
        let allPlayers = {};
        {
            const [rows] = await sequelize.query(
                `SELECT s.year, s.season, l.slug
                   FROM tournaments AS t,
                        seasons AS s,
                        levels AS l
                  WHERE t.id=:tournamentId AND
                        t.seasonId=s.id AND
                        t.levelId=l.id`,
                { replacements: { tournamentId } }
            );

            const tournamentInfo = await context.app
                .service('api/tournaments')
                .get(1, { query: { year: rows[0].year, season: rows[0].season, level: rows[0].slug } });
            allPlayers = tournamentInfo.data.players;
        }

        const points = getPoints(score);
        const sortedPlayers = playerIds
            .map((playerId, index) => ({
                ...allPlayers[playerId],
                points: points[index],
            }))
            .sort(
                compareFields(
                    'points-desc',
                    'stats.rank',
                    'stats.matches-desc',
                    'stats.matchesWon-desc',
                    'firstName',
                    'lastName'
                )
            );

        winner = sortedPlayers[0].id;
        runnerUp = sortedPlayers[1].id;
    }

    await sequelize.query(
        `
        UPDATE doublesmatches
           SET score1=:score1,
               score2=:score2,
               score3=:score3,
               winner=:winner,
               runnerUp=:runnerUp,
               playedAt=:playedAt
         WHERE id=:matchId`,
        {
            replacements: {
                matchId,
                score1: score[0].join('-'),
                score2: score[1].join('-'),
                score3: score[2].join('-'),
                winner,
                runnerUp,
                playedAt: match.playedAt || dayjs.tz().format('YYYY-MM-DD HH:mm:ss'),
            },
        }
    );

    // Updating match variable
    match = await doublesmatches.findByPk(matchId);
    await populateNextFinalMatch(context, match.dataValues);

    await purgeTournamentCache({ tournamentId })(context);

    logEvent(`Final doubles match score is reported for finalSpot=${match.finalSpot}`)(context);

    return context;
};

const runCustomAction = () => async (context: HookContext) => {
    const { action } = context.data;
    delete context.data.action;

    if (action === 'setScore') {
        await setScore()(context);
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
        create: [disallow()],
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
