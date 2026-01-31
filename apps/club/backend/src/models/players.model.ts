import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';
import getLevelGender from '../utils/getLevelGender';
import type { Player } from '../types';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const players = sequelizeClient.define(
        'players',
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
            },
            userId: Sequelize.INTEGER,
            tournamentId: Sequelize.INTEGER,
            isActive: Sequelize.BOOLEAN,
            readyForFinal: Sequelize.INTEGER,
            changedCount: Sequelize.INTEGER,
            address: Sequelize.STRING,
            addressVerification: Sequelize.STRING,
            joinAnyTeam: Sequelize.BOOLEAN,
            joinAnyTeamComment: Sequelize.STRING,
            joinReason: Sequelize.STRING,
            prediction: Sequelize.TEXT,
            joinForFree: Sequelize.BOOLEAN,
            partnerId: Sequelize.INTEGER,
            partnerInfo: Sequelize.STRING,
            teamName: Sequelize.STRING,
        },
        {
            hooks: {
                beforeCount(options: QueryOptions) {
                    options.raw = true;
                },
            },
        }
    );

    // eslint-disable-next-line no-unused-vars

    players.associate = function (models: any) {
        players.hasMany(models.matches, { foreignKey: 'challengerId' });
        players.hasMany(models.matches, { foreignKey: 'acceptorId' });
        players.belongsTo(models.tournaments);
    };

    // Populate gender
    players.afterCreate(async (player: Player) => {
        const { userId, tournamentId } = player;
        const { users } = sequelizeClient.models;

        const user = await users.findByPk(userId);
        if (user.gender) {
            return;
        }

        const [[level]] = await sequelizeClient.query(
            `
            SELECT l.name
              FROM tournaments AS t,
                   levels AS l
             WHERE t.levelId=l.id AND
                   t.id=:tournamentId`,
            { replacements: { tournamentId } }
        );

        await user.update({ gender: getLevelGender(level.name) });
    });

    return players;
}
