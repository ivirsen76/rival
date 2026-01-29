import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout, authenticate } from '@/reducers/auth';
import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import PasswordInput from '@/components/formik/PasswordInput';
import notification from '@/components/notification';
import { Link } from 'react-router-dom';
import Button from '@rival/common/components/Button';
import Register from '@/components/Authentication/Register';
import VerifyEmail from '@/components/VerifyEmail';
import EmailIcon from '@rival/common/metronic/icons/duotone/Communication/Mail-at.svg?react';
import axios from '@/utils/axios';

type PlayerProps = {
    settings: object;
    updateSettings: (...args: unknown[]) => unknown;
    onSubmit: (...args: unknown[]) => unknown;
};

const Player = (props: PlayerProps) => {
    const { settings, updateSettings, onSubmit } = props;

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(logout());
    }, []);

    const getLoginInitialValues = () => {
        const url = new URL(window.location.href);
        const email = url.searchParams.get('email');
        // TODO: check email for the right format

        return { email: email || '', password: '' };
    };

    return (
        <div>
            {settings.step === 'login' && (
                <Formik
                    initialValues={getLoginInitialValues()}
                    onSubmit={async (values) => {
                        await dispatch(authenticate(values.email, values.password));
                        onSubmit();
                    }}
                >
                    {({ isSubmitting }) => (
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
                                            updateSettings({ step: 'new' });
                                        }}
                                    >
                                        Create an Account
                                    </a>
                                </div>
                            </div>

                            <Field name="email" label="Email" type="email" component={Input} autoFocus />

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
                            <Button className="btn btn-primary" isSubmitting={isSubmitting}>
                                Sign in
                            </Button>
                        </Form>
                    )}
                </Formik>
            )}
            {settings.step === 'new' && (
                <Register
                    onSubmit={async (values) => {
                        await axios.post('/api/users', values);

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
                                            password={values.password}
                                            onSuccess={async () => {
                                                let isLoggedIn = true;
                                                try {
                                                    await dispatch(authenticate(values.email, values.password));
                                                } catch {
                                                    isLoggedIn = false;
                                                }

                                                hide();
                                                notification({
                                                    inModal: true,
                                                    message: (
                                                        <div>You&apos;ve successfully registered in the system!</div>
                                                    ),
                                                    buttonTitle: isLoggedIn
                                                        ? "Let's pick a ladder to play"
                                                        : "Let's sign in now",
                                                    onHide: () => {
                                                        if (isLoggedIn) {
                                                            onSubmit();
                                                        } else {
                                                            updateSettings({ step: 'login' });
                                                        }
                                                    },
                                                });
                                            }}
                                        />
                                    </div>
                                </>
                            ),
                        });
                    }}
                    goToLogin={() => {
                        updateSettings({ step: 'login' });
                    }}
                />
            )}
        </div>
    );
};

export default Player;
