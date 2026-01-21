/* eslint-disable react-hooks/exhaustive-deps, react/prop-types */

import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { Link, useHistory } from 'react-router-dom';
import { authenticate } from '@/reducers/auth';
import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import PasswordInput from '@/components/formik/PasswordInput';
import Button from '@/components/Button';
import notification from '@/components/notification';
import VerifyEmail from '@/components/VerifyEmail';
import EmailIcon from '@/styles/metronic/icons/duotone/Communication/Mail-at.svg?react';

const Login = (props) => {
    const dispatch = useDispatch();
    const history = useHistory();

    const goToRegister = props.goToRegister
        ? props.goToRegister
        : () => {
              history.push('/register');
          };

    return (
        <Formik
            initialValues={{ email: '', password: '' }}
            onSubmit={async (values) => {
                const user = await dispatch(authenticate(values.email, values.password));
                if (props.onSubmit) {
                    props.onSubmit(user);
                }
            }}
        >
            {({ handleSubmit, isSubmitting, values }) => (
                <Form noValidate>
                    <div className="mb-6">
                        <h3 className="mb-2">Sign in</h3>
                        <div className="text-gray-400 fw-semibold fs-5">
                            New here?{' '}
                            <a
                                href=""
                                className="link-primary fw-bold"
                                onClick={(e) => {
                                    e.preventDefault();
                                    goToRegister();
                                }}
                            >
                                Create an Account
                            </a>
                        </div>
                    </div>

                    <Field
                        name="email"
                        label="Email"
                        type="email"
                        component={Input}
                        autoFocus
                        renderError={(error) =>
                            error.includes('verified') ? (
                                <div>
                                    Your email is not verified.{' '}
                                    <a
                                        href=""
                                        onClick={(e) => {
                                            e.preventDefault();
                                            notification({
                                                inModal: true,
                                                render: ({ hide }) => (
                                                    <>
                                                        <span className="svg-icon svg-icon-primary svg-icon-5x">
                                                            <EmailIcon />
                                                        </span>
                                                        <div className="mt-6">
                                                            <VerifyEmail
                                                                sendOnMount
                                                                email={values.email}
                                                                password={values.password}
                                                                onSuccess={() => {
                                                                    hide();
                                                                    handleSubmit();
                                                                }}
                                                            />
                                                        </div>
                                                    </>
                                                ),
                                            });
                                        }}
                                    >
                                        Verify email
                                    </a>
                                    .
                                </div>
                            ) : (
                                error
                            )
                        }
                    />

                    <label className="form-label d-block">
                        <div className="d-flex justify-content-between w-100">
                            <div>Password</div>
                            <div>
                                <Link to="/forgotPassword" tabIndex="-1">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>
                    </label>
                    <Field name="password" component={PasswordInput} />
                    <Button className="mt-4 btn btn-lg btn-primary w-100" isSubmitting={isSubmitting}>
                        Sign in
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

Login.propTypes = {
    goToRegister: PropTypes.func,
    onSubmit: PropTypes.func,
};

export default Login;
