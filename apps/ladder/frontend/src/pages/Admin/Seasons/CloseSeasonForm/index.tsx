import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import Button from '@rival/packages/components/Button';

type CloseSeasonFormProps = {
    onSubmit: (...args: unknown[]) => unknown;
};

const CloseSeasonForm = (props: CloseSeasonFormProps) => {
    const { onSubmit } = props;

    return (
        <Formik initialValues={{ reason: '' }} onSubmit={onSubmit}>
            {({ isSubmitting }) => (
                <Form noValidate>
                    <p>
                        <strong>Warning!</strong>
                        <br />
                        The final tournament will be canceled as well.
                    </p>
                    <Field name="reason" label="Reason" description="Visible to players" component={Input} autoFocus />
                    <Button isSubmitting={isSubmitting}>Submit</Button>
                </Form>
            )}
        </Formik>
    );
};

export default CloseSeasonForm;
