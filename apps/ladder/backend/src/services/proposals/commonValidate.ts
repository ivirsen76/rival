// @ts-nocheck
import yup from '../../packages/yup';
import { getSchemaErrors } from '../../helpers';
import dayjs from '@rival/dayjs';
import practiceTypeOptions from './practiceTypeOptions';
import matchFormatOptions from './matchFormatOptions';
import durationOptions from './durationOptions';

export default (values) => {
    const schema = yup.object().shape({
        challengers: yup.array(yup.number().integer()).min(2).max(2),
        place: yup.string().required('Location is required.').max(100),
        comment: yup.string().max(100),
        playedAt: yup
            .string()
            .required('Date is required.')
            .matches(/^\d\d\d\d-\d\d-\d\d\s\d\d:\d\d:\d\d$/),
        tournaments: yup.array(yup.number().integer()).required().min(1),
        isCompetitive: yup.boolean(),
        isAgeCompatible: yup.boolean(),
        practiceType: yup
            .number()
            .integer()
            .oneOf(practiceTypeOptions.map((item) => item.value)),
        matchFormat: yup
            .number()
            .integer()
            .oneOf(matchFormatOptions.map((item) => item.value)),
        duration: yup
            .number()
            .integer()
            .oneOf(durationOptions.map((item) => item.value)),
    });

    const errors = getSchemaErrors(schema, values);
    if (errors.challengers) {
        errors.challengers = 'Pick two teammates';
    }
    if (Object.keys(errors).length === 0) {
        const proposedDate = dayjs.tz(values.playedAt);
        const currentDate = dayjs.tz();

        if (currentDate.isAfter(proposedDate)) {
            errors.playedAt = 'This date has passed.';
        } else if (proposedDate.isAfter(currentDate.add(1, 'week').isoWeekday(7).hour(23).minute(59).second(59))) {
            errors.playedAt = 'The date is more than a week in the future.';
        }
    }

    return errors;
};
