import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Formik, Field, Form } from '@/components/formik';
import PasswordInput from '@/components/formik/PasswordInput';
import Button from '@/components/Button';
import axios from '@/utils/axios';
import notification from '@/components/notification';
import { useSelector } from 'react-redux';
import NotFound from '@/pages/NotFound';

const PasswordForm = (props) => {
    const currentUser = useSelector((state) => state.auth.user);

    if (!currentUser) {
        return <NotFound />;
    }

    return (
        <Formik
            initialValues={{ oldPassword: '', password: '' }}
            onSubmit={async (values) => {
                await axios.put('/api/users/0', { action: 'changePassword', ...values });

                notification({
                    header: 'Success',
                    message: 'You password has been changed successfully.',
                });

                if (props.onSubmit) {
                    props.onSubmit(values);
                }
            }}
        >
            {({ handleSubmit, isSubmitting, values }) => (
                <Form noValidate>
                    <label className="form-label d-block">
                        <div className="d-flex justify-content-between w-100">
                            <div>Current password</div>
                            <div>
                                <Link to="/forgotPassword" tabIndex="-1">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>
                    </label>
                    <Field name="oldPassword" component={PasswordInput} autoFocus />

                    <Field name="password" label="New password" component={PasswordInput} />
                    <Button className="btn btn-primary" isSubmitting={isSubmitting}>
                        Submit
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

PasswordForm.propTypes = {
    onSubmit: PropTypes.func,
};

export default PasswordForm;
