import PropTypes from 'prop-types';
import { Formik, Field, Form } from '@/components/formik';
import PasswordInput from '@/components/formik/PasswordInput';
import Button from '@/components/Button';

const ChangePasswordForm = (props) => {
    return (
        <Formik
            initialValues={{
                password: '',
            }}
            onSubmit={props.onSubmit}
        >
            {({ isSubmitting }) => (
                <Form noValidate>
                    <Field name="password" label="New password" component={PasswordInput} autoFocus />

                    <Button className="btn btn-primary" isSubmitting={isSubmitting}>
                        Submit
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

ChangePasswordForm.propTypes = {
    onSubmit: PropTypes.func,
};

export default ChangePasswordForm;
