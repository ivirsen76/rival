// @ts-nocheck
import validate from './commonValidate';
import dayjs from '../../utils/dayjs';

describe('validate()', () => {
    const currentYear = new Date().getFullYear();

    const correctValues = {
        year: currentYear,
        season: 'spring',
        startDate: dayjs.tz(`${currentYear}-12-12`).isoWeekday(1).format('YYYY-MM-DD'),
        weeks: 9,
        levels: [1, 2, 3],
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

    checkForErrors('year', [`${currentYear}`, currentYear - 2, currentYear + 2]);
    checkForErrors('season', ['', 'wrong', 'Spring']);
    checkForErrors('startDate', ['', 2020, new Date(), '2020-11-11a', 'wrong']);
    checkForErrors('weeks', ['', '9', 0, 25, 8.85, 'wrong']);
    checkForErrors('levels', [[], [1, 'wrong'], [1, '2']]);
});
