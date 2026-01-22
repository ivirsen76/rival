import { Formik, Field, Form } from '@/components/formik';
import Textarea from '@/components/formik/Textarea';
import Button from '@/components/Button';
import notification from '@/components/notification';
import axios from 'axios';

type ReportCommentFormProps = {
    commentId?: number;
    onSubmit?: (...args: unknown[]) => unknown;
};

const ReportCommentForm = (props: ReportCommentFormProps) => {
    const { commentId, onSubmit } = props;

    return (
        <Formik
            initialValues={{ message: '' }}
            onSubmit={async (values) => {
                await axios.put(`/api/reports/${commentId}`, { action: 'reportAboutComment', ...values });
                await onSubmit();

                notification({
                    inModal: true,
                    title: 'Report Received',
                    message:
                        'Thank you for bringing this to our attention. We will take action, if necessary, and your report will stay anonymous.',
                });
            }}
        >
            {({ isSubmitting }) => (
                <Form noValidate>
                    <Field
                        name="message"
                        label="Let us know what's wrong with this comment."
                        component={Textarea}
                        onFocus={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        autoFocus
                    />
                    <Button isSubmitting={isSubmitting}>Submit</Button>
                </Form>
            )}
        </Formik>
    );
};

ReportCommentForm.defaultProps = {
    onSubmit: () => {},
};

export default ReportCommentForm;
