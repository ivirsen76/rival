import * as yup from 'yup';
import dayjs from '../utils/dayjs';

yup.addMethod(yup.string, 'isValidDate', function (msg) {
    return this.test('isValidDate', msg || 'The date is wrong.', (value) => dayjs(value).isValid());
});

yup.addMethod(yup.string, 'email', function (msg) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return this.matches(emailRegex, {
        msg,
        name: 'email',
        excludeEmptyString: true,
    });
});

export default yup;
