import yup from '../../packages/yup';
import { getSchemaErrors } from '../../helpers';

export default values => {
    const schema = yup.object().shape({
        readyForFinal: yup.number().required().integer().min(0).max(2),
    });

    return getSchemaErrors(schema, values);
};
