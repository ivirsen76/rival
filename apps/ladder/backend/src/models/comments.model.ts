import Sequelize from 'sequelize';

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient');
    const comments = sequelizeClient.define(
        'comments',
        {
            userId: Sequelize.INTEGER,
            photoId: Sequelize.INTEGER,
            message: Sequelize.STRING,
        },
        {
            hooks: {
                beforeCount(options) {
                    options.raw = true;
                },
            },
        }
    );

    comments.associate = function (models) {
        comments.belongsTo(models.users);
    };

    return comments;
}
