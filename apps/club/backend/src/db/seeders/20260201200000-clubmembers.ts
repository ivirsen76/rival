import { QueryInterface } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkInsert(
        'clubmembers',
        [
            {
                id: 1,
                clubId: 1,
                firstName: 'David',
                lastName: 'Trust',
                email: 'david@rrclub.com',
                phone: '1234567890',
                birthday: '1980-10-10',
            },
            {
                id: 2,
                clubId: 1,
                firstName: 'Ben',
                lastName: 'Shrimp',
                email: 'ben@rrclub.com',
                phone: '2345678901',
                birthday: '1981-10-10',
            },
        ],
        {}
    );
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkDelete('clubmembers', {}, {});
};
