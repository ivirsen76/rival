import { validate } from './index';

describe('validate()', () => {
    const correctValues = {
        subject: 'Something',
        body: 'Some content',
        additionalRecipients: '',
    };

    it('Should not show any validate errors', () => {
        expect(validate(correctValues)).toEqual({});
    });

    it('Should not show any validate errors for additional recipients', () => {
        expect(
            validate({
                ...correctValues,
                additionalRecipients: ' some@gmail.com ; another@time.com ; ',
            })
        ).toEqual({});
    });

    it('Should show validate errors', () => {
        expect(
            validate({
                ...correctValues,
                additionalRecipients: 'some@gmail.com;some@com',
            })
        ).toHaveProperty('additionalRecipients');
    });
});
