// @ts-nocheck
import validate from './validate';

describe('validate()', () => {
    const correctValues = {
        type: 'general',
        description: 'Something wrong',
    };

    const checkForErrors = (fieldName, values) => {
        describe(`${fieldName} errors`, () => {
            for (const value of values) {
                it(`Should show error for value "${value && value.toString().slice(0, 100)}" (${typeof value})`, () => {
                    expect(validate({ ...correctValues, [fieldName]: value })[fieldName]).toBeDefined();
                });
            }
        });
    };

    it('Should show no errors', () => {
        expect(Object.keys(validate(correctValues)).length).toBe(0);
    });

    checkForErrors('type', [undefined, null, '', 1, 'wrong', new Date()]);
    checkForErrors('description', [undefined, null, '', 1, new Date(), 'a'.repeat(4001)]);
});
