import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
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
                beforeCount(options: QueryOptions) {
                    options.raw = true;
                },
            },
        }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comments.associate = function (models: any) {
        comments.belongsTo(models.users);
    };

    return comments;
}
