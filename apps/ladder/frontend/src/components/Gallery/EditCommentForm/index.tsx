import { Formik, Field, Form } from '@/components/formik';
import Textarea from '@/components/formik/Textarea';
import Button from '@rival/packages/components/Button';
import { useQueryClient } from 'react-query';
import axios from 'axios';

type EditCommentFormProps = {
    commentId: number;
    slide: object;
    initialValues: object;
    onSubmit: (...args: unknown[]) => unknown;
};

const EditCommentForm = (props: EditCommentFormProps) => {
    const { commentId, slide, initialValues, onSubmit } = props;
    const queryClient = useQueryClient();

    return (
        <Formik
            initialValues={initialValues}
            onSubmit={async (values) => {
                await axios.patch(`/api/comments/${commentId}`, values);
                await queryClient.invalidateQueries(`getReactionsAndComments${slide.meta.id}`);
                await onSubmit();
            }}
        >
            {({ isSubmitting, handleSubmit }) => (
                <Form noValidate>
                    <Field
                        name="message"
                        component={Textarea}
                        rows="1"
                        onFocus={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            if (e.which === 13) {
                                e.preventDefault();
                                handleSubmit();
                            } else {
                                e.stopPropagation();
                            }
                        }}
                        autoFocus
                    />
                    <Button isSubmitting={isSubmitting}>Submit</Button>
                </Form>
            )}
        </Formik>
    );
};

EditCommentForm.defaultProps = {
    initialValues: {},
    onSubmit: () => {},
};

export default EditCommentForm;
