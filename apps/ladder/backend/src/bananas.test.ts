import bananas from './bananas';
import supertest from 'supertest';
import dayjs from '@rival/dayjs';

const yesterday = dayjs.tz().subtract(1, 'day').format('YYYY-MM-DD');

describe('bananas', () => {
    for (const banana of bananas) {
        it(`should check "${banana.name}"`, async () => {
            if (banana.to) {
                expect(banana.to > yesterday).toBeTruthy();
            }

            // check link
            {
                const result = await supertest(banana.link).get('').expect(200);
                const keyword = (banana.keyword || banana.name).toLowerCase();
                expect(result.text.toLowerCase()).toContain(keyword);
            }

            for (const image of Object.values(banana.images)) {
                await supertest(image.src).get('').expect(200);
            }
        });
    }
});
