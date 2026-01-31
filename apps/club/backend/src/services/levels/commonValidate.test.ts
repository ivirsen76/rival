// @ts-nocheck
import validate from './commonValidate';

describe('validate()', () => {
    const correctValues = {
        name: 'Men new',
        type: 'doubles-team',
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

    checkForErrors('name', ['', 1, new Date(), 'long'.repeat(20)]);
    checkForErrors('type', [null, '', 1, new Date(), 'wrong']);
});
