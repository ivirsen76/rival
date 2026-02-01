import { QueryInterface } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkInsert(
        'associations',
        [
            {
                id: 1,
                name: 'Group of Raleigh Tennis Clubs',
                slug: 'raleigh',
            },
        ],
        {}
    );
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkDelete('associations', {}, {});
};
