import validate from './validate';

describe('validate()', () => {
    const correctValues = {
        readyForFinal: 2,
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

    checkForErrors('readyForFinal', [null, '', 'wrong', 10.2, -1, 3]);
});
