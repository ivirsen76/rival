import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import Button from '@/components/Button';
import axios from '@/utils/axios';
import notification from '@/components/notification';

type FormDeleteMatchProps = {
    onSubmit: (...args: unknown[]) => unknown;
    match: object;
};

const FormDeleteMatch = (props: FormDeleteMatchProps) => {
    const { match } = props;

    const onSubmit = async (values) => {
        if (match.score) {
            await axios.put(`/api/matches/${match.id}`, { action: 'removeMatch', ...values });
        } else {
            await axios.put(`/api/matches/${match.id}`, { action: 'removeScheduledMatch', reason: values.reason });
        }

        await props.onSubmit();

        notification({
            header: 'Success',
            message: 'The match has been deleted.',
        });
    };

    return (
        <Formik initialValues={{ reason: '' }} onSubmit={onSubmit}>
            {({ isSubmitting, setFieldValue, values }) => (
                <Form noValidate>
                    <Field
                        name="reason"
                        label="Why are you deleting?"
                        description="Add an explanation, and we'll let your opponent know."
                        component={Input}
                        autoFocus
                    />
                    <Button isSubmitting={isSubmitting} className="btn btn-danger">
                        Delete match
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export default FormDeleteMatch;
