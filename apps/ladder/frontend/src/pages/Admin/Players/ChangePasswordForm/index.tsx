import { Formik, Field, Form } from '@/components/formik';
import PasswordInput from '@/components/formik/PasswordInput';
import Button from '@/components/Button';

type ChangePasswordFormProps = {
    onSubmit: (...args: unknown[]) => unknown;
};

const ChangePasswordForm = (props: ChangePasswordFormProps) => {
    return (
        <Formik
            initialValues={{
                password: '',
            }}
            onSubmit={props.onSubmit}
        >
            {({ isSubmitting }) => (
                <Form noValidate>
                    <Field name="password" label="New password" component={PasswordInput} autoFocus />

                    <Button className="btn btn-primary" isSubmitting={isSubmitting}>
                        Submit
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export default ChangePasswordForm;
