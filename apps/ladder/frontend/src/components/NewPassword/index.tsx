import { useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Formik, Field, Form } from '@/components/formik';
import PasswordInput from '@/components/formik/PasswordInput';
import Button from '@/components/Button';
import Card from '@/components/Card';
import notification from '@/components/notification';
import axios from '@/utils/axios';
import { logout } from '@/reducers/auth';
import { useDispatch } from 'react-redux';

type NewPasswordProps = {
    payload: string;
};

const NewPassword = (props: NewPasswordProps) => {
    const dispatch = useDispatch();
    const history = useHistory();

    useEffect(() => {
        dispatch(logout());
    }, []);

    return (
        <Card className="w-lg-500px mx-auto">
            <Formik
                initialValues={{
                    password: '',
                    action: props.payload,
                }}
                onSubmit={async (values) => {
                    await axios.put('/api/passwords/0', values);
                    notification({
                        inModal: true,
                        message: (
                            <div>
                                The password was successfully changed.
                                <br />
                                You can sign in now.
                            </div>
                        ),
                        onHide: () => history.push('/login'),
                        buttonTitle: 'Go to login',
                    });
                }}
            >
                {({ isSubmitting }) => (
                    <Form noValidate>
                        <div className="text-center mb-10">
                            <h1 className="mb-3">Setup New Password</h1>
                            <div className="text-gray-400 fw-semibold fs-4">
                                Already have reset your password?{' '}
                                <Link to="/login" className="link-primary fw-bold">
                                    Sign in here
                                </Link>
                            </div>
                        </div>

                        <Field name="password" label="Password" component={PasswordInput} autoFocus />

                        <Button className="mt-4 btn btn-lg btn-primary w-100" isSubmitting={isSubmitting}>
                            Submit
                        </Button>
                    </Form>
                )}
            </Formik>
        </Card>
    );
};

export default NewPassword;
