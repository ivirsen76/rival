import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import Button from '@rival/packages/components/Button';
import { useQueryClient } from 'react-query';
import axios from 'axios';

type EditPhotoFormProps = {
    slide: object;
    initialValues: object;
    onSubmit: (...args: unknown[]) => unknown;
};

const EditPhotoForm = (props: EditPhotoFormProps) => {
    const { slide, initialValues, onSubmit } = props;
    const queryClient = useQueryClient();

    return (
        <Formik
            initialValues={initialValues}
            onSubmit={async (values) => {
                await axios.patch(`/api/photos/${slide.meta.id}`, values);
                await queryClient.invalidateQueries(`getReactionsAndComments${slide.meta.id}`);
                await onSubmit();
            }}
        >
            {({ isSubmitting, dirty }) => (
                <Form noValidate>
                    <Field
                        name="title"
                        label="Describe photo"
                        component={Input}
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

EditPhotoForm.defaultProps = {
    initialValues: {},
    onSubmit: () => {},
};

export default EditPhotoForm;
