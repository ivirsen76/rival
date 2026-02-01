import { QueryInterface, DataTypes } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.createTable('clubs', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        associationId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'associations',
                key: 'id',
            },
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
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
        `CREATE TRIGGER clubs_OnInsert BEFORE INSERT ON \`clubs\`
            FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, '${process.env.TL_TIMEZONE}'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, '${process.env.TL_TIMEZONE}');`
    );
    await queryInterface.sequelize.query(
        `CREATE TRIGGER clubs_OnUpdate BEFORE UPDATE ON \`clubs\`
            FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, '${process.env.TL_TIMEZONE}');`
    );
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.dropTable('clubs');
};
