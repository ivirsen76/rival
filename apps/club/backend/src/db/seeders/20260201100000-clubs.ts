import { QueryInterface } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkInsert(
        'clubs',
        [
            {
                id: 1,
                associationId: 1,
                name: 'Raleigh Racquet Club',
                slug: 'raleigh-racquet-club',
                url: 'http://www.rrctennis.com',
            },
        ],
        {}
    );
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkDelete('clubs', {}, {});
};
