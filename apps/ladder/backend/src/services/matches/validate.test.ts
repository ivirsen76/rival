// @ts-nocheck
import validate from './validate';
import dayjs from '@rival/dayjs';

describe('validate()', () => {
    const correctValues = {
        challengerId: 1,
        acceptorId: 2,
        score: '6-4 6-4',
        playedAt: dayjs.tz().format('YYYY-MM-DD HH:mm:ss'),
        wonByDefault: false,
        wonByInjury: false,
        unavailable: false,
    };

    const checkForErrors = (fieldName, values) => {
        describe(`${fieldName} errors`, () => {
            for (const value of values) {
                it(`Should show error for value "${value}" (${typeof value})`, () => {
                    expect(validate({ ...correctValues, [fieldName]: value })[fieldName]).toBeDefined();
                });
            }
        });
    };

    it('Should show no errors', () => {
        expect(Object.keys(validate(correctValues)).length).toBe(0);
    });

    checkForErrors('challengerId', [null, '', 0, 'wrong', 10.2, -1]);
    checkForErrors('acceptorId', [null, '', 0, 'wrong', 10.2, -1]);
    checkForErrors('score', [123, null]);
    checkForErrors('playedAt', [
        null,
        '',
        'wrong',
        123,
        '2030-10-10 10:15:00',
        '2010-10-10 10:15:00',
        dayjs.tz().add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    ]);
    checkForErrors('wonByDefault', ['', 'wrong', 100]);
    checkForErrors('wonByInjury', ['', 'wrong', 100]);
    checkForErrors('unavailable', ['', 'wrong', 100]);
});
