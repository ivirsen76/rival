import { Formik, Field, Form } from '@rival/common/components/formik';
import Input from '@rival/common/components/formik/Input';
import Button from '@rival/common/components/Button';
import axios from '@rival/common/axios';
import notification from '@rival/common/components/notification';

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
