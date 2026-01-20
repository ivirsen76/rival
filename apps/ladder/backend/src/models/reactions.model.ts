import Sequelize from 'sequelize';

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient');
    const reactions = sequelizeClient.define(
        'reactions',
        {
            userId: Sequelize.INTEGER,
            photoId: Sequelize.INTEGER,
            code: Sequelize.STRING,
        },
        {
            hooks: {
                beforeCount(options) {
                    options.raw = true;
                },
            },
        }
    );

    reactions.associate = function (models) {
        reactions.belongsTo(models.users);
    };

    return reactions;
}
