import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import Button from '@rival/packages/components/Button';
import notification from '@/components/notification';
import Card from '@rival/packages/components/Card';
import { useHistory } from 'react-router-dom';
import axios from '@/utils/axios';

const Logout = (props) => {
    const history = useHistory();

    return (
        <Card className="w-lg-500px mx-auto">
            <Formik
                initialValues={{ email: '' }}
                onSubmit={async (values) => {
                    await axios.post('/api/passwords', { email: values.email });
                    notification({
                        inModal: true,
                        message: "We've just sent you an email to reset your password.",
                        onHide: () => history.push('/login'),
                    });
                }}
            >
                {({ isSubmitting }) => (
                    <Form noValidate>
                        <div className="text-center mb-10">
                            <h1 className="mb-3">Forgot Password?</h1>
                            <div className="text-gray-400 fw-semibold fs-4 lh-sm">
                                Please enter your email address. We will send you an email to reset your password.
                            </div>
                        </div>

                        <Field name="email" label="Email" type="email" component={Input} autoFocus />

                        <Button className="mt-4 btn btn-lg btn-primary w-100" isSubmitting={isSubmitting}>
                            Send Email
                        </Button>
                    </Form>
                )}
            </Formik>
        </Card>
    );
};

export default Logout;
