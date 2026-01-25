// @ts-nocheck
import { SEASON_OPTIONS } from '../../constants';
import yup from '../../packages/yup';
import { getSchemaErrors } from '../../helpers';
import dayjs from '../../utils/dayjs';

export default (values) => {
    const currentYear = new Date().getFullYear();

    const schema = yup.object().shape({
        year: yup
            .number()
            .required()
            .min(currentYear - 1)
            .max(currentYear + 1),
        season: yup
            .string()
            .required('Season is required.')
            .test('fromConstant', 'The season is wrong.', (value) =>
                SEASON_OPTIONS.some((season) => season.value === value)
            ),
        startDate: yup.string().required('Start date is required.').isValidDate(),
        weeks: yup.number().required().integer().min(1).max(20),
        levels: yup.array(yup.number()).required().min(1, 'Must be at least one level.').max(20),
    });

    const errors = getSchemaErrors(schema, values);
    if (Object.keys(errors).length === 0) {
        const dayOfWeek = dayjs.tz(values.startDate).isoWeekday();
        if (dayOfWeek !== 1) {
            errors.startDate = 'The season should start on Monday.';
        }
    }

    return errors;
};
