import yup from '../../packages/yup';
import { getSchemaErrors } from '../../helpers';

export default (values) => {
    const schema = yup.object().shape({
        score: yup
            .array(yup.array(yup.number().integer().min(0)).min(2).max(2))
            .required()
            .min(3)
            .max(3),
    });

    const errors = getSchemaErrors(schema, values);
    if (Object.keys(errors).length === 0) {
        if (!values.score.every((item) => item[0] + item[1] === 8)) {
            errors.score = 'The score is wrong.';
        }
    }

    return errors;
};
