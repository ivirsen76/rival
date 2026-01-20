import * as yup from 'yup';
import dayjs from '../utils/dayjs';

yup.addMethod(yup.string, 'isValidDate', function (msg) {
    return this.test('isValidDate', msg || 'The date is wrong.', (value) => dayjs(value).isValid());
});

yup.addMethod(yup.string, 'email', function (msg) {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    return this.matches(emailRegex, {
        msg,
        name: 'email',
        excludeEmptyString: true,
    });
});

export default yup;
