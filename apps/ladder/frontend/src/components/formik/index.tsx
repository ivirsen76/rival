import PropTypes from 'prop-types';
import { Formik as OriginalFormik } from 'formik';

export const Formik = (props) => {
    const onSubmit = async (values, actions) => {
        try {
            await props.onSubmit(values, actions);
        } catch (errors) {
            actions.setErrors(errors);
        }
        actions.setSubmitting(false);
    };

    return <OriginalFormik {...props} onSubmit={onSubmit} />;
};

Formik.propTypes = {
    onSubmit: PropTypes.func,
};

export {
    yupToFormErrors,
    validateYupSchema,
    Field,
    Form,
    withFormik,
    move,
    swap,
    insert,
    replace,
    FieldArray,
    getIn,
    setIn,
    setNestedObjectValues,
    isFunction,
    isObject,
    isInteger,
    isString,
    isNaN,
    isEmptyChildren,
    isPromise,
    getActiveElement,
    FastField,
    FormikProvider,
    FormikConsumer,
    connect,
    ErrorMessage,
    useFormikContext,
} from 'formik';
