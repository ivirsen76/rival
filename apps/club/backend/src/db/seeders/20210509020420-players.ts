import dayjs from '../../utils/dayjs';

import { QueryInterface } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkInsert(
        'players',
        [
            {
                id: 1,
                userId: 2,
                tournamentId: 2,
                isActive: 1,
            },
            {
                id: 2,
                userId: 1,
                tournamentId: 2,
                isActive: 1,
            },
            {
                id: 3,
                userId: 5,
                tournamentId: 2,
                isActive: 1,
            },
            {
                id: 4,
                userId: 6,
                tournamentId: 2,
                isActive: 1,
            },
            {
                id: 5,
                userId: 2,
                tournamentId: 3,
                isActive: 1,
            },
            {
                id: 6,
                userId: 7,
                tournamentId: 2,
                isActive: 0,
            },
            {
                id: 7,
                userId: 4,
                tournamentId: 3,
                isActive: 1,
            },
            {
                id: 8,
                userId: 2,
                tournamentId: 7,
                isActive: 1,
            },
            {
                id: 9,
                userId: 1,
                tournamentId: 7,
                isActive: 1,
            },
            {
                id: 10,
                userId: 8,
                tournamentId: 3,
                isActive: 1,
            },
            {
                id: 17,
                userId: 1,
                tournamentId: 4,
                isActive: 1,
            },
            {
                id: 18,
                userId: 2,
                tournamentId: 4,
                isActive: 1,
            },
            {
                id: 19,
                userId: 9,
                tournamentId: 4,
                isActive: 1,
            },
        ],
        {}
    );

    // set createdAt once month ago to not mess with final tournament registration
    const dateTwoMonthAgo = dayjs.tz().subtract(2, 'month').format('YYYY-MM-DD HH:mm:ss');
    await queryInterface.sequelize.query(`UPDATE players SET createdAt="${dateTwoMonthAgo}";`);
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkDelete('players', {}, {});
};
