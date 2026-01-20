import yup from '../../packages/yup';
import { getSchemaErrors } from '../../helpers';

export default (values) => {
    const schema = yup.object().shape({
        name: yup.string().required().max(25),
        type: yup.string().required().oneOf(['single', 'doubles', 'doubles-team']),
    });

    return getSchemaErrors(schema, values);
};
