import { QueryInterface } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkInsert(
        'photos',
        [
            {
                id: 1,
                userId: 1,
                width: 999,
                height: 666,
                key: 'photos/original/raleigh/1/2bcd5f6aff9cc89e62d1999.jpg',
                url400: 'https://rival-tennis-ladder-images-test.s3.us-east-2.amazonaws.com/photos/final/raleigh/1/2bcd5f6aff9cc89e62d1-400.webp',
                url800: 'https://rival-tennis-ladder-images-test.s3.us-east-2.amazonaws.com/photos/final/raleigh/1/2bcd5f6aff9cc89e62d1-800.webp',
                url1200:
                    'https://rival-tennis-ladder-images-test.s3.us-east-2.amazonaws.com/photos/final/raleigh/1/2bcd5f6aff9cc89e62d1-1200.webp',
                url1600:
                    'https://rival-tennis-ladder-images-test.s3.us-east-2.amazonaws.com/photos/final/raleigh/1/2bcd5f6aff9cc89e62d1-1600.webp',
                url2400:
                    'https://rival-tennis-ladder-images-test.s3.us-east-2.amazonaws.com/photos/final/raleigh/1/2bcd5f6aff9cc89e62d1-2400.webp',
                allowShare: 1,
                allowComments: 1,
                isApproved: 1,
            },
        ],
        {}
    );
    await queryInterface.sequelize.query(`UPDATE photos SET createdAt="2022-10-10 00:00:00";`);
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.bulkDelete('photos', {}, {});
};
