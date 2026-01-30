import { Formik, Field, Form } from '@rival/common/components/formik';
import Button from '@rival/common/components/Button';
import Input from '@rival/common/components/formik/Input';
import axios from '@rival/common/axios';
import notification from '@rival/common/components/notification';

const validate = (values) => {
    const errors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!values.email) {
        errors.email = 'Email is required.';
    } else if (!emailRegex.test(values.email)) {
        errors.email = 'Email is not valid';
    }

    return errors;
};

type FormRosterMessageProps = {
    hide: (...args: unknown[]) => unknown;
};

const FormRosterMessage = (props: FormRosterMessageProps) => {
    const handleSubmit = async (values) => {
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

export default FormRosterMessage;
