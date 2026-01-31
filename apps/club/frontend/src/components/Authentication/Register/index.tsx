import { Formik, Field, Form } from '@rival/common/components/formik';
import Input from '@rival/common/components/formik/Input';
import Birthday from '@rival/common/components/formik/Birthday';
import PasswordInput from '@rival/common/components/formik/PasswordInput';
import Button from '@rival/common/components/Button';
import { Link, useHistory } from 'react-router-dom';
import { IMaskInput } from 'react-imask';
import FieldWrapper from '@rival/common/components/formik/FieldWrapper';
import classnames from 'classnames';
import useStatsigEvents from '@/utils/useStatsigEvents';
import convertDate from '@rival/common/utils/convertDate';

type RegisterFormProps = {
    onSubmit: (...args: unknown[]) => unknown;
    goToLogin: (...args: unknown[]) => unknown;
    showComeFrom: boolean;
};

const RegisterForm = (props: RegisterFormProps) => {
    const history = useHistory();
    const { onRegister } = useStatsigEvents();

    const goToLogin = props.goToLogin
        ? props.goToLogin
        : () => {
              history.push('/login');
          };

    return (
        <Formik
            initialValues={{
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                password: '',
                agree: false,
                zip: '',
            }}
            onSubmit={async (values) => {
                const additionalValues = {};

                await props.onSubmit({
                    ...values,
                    ...additionalValues,
                    birthday: convertDate(values.birthday),
                });
                onRegister();
            }}
        >
            {({ isSubmitting, values }) => (
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

                    <div className="row">
                        <div className="col">
                            <Field name="firstName" label="First name" type="text" component={Input} autoFocus />
                        </div>
                        <div className="col">
                            <Field name="lastName" label="Last name" type="text" component={Input} />
                        </div>
                    </div>

                    <Field
                        name="email"
                        label="Email"
                        description="Only visible to your match opponents"
                        type="email"
                        component={Input}
                        renderError={(error) =>
                            error.includes('unique') ? (
                                <div>
                                    This email is already used by another player.
                                    <br />
                                    You can{' '}
                                    <a
                                        href=""
                                        onClick={(e) => {
                                            e.preventDefault();
                                            goToLogin();
                                        }}
                                    >
                                        sign in
                                    </a>{' '}
                                    or <Link to="/forgotPassword">reset password</Link> if you don&apos;t remember it.
                                </div>
                            ) : (
                                error
                            )
                        }
                    />

                    <Field name="phone">
                        {({ field, form }) => (
                            <FieldWrapper
                                label="Phone"
                                description="Only visible to your match opponents"
                                field={field}
                                form={form}
                            >
                                <IMaskInput
                                    mask="000-000-0000"
                                    value={field.value}
                                    unmask
                                    onAccept={(value, mask) => {
                                        form.setFieldValue(field.name, value);
                                    }}
                                    name="phone"
                                    className={classnames('form-control form-control-solid', {
                                        'is-invalid': form.errors[field.name] && form.submitCount > 0,
                                    })}
                                    inputMode="numeric"
                                />
                            </FieldWrapper>
                        )}
                    </Field>

                    <Field name="password" label="Password" component={PasswordInput} />

                    <Field
                        name="birthday"
                        description="Not visible to anyone — only used for age restrictions."
                        label="Birth date"
                        component={Birthday}
                    />

                    <Button className="mt-4 btn btn-lg btn-primary w-100" isSubmitting={isSubmitting}>
                        Submit
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

RegisterForm.defaultProps = {
    showComeFrom: true,
};

export default RegisterForm;
