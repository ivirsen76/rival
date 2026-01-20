import Sequelize from 'sequelize';

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient');
    const seasons = sequelizeClient.define(
        'seasons',
        {
            year: Sequelize.INTEGER,
            season: Sequelize.STRING,
            startDate: Sequelize.DATE,
            endDate: Sequelize.DATE,
            hasFinalTournament: Sequelize.BOOLEAN,
            closeReason: Sequelize.STRING,
            isFree: Sequelize.BOOLEAN,
        },
        {
            hooks: {
                beforeCount(options) {
                    options.raw = true;
                },
            },
        }
    );

    // eslint-disable-next-line no-unused-vars
    seasons.associate = function (models) {
        seasons.belongsToMany(models.levels, {
            through: 'tournaments',
        });
    };

    return seasons;
}
