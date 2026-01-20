import validate from './commonValidate';
import dayjs from '../../utils/dayjs';

describe('validate()', () => {
    const correctValues = {
        place: 'Pullen',
        playedAt: dayjs.tz().add(2, 'day').format('YYYY-MM-DD 09:15:00'),
        tournaments: [1, 2],
        isCompetitive: true,
        isAgeCompatible: true,
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

        expect(
            Object.keys(
                validate({
                    ...correctValues,
                    place: 'a'.repeat(100),
                    comment: 'a'.repeat(100),
                    challengers: [2, 3],
                })
            ).length
        ).toBe(0);
    });

    checkForErrors('place', [null, '', 123, 'a'.repeat(101)]);
    checkForErrors('comment', [123, 'a'.repeat(101)]);
    checkForErrors('playedAt', [null, '', 'wrong', 123, '2030-10-10 10:15:00', '2010-10-10 10:15:00']);
    checkForErrors('tournaments', [null, '', 'wrong', '100', ['some'], [], [234.34]]);
    checkForErrors('isCompetitive', ['', 'wrong', 100, []]);
    checkForErrors('isAgeCompatible', ['', 'wrong', 100, []]);
    checkForErrors('challengers', [[], [1], [1, 2, 3], ['1', '2'], 'wrong', 100]);
});
