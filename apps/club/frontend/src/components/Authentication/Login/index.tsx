import { useDispatch } from 'react-redux';
import { Link, useHistory } from 'react-router-dom';
import { authenticate } from '@/reducers/auth';
import { Formik, Field, Form } from '@rival/common/components/formik';
import Input from '@rival/common/components/formik/Input';
import PasswordInput from '@rival/common/components/formik/PasswordInput';
import Button from '@rival/common/components/Button';

type LoginProps = {
    goToRegister: (...args: unknown[]) => unknown;
    onSubmit: (...args: unknown[]) => unknown;
};

const Login = (props: LoginProps) => {
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
                                    goToRegister();
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
                    <Button className="mt-4 btn btn-lg btn-primary w-100" isSubmitting={isSubmitting}>
                        Sign in
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export default Login;
