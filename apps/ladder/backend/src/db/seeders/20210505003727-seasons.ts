import dayjs from '@rival/dayjs';

import { QueryInterface } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkInsert(
        'seasons',
        [
            {
                id: 1,
                year: 2021,
                season: 'spring',
                startDate: '2021-03-29 00:00:00',
                endDate: `${new Date().getFullYear() + 1}-06-06 00:00:00`,
            },
            {
                id: 2,
                year: 2020,
                season: 'winter',
                startDate: '2020-11-09 00:00:00',
                endDate: '2021-03-07 00:00:00',
            },
            {
                id: 3,
                year: 2020,
                season: 'fall',
                startDate: '2020-10-09 00:00:00',
                endDate: '2020-11-02 00:00:00',
            },
            {
                id: 4,
                year: 2020,
                season: 'summer',
                startDate: '2020-06-09 00:00:00',
                endDate: '2020-09-02 00:00:00',
            },
            {
                id: 5,
                year: 2022,
                season: 'spring',
                startDate: dayjs.tz().add(2, 'years').isoWeekday(1).format('YYYY-MM-DD 00:00:00'),
                endDate: dayjs.tz().add(2, 'years').add(11, 'week').isoWeekday(1).format('YYYY-MM-DD 00:00:00'),
            },
        ],
        {}
    );
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkDelete('seasons', {}, {});
};
