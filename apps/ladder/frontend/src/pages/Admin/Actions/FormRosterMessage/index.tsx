import PropTypes from 'prop-types';
import { Formik, Field, Form } from '@/components/formik';
import Button from '@/components/Button';
import Input from '@/components/formik/Input';
import axios from '@/utils/axios';
import notification from '@/components/notification';

const validate = values => {
    const errors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!values.email) {
        errors.email = 'Email is required.';
    } else if (!emailRegex.test(values.email)) {
        errors.email = 'Email is not valid';
    }

    return errors;
};

const FormRosterMessage = props => {
    const handleSubmit = async values => {
        await axios.put('/api/utils/0', { action: 'sendOneRosterMessage', ...values });

        props.hide();

        notification({
            header: 'Success',
            message: `Message has been sent.`,
        });
    };

    return (
        <Formik initialValues={{ email: '' }} validate={validate} onSubmit={handleSubmit}>
            {({ isSubmitting }) => (
                <Form noValidate>
                    <Field name="email" label="Email" type="text" component={Input} />
                    <Button isSubmitting={isSubmitting}>Submit</Button>
                </Form>
            )}
        </Formik>
    );
};

FormRosterMessage.propTypes = {
    hide: PropTypes.func,
};

export default FormRosterMessage;
