import Sequelize from 'sequelize';

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient');
    const doublesMatches = sequelizeClient.define(
        'doublesmatches',
        {
            player1Id: Sequelize.INTEGER,
            player2Id: Sequelize.INTEGER,
            player3Id: Sequelize.INTEGER,
            player4Id: Sequelize.INTEGER,
            player1Seed: Sequelize.INTEGER,
            player2Seed: Sequelize.INTEGER,
            player3Seed: Sequelize.INTEGER,
            player4Seed: Sequelize.INTEGER,
            score1: Sequelize.STRING,
            score2: Sequelize.STRING,
            score3: Sequelize.STRING,
            winner: Sequelize.INTEGER,
            runnerUp: Sequelize.INTEGER,
            finalSpot: Sequelize.INTEGER,
            playedAt: Sequelize.DATE,
        },
        {
            hooks: {
                beforeCount(options) {
                    options.raw = true;
                },
            },
        }
    );

    doublesMatches.associate = function (models) {
        doublesMatches.belongsTo(models.players, { as: 'player1' });
        doublesMatches.belongsTo(models.players, { as: 'player2' });
        doublesMatches.belongsTo(models.players, { as: 'player3' });
        doublesMatches.belongsTo(models.players, { as: 'player4' });
    };

    return doublesMatches;
}
