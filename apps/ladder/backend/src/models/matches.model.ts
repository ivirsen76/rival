import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const matches = sequelizeClient.define(
        'matches',
        {
            // 1 - Proposal
            // 2 - Challenge
            // 3 - Match
            // 4 - Friendly proposal
            // 5 - Team match
            // 6 - Scheduled match
            initial: Sequelize.INTEGER,
            challengerId: Sequelize.INTEGER,
            acceptorId: Sequelize.INTEGER,
            winner: Sequelize.INTEGER,
            score: Sequelize.STRING,
            wonByDefault: Sequelize.BOOLEAN,
            wonByInjury: Sequelize.BOOLEAN,
            unavailable: Sequelize.BOOLEAN,
            challengerElo: Sequelize.INTEGER,
            acceptorElo: Sequelize.INTEGER,
            challengerEloChange: Sequelize.INTEGER,
            acceptorEloChange: Sequelize.INTEGER,
            challengerMatches: Sequelize.INTEGER,
            acceptorMatches: Sequelize.INTEGER,
            challengerRank: Sequelize.INTEGER,
            acceptorRank: Sequelize.INTEGER,
            challengerPoints: Sequelize.INTEGER,
            acceptorPoints: Sequelize.INTEGER,
            challengerSeed: Sequelize.INTEGER,
            acceptorSeed: Sequelize.INTEGER,
            place: Sequelize.STRING,
            comment: Sequelize.STRING,
            youtube: Sequelize.STRING,
            stat: Sequelize.STRING,
            note: Sequelize.STRING,
            type: Sequelize.STRING,
            same: Sequelize.STRING,
            isActive: Sequelize.BOOLEAN,
            finalSpot: Sequelize.INTEGER,
            acceptedAt: Sequelize.DATE,
            rejectedAt: Sequelize.DATE,
            playedAt: Sequelize.DATE,
            challenger2Id: Sequelize.INTEGER,
            challenger2Elo: Sequelize.INTEGER,
            challenger2EloChange: Sequelize.INTEGER,
            challenger2Matches: Sequelize.INTEGER,
            challenger2Rank: Sequelize.INTEGER,
            challenger2Points: Sequelize.INTEGER,
            acceptor2Id: Sequelize.INTEGER,
            acceptor2Elo: Sequelize.INTEGER,
            acceptor2EloChange: Sequelize.INTEGER,
            acceptor2Matches: Sequelize.INTEGER,
            acceptor2Rank: Sequelize.INTEGER,
            acceptor2Points: Sequelize.INTEGER,
            swingMatchId: Sequelize.STRING,
            battleId: Sequelize.INTEGER,
            isCompetitive: Sequelize.BOOLEAN,
            isAgeCompatible: Sequelize.BOOLEAN,
            sameAs: Sequelize.INTEGER,
            isProposalSent: Sequelize.BOOLEAN,
            practiceType: Sequelize.INTEGER,
            matchFormat: Sequelize.INTEGER,
            duration: Sequelize.INTEGER,
        },
        {
            hooks: {
                beforeCount(options: QueryOptions) {
                    options.raw = true;
                },
            },
        }
    );

    matches.associate = function (models: any) {
        matches.belongsTo(models.players, { as: 'challenger' });
        matches.belongsTo(models.players, { as: 'acceptor' });
    };

    return matches;
}
