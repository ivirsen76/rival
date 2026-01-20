import { QueryInterface } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkInsert(
        'levels',
        [
            {
                id: 1,
                name: 'Men 4.5',
                slug: 'men-45',
                position: 4,
                type: 'single',
                baseTlr: 450,
                minTlr: 400,
                maxTlr: 500,
            },
            {
                id: 2,
                name: 'Men 3.5',
                slug: 'men-35',
                position: 2,
                type: 'single',
                baseTlr: 350,
                minTlr: 300,
                maxTlr: 400,
            },
            {
                id: 3,
                name: 'Men 4.0',
                slug: 'men-40',
                position: 3,
                type: 'single',
                baseTlr: 400,
                minTlr: 350,
                maxTlr: 450,
            },
            {
                id: 4,
                name: 'Men 3.0',
                slug: 'men-30',
                position: 1,
                type: 'single',
                baseTlr: 300,
                minTlr: 250,
                maxTlr: 350,
            },
            {
                id: 5,
                name: 'Women 2.5',
                slug: 'women-25',
                position: 5,
                type: 'single',
                baseTlr: 250,
                minTlr: 200,
                maxTlr: 300,
            },
            {
                id: 6,
                name: 'Men Doubles',
                slug: 'men-40-dbls',
                position: 6,
                type: 'doubles',
                baseTlr: 400,
                minTlr: 350,
                maxTlr: 450,
            },
            {
                id: 7,
                name: 'Men Team Doubles',
                slug: 'men-40-dbls-team',
                position: 7,
                type: 'doubles-team',
                baseTlr: 400,
                minTlr: 350,
                maxTlr: 450,
            },
            {
                id: 8,
                name: 'Men Free Doubles',
                slug: 'men-40-dbls-free',
                position: 8,
                type: 'doubles-team',
                baseTlr: 400,
                minTlr: 350,
                maxTlr: 450,
            },
        ],
        {}
    );
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkDelete('levels', null, {});
};
