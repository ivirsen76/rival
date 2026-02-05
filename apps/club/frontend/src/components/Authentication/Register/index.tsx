import { Formik, Field, Form } from '@rival/common/components/formik';
import Input from '@rival/common/components/formik/Input';
import Button from '@rival/common/components/Button';
import notification from '@rival/common/components/notification';
import EmailIcon from '@rival/common/metronic/icons/duotone/Communication/Mail-at.svg?react';
import VerifyEmail from '@/components/VerifyEmail';
import WrongIcon from '@rival/common/metronic/icons/duotune/arrows/arr015.svg?react';
import axios from '@rival/common/axios';
import PasswordInput from '@rival/common/components/formik/PasswordInput';
import { isEmail } from '@rival/club.backend/src/helpers';
import { authenticate } from '@/reducers/auth';
import { useDispatch } from 'react-redux';

const validate = (values) => {
    const errors = {};

    if (!values.email) {
        errors.email = 'Email is required';
    } else if (!isEmail(values.email)) {
        errors.email = 'Wrong email format';
    }

    if (!values.password) {
        errors.password = 'Password is required';
    } else {
        const length = values.password.length;
        if (length < 8) {
            errors.password = 'Password must be at least 8 characters';
        } else if (length > 20) {
            errors.password = 'Password must be not more than 20 characters';
        }
    }

    return errors;
};

type RegisterFormProps = {
    goToLogin: (...args: unknown[]) => unknown;
};

const RegisterForm = (props: RegisterFormProps) => {
    const { goToLogin } = props;
    const dispatch = useDispatch();

    return (
        <Formik
            initialValues={{ email: '', password: '' }}
            validate={validate}
            onSubmit={async (values, form) => {
                notification({
                    inModal: true,
                    render: ({ hide }) => (
                        <>
                            <span className="svg-icon svg-icon-primary svg-icon-5x">
                                <EmailIcon />
                            </span>
                            <div className="mt-6">
                                <VerifyEmail
                                    email={values.email}
                                    onSuccess={async (code) => {
                                        const { data } = await axios.put('/api/users/0', {
                                            action: 'registerClubMember',
                                            email: values.email,
                                            password: values.password,
                                            verificationCode: code,
                                        });

                                        hide();
                                        if (data.isExistingUser) {
                                            notification({
                                                inModal: true,
                                                render: ({ hide }) => (
                                                    <>
                                                        <span className="svg-icon svg-icon-danger svg-icon-5x">
                                                            <WrongIcon />
                                                        </span>
                                                        <div className="mt-6 mb-8">
                                                            <p style={{ textWrap: 'balance' }}>
                                                                The user with the email <b>{values.email}</b> already
                                                                exists in the ladder.
                                                            </p>
                                                            <div style={{ textWrap: 'balance' }}>
                                                                You can sign in using this email or recover password if
                                                                you don't remember that.
                                                            </div>
                                                        </div>
                                                        <div className="d-flex gap-2 justify-content-center">
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary"
                                                                onClick={() => {
                                                                    hide();
                                                                    goToLogin();
                                                                }}
                                                            >
                                                                Sign In
                                                            </button>
                                                            <a className="btn btn-primary" href="/forgotPassword">
                                                                Recover Password
                                                            </a>
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary"
                                                                onClick={() => {
                                                                    hide();
                                                                    form.resetForm();
                                                                }}
                                                            >
                                                                Close
                                                            </button>
                                                        </div>
                                                    </>
                                                ),
                                            });
                                        } else if (data.members.length === 0) {
                                            notification({
                                                inModal: true,
                                                render: ({ hide }) => (
                                                    <>
                                                        <span className="svg-icon svg-icon-danger svg-icon-5x">
                                                            <WrongIcon />
                                                        </span>
                                                        <div className="mt-6 mb-8">
                                                            <p style={{ textWrap: 'balance' }}>
                                                                The user with the email <b>{values.email}</b> doesn't
                                                                belong to any club.
                                                            </p>
                                                            <div style={{ textWrap: 'balance' }}>
                                                                If you just joined the club, wait for up to 24 hours
                                                                till you will be able to register in Tennis Ladder.
                                                            </div>
                                                        </div>
                                                        <div className="d-flex gap-2 justify-content-center">
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary"
                                                                onClick={() => {
                                                                    hide();
                                                                    form.resetForm();
                                                                }}
                                                            >
                                                                Use another email
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary"
                                                                onClick={() => {
                                                                    hide();
                                                                    form.resetForm();
                                                                }}
                                                            >
                                                                Close
                                                            </button>
                                                        </div>
                                                    </>
                                                ),
                                            });
                                        } else {
                                            const member = data.members[0];
                                            dispatch(authenticate(values.email, values.password));

                                            notification({
                                                inModal: true,
                                                message: (
                                                    <div>
                                                        <p style={{ textWrap: 'balance' }}>
                                                            We found you! You are{' '}
                                                            <b>
                                                                {member.firstName} {member.lastName}
                                                            </b>
                                                            , the member of <b>{member.clubName}</b>.
                                                        </p>
                                                        <div style={{ textWrap: 'balance' }}>
                                                            From now on, you can log in into Rival Tennis Ladder using
                                                            your email and password.
                                                        </div>
                                                    </div>
                                                ),
                                                buttonTitle: 'Continue',
                                            });
                                        }
                                    }}
                                />
                            </div>
                        </>
                    ),
                });
            }}
        >
            {({ isSubmitting }) => (
                <Form noValidate>
                    <div className="mb-6">
                        <h3 className="mb-2">Create an Account</h3>
                        <div className="text-gray-400 fw-semibold fs-5">
                            Already have an account?{' '}
                            <a
                                href=""
                                className="link-primary fw-bold"
                                onClick={(e) => {
                                    e.preventDefault();
                                    goToLogin();
                                }}
                            >
                                Sign in
                            </a>
                        </div>
                    </div>

                    <Field
                        name="email"
                        label="Email"
                        description="Provide an email which you use in your tennis club."
                        type="email"
                        component={Input}
                    />

                    <Field
                        name="password"
                        label="Password"
                        description="It could be different from your tennis club password"
                        component={PasswordInput}
                    />

                    <Button className="btn btn-lg btn-primary w-100" isSubmitting={isSubmitting}>
                        Submit
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export default RegisterForm;
