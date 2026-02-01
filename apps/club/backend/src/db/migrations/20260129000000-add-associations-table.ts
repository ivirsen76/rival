import { QueryInterface, DataTypes } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.createTable('associations', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        slug: {
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
        `CREATE TRIGGER associations_OnInsert BEFORE INSERT ON \`associations\`
            FOR EACH ROW SET NEW.createdAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, '${process.env.TL_TIMEZONE}'), NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, '${process.env.TL_TIMEZONE}');`
    );
    await queryInterface.sequelize.query(
        `CREATE TRIGGER associations_OnUpdate BEFORE UPDATE ON \`associations\`
            FOR EACH ROW SET NEW.updatedAt = CONVERT_TZ(NOW(), @@SESSION.time_zone, '${process.env.TL_TIMEZONE}');`
    );
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.dropTable('associations');
};
