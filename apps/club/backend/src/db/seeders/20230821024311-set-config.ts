import { QueryInterface } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.sequelize.query('UPDATE config SET minPlayersForTeams=2');
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {};
