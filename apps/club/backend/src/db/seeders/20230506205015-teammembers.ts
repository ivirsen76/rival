import { QueryInterface } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkInsert(
        'teammembers',
        [
            { id: 1, playerId: 3, teamId: 1, role: 'captain', isActive: 1 },
            { id: 2, playerId: 4, teamId: 1, role: 'member', isActive: 1 },
        ],
        {}
    );
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkDelete('teammembers', {}, {});
};
