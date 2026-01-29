import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
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
                beforeCount(options: QueryOptions) {
                    options.raw = true;
                },
            },
        }
    );

    reactions.associate = function (models: any) {
        reactions.belongsTo(models.users);
    };

    return reactions;
}
