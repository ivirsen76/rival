import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const photos = sequelizeClient.define(
        'photos',
        {
            userId: Sequelize.INTEGER,
            width: Sequelize.INTEGER,
            height: Sequelize.INTEGER,
            key: Sequelize.STRING,
            url400: Sequelize.STRING,
            url800: Sequelize.STRING,
            url1200: Sequelize.STRING,
            url1600: Sequelize.STRING,
            url2400: Sequelize.STRING,
            title: Sequelize.STRING,
            allowShare: Sequelize.BOOLEAN,
            allowComments: Sequelize.BOOLEAN,
            isApproved: Sequelize.BOOLEAN,
            moderationInfo: Sequelize.TEXT,
            deletedAt: Sequelize.DATE,
        },
        {
            hooks: {
                beforeCount(options: QueryOptions) {
                    options.raw = true;
                },
            },
        }
    );

    photos.associate = function (models: any) {
        photos.belongsTo(models.users);
    };

    return photos;
}
