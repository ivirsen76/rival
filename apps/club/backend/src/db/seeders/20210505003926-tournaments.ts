import { QueryInterface } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkInsert(
        'tournaments',
        [
            { id: 1, seasonId: 1, levelId: 1, isFree: 0 },
            { id: 2, seasonId: 1, levelId: 2, isFree: 0 },
            { id: 3, seasonId: 1, levelId: 3, isFree: 0 },
            { id: 4, seasonId: 2, levelId: 3, isFree: 0 },
            { id: 5, seasonId: 1, levelId: 4, isFree: 0 },
            { id: 6, seasonId: 3, levelId: 4, isFree: 0 },
            { id: 7, seasonId: 5, levelId: 2, isFree: 0 },
            { id: 8, seasonId: 5, levelId: 3, isFree: 0 },
            { id: 9, seasonId: 1, levelId: 6, isFree: 0 },
            { id: 10, seasonId: 5, levelId: 1, isFree: 0 },
            { id: 11, seasonId: 1, levelId: 7, isFree: 0 },
            { id: 12, seasonId: 5, levelId: 7, isFree: 0 },
            { id: 13, seasonId: 1, levelId: 8, isFree: 1 },
            { id: 14, seasonId: 5, levelId: 8, isFree: 1 },
        ],
        {}
    );
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkDelete('tournaments', {}, {});
};
