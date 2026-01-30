import { useDispatch } from 'react-redux';
import notification from '@rival/common/components/notification';
import Card from '@rival/common/components/Card';
import axios from '@rival/common/axios';
import { authenticate } from '@/reducers/auth';
import { useHistory } from 'react-router-dom';
import { Formik, Field, Form } from '@rival/common/components/formik';
import Input from '@rival/common/components/formik/Input';
import PasswordInput from '@rival/common/components/formik/PasswordInput';
import Button from '@rival/common/components/Button';

type RegisterPartnerProps = {
    payload: string;
};

const RegisterPartner = (props: RegisterPartnerProps) => {
    const history = useHistory();
    const dispatch = useDispatch();

    return (
        <Card className="tl-panel">
            <Formik
                initialValues={{
                    partnerName: '',
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    birthday: '1970-01-01',
                }}
                onSubmit={async (values) => {
                    await axios.put('/api/users/0', { ...values, action: 'registerPartner', payload: props.payload });
                    await dispatch(authenticate(values.email, values.password));

                    history.push('/partner');

                    notification({
                        inModal: true,
                        message: 'You are successfuly registered.',
                        buttonTitle: 'Go to Partner page',
                    });
                }}
            >
                {({ isSubmitting, values }) => (
                    <Form noValidate>
                        <h3 className="mb-6">Create a Partner Account</h3>

                        <Field
                            name="partnerName"
                            label="Partner Name"
                            description="Will be visible for new players"
                            type="text"
                            component={Input}
                        />

                        <div className="row">
                            <div className="col">
                                <Field name="firstName" label="First Name" type="text" component={Input} autoFocus />
                            </div>
                            <div className="col">
                                <Field name="lastName" label="Last Name" type="text" component={Input} />
                            </div>
                        </div>

                        <Field name="email" label="Email" type="email" component={Input} />
                        <Field name="password" label="Password" component={PasswordInput} />

                        <Button className="mt-4 btn btn-lg btn-primary w-100" isSubmitting={isSubmitting}>
                            Submit
                        </Button>
                    </Form>
                )}
            </Formik>
        </Card>
    );
};

export default RegisterPartner;
