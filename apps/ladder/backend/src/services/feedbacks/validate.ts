import yup from '../../packages/yup';
import { getSchemaErrors } from '../../helpers';

export default (values) => {
    const schema = yup.object().shape({
        type: yup.string().required().oneOf(['question', 'general', 'bug', 'feature']),
        description: yup.string().required('Text is required.').max(4000),
        userAgent: yup.string().max(500),
    });

    return getSchemaErrors(schema, values);
};
