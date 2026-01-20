import validate from './validate';

describe('validate()', () => {
    const correctValues = {
        from: {
            name: 'Ben Done',
            email: 'some@gmail.com',
        },
        subject: 'Welcome',
        text: 'Welcome to the Ladder',
    };

    const checkForErrors = (fieldName, values, checkField) => {
        describe(`${fieldName} errors`, () => {
            for (const value of values) {
                it(`Should show error for value "${JSON.stringify(value)}" (${typeof value})`, () => {
                    expect(validate({ ...correctValues, [fieldName]: value })[checkField || fieldName]).toBeDefined();
                });
            }
        });
    };

    it('Should show no errors', () => {
        expect(Object.keys(validate(correctValues)).length).toBe(0);
        expect(Object.keys(validate({ ...correctValues, from: { email: 'some@gmail.com' } })).length).toBe(0);
    });

    checkForErrors('from', [0, 'some']);
    checkForErrors('from', [{ name: 'a'.repeat(51), email: 'some@gmail.com' }], 'from.name');
    checkForErrors('from', [{ name: 'a', email: 'some' }, { email: 'some' }], 'from.email');

    checkForErrors('to', [[{ email: 'some' }]]);
    checkForErrors('cc', [[{ email: 'some' }]]);
    checkForErrors('bcc', [[{ email: 'some' }]]);
    checkForErrors('replyTo', [{ email: 'some' }], 'replyTo.email');

    checkForErrors('subject', [null, '', 0]);
    checkForErrors('text', [null, 0, 123]);
    checkForErrors('html', [null, 0, 123]);
});
