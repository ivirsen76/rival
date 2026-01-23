import type { Application } from '@feathersjs/feathers';
import Sequelize, { QueryOptions } from 'sequelize';

export default function (app: Application) {
    const sequelizeClient = app.get('sequelizeClient');
    const users = sequelizeClient.define(
        'users',
        {
            email: Sequelize.STRING,
            password: Sequelize.STRING,
            isVerified: Sequelize.BOOLEAN,
            verificationCode: Sequelize.STRING,
            roles: Sequelize.STRING,
            firstName: Sequelize.STRING,
            lastName: Sequelize.STRING,
            slug: Sequelize.STRING,
            banDate: Sequelize.DATE,
            banReason: Sequelize.STRING,
            gender: Sequelize.STRING,
            phone: Sequelize.STRING,
            avatar: Sequelize.TEXT,
            avatarObject: Sequelize.TEXT,
            personalInfo: Sequelize.TEXT,
            dominantHand: Sequelize.STRING,
            forehandStyle: Sequelize.STRING,
            backhandStyle: Sequelize.STRING,
            playerType: Sequelize.STRING,
            shot: Sequelize.STRING,
            racquet: Sequelize.STRING,
            strings: Sequelize.STRING,
            shoes: Sequelize.STRING,
            bag: Sequelize.STRING,
            brand: Sequelize.STRING,
            overgrip: Sequelize.STRING,
            balls: Sequelize.STRING,
            birthday: Sequelize.STRING,
            height: Sequelize.STRING,
            weight: Sequelize.STRING,
            subscribeForProposals: Sequelize.BOOLEAN,
            subscribeForReminders: Sequelize.BOOLEAN,
            subscribeForNews: Sequelize.BOOLEAN,
            subscribeForBadges: Sequelize.BOOLEAN,
            comeFrom: Sequelize.INTEGER,
            comeFromOther: Sequelize.STRING,
            newEmail: Sequelize.STRING,
            newEmailCode: Sequelize.STRING,
            isWrongEmail: Sequelize.BOOLEAN,
            loggedAt: Sequelize.DATE,
            changelogSeenAt: Sequelize.DATE,
            referralCode: Sequelize.STRING,
            referrerUserId: Sequelize.INTEGER,
            badgesStats: Sequelize.TEXT,
            avatarCreatedAt: Sequelize.DATE,
            profileCompletedAt: Sequelize.DATE,
            information: Sequelize.TEXT,
            salt: Sequelize.STRING,
            appearance: Sequelize.STRING,
            isPhoneVerified: Sequelize.BOOLEAN,
            registerHistory: Sequelize.TEXT,
            deletedAt: Sequelize.DATE,
            refPercent: Sequelize.INTEGER,
            refYears: Sequelize.INTEGER,
            refStartedAt: Sequelize.DATE,
            zip: Sequelize.STRING,
            isSoftBan: Sequelize.BOOLEAN,
            showAge: Sequelize.BOOLEAN,
            cheatingAttempts: Sequelize.INTEGER,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    users.associate = function (models: any) {
        users.belongsToMany(models.tournaments, {
            through: 'players',
        });
        users.hasMany(models.payments);
        users.hasMany(models.orders);
    };

    return users;
}
