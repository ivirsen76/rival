import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import Button from '@/components/Button';
import axios from '@/utils/axios';
import notification from '@/components/notification';
import { useSelector, useDispatch } from 'react-redux';
import VerifyEmail from '@/components/VerifyEmail';
import EmailIcon from '@/styles/metronic/icons/duotone/Communication/Mail-at.svg?react';
import NotFound from '@/pages/NotFound';
import { loadCurrentUser, updateCurrentUser } from '@/reducers/auth';

type EmailFormProps = {
    onSubmit?: (...args: unknown[]) => unknown;
};

const EmailForm = (props: EmailFormProps) => {
    const currentUser = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();

    if (!currentUser) {
        return <NotFound />;
    }

    const validate = (values) => {
        const errors = {};

        if (values.email === currentUser.email) {
            errors.email = "The email hasn't changed.";
        }

        return errors;
    };

    return (
        <Formik
            initialValues={{ email: '' }}
            validate={validate}
            onSubmit={async (values) => {
                await dispatch(updateCurrentUser(values));

                props.onSubmit && props.onSubmit();

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
                                    allowResend={false}
                                    verifyCodeCustom={({ email, code }) =>
                                        axios.put('/api/users/0', {
                                            action: 'verifyNewEmail',
                                            email,
                                            verificationCode: code,
                                        })
                                    }
                                    onSuccess={async () => {
                                        hide();
                                        notification({
                                            inModal: true,
                                            message: (
                                                <div>
                                                    Email was successfully changed.
                                                    <br />
                                                    From now on you should use <strong>{values.email}</strong> to sign
                                                    in.
                                                </div>
                                            ),
                                        });
                                        await dispatch(loadCurrentUser());
                                    }}
                                    render={({ body, title, description }) => (
                                        <div>
                                            <h3>Verify your new email</h3>
                                            {description}
                                            {body}
                                        </div>
                                    )}
                                />
                            </div>
                        </>
                    ),
                });
            }}
        >
            {({ isSubmitting }) => (
                <Form noValidate>
                    <Field name="email" label="New email" component={Input} autoFocus />
                    <Button isSubmitting={isSubmitting}>Submit</Button>
                </Form>
            )}
        </Formik>
    );
};

export default EmailForm;
