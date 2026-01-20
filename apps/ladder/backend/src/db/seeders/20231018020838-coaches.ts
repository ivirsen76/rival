import { QueryInterface } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkInsert(
        'coaches',
        [
            {
                id: 1,
                firstName: 'Bob',
                lastName: 'Lisson',
                email: 'bob@gmail.com',
                phone: '9191234567',
                price: 60,
                bullets: '["first point", "second point", "third point"]',
                description: 'I am a great coach',
                locationName: 'Cary, Morrisville',
                locationAddress: '[{"name": "Breckenridge", "address": "2023 Tennis Drive, Morrisville"}]',
                isActive: 0,
            },
        ],
        {}
    );
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkDelete('coaches', null, {});
};
