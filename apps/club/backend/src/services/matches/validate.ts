// @ts-nocheck
import yup from '../../packages/yup';
import { getSchemaErrors } from '../../helpers';
import dayjs from '../../utils/dayjs';
import { isDateThisWeek } from './helpers';

export default (values) => {
    const schema = yup.object().shape({
        challengerId: yup.number().required().integer().min(1),
        acceptorId: yup.number().required().integer().min(1),
        score: yup.string().required(),
        wonByDefault: yup.boolean(),
        wonByInjury: yup.boolean(),
        unavailable: yup.boolean(),
        playedAt: yup
            .string()
            .required('Date is required.')
            .matches(/^\d\d\d\d-\d\d-\d\d\s\d\d:\d\d:\d\d$/),
    });

    const errors = getSchemaErrors(schema, values);
    if (Object.keys(errors).length === 0) {
        if (!isDateThisWeek(values.playedAt)) {
            errors.playedAt = 'The date should be for this week.';
        }
        if (dayjs.tz().isBefore(dayjs.tz(values.playedAt))) {
            errors.playedAt = 'The date should not be in the future.';
        }
    }

    return errors;
};
