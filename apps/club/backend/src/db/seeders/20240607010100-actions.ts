import { QueryInterface } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
    // clean actions, including "generateBadges" action
    await queryInterface.sequelize.query('DELETE FROM actions');
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {};
