import { QueryInterface, DataTypes } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.createTable('clubmembers', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        clubId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'clubs',
                key: 'id',
            },
        },
        memberId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        gender: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        birthday: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    });

    await queryInterface.sequelize.query(
        `CREATE TRIGGER clubmembers_OnInsert BEFORE INSERT ON \`clubmembers\`
            FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, '${process.env.TL_TIMEZONE}'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, '${process.env.TL_TIMEZONE}');`
    );
    await queryInterface.sequelize.query(
        `CREATE TRIGGER clubmembers_OnUpdate BEFORE UPDATE ON \`clubmembers\`
            FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, '${process.env.TL_TIMEZONE}');`
    );
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.dropTable('clubmembers');
};
