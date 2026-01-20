import Sequelize from 'sequelize';

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient');
    const levels = sequelizeClient.define(
        'levels',
        {
            name: Sequelize.STRING,
            type: Sequelize.STRING,
            slug: Sequelize.STRING,
            isActive: Sequelize.BOOLEAN,
            position: Sequelize.INTEGER,
            baseTlr: Sequelize.INTEGER,
            minTlr: Sequelize.INTEGER,
            maxTlr: Sequelize.INTEGER,
        },
        {
            hooks: {
                beforeCount(options) {
                    options.raw = true;
                },
            },
        }
    );

    levels.associate = function (models) {
        levels.belongsToMany(models.seasons, {
            through: 'tournaments',
        });
    };

    return levels;
}
