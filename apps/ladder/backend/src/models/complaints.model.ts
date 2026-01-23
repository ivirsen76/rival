import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const complaints = sequelizeClient.define(
        'complaints',
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
            },
            userId: Sequelize.INTEGER,
            opponentId: Sequelize.INTEGER,
            reason: Sequelize.STRING,
            description: Sequelize.TEXT,
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
    complaints.associate = function (models: any) {
        complaints.belongsTo(models.users);
    };

    return complaints;
}
