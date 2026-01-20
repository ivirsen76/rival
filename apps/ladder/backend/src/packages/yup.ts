import * as yup from 'yup';
import dayjs from '../utils/dayjs';

yup.addMethod(yup.string, 'isValidDate', function (msg) {
    return this.test('isValidDate', msg || 'The date is wrong.', value => dayjs(value).isValid());
});

export default yup;
