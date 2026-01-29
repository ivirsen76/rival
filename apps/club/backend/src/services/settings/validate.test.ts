// @ts-nocheck
import validate from './validate';

describe('validate()', () => {
    const correctValues = {};

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
                    signUpNotification: 'some@gmail.com',
                    changeLevelNotification: 'some@gmail.com;another@gmail.com; maybe@more.com',
                    newFeedbackNotification: 'more@more.com',
                    newComplaintNotification: 'more@more.com',
                })
            ).length
        ).toBe(0);
    });

    checkForErrors('signUpNotification', [
        123,
        'a'.repeat(201),
        'some',
        'some@good.com,wrong',
        'some@gmail.com,',
        ',some@gmail.com',
    ]);
    checkForErrors('changeLevelNotification', [
        123,
        'a'.repeat(201),
        'some',
        'some@good.com,wrong',
        'some@gmail.com,',
        ',some@gmail.com',
    ]);
    checkForErrors('newFeedbackNotification', [
        123,
        'a'.repeat(201),
        'some',
        'some@good.com,wrong',
        'some@gmail.com,',
        ',some@gmail.com',
    ]);
    checkForErrors('newComplaintNotification', [
        123,
        'a'.repeat(201),
        'some',
        'some@good.com,wrong',
        'some@gmail.com,',
        ',some@gmail.com',
    ]);
});
