import { Formik, Field, Form } from '@rival/common/components/formik';
import Input from '@rival/common/components/formik/Input';
import Select from '@rival/common/components/formik/Select';
import Button from '@rival/common/components/Button';

const typeOptions = [
    { value: 'single', label: 'Single' },
    { value: 'doubles', label: 'Doubles' },
    { value: 'doubles-team', label: 'Doubles Team' },
];

type LevelFormProps = {
    initialValues: object;
    onSubmit: (...args: unknown[]) => unknown;
    hideType: boolean;
};

const LevelForm = (props: LevelFormProps) => {
    const { initialValues, onSubmit, hideType } = props;

    return (
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
            {({ isSubmitting }) => (
                <Form noValidate>
                    <Field name="name" label="Name" component={Input} autoFocus />
                    {!hideType && (
                        <Field
                            name="type"
                            label="Single or Doubles?"
                            component={Select}
                            options={typeOptions}
                            style={{ width: 'auto' }}
                        />
                    )}
                    <Button isSubmitting={isSubmitting}>Submit</Button>
                </Form>
            )}
        </Formik>
    );
};

LevelForm.defaultProps = {
    initialValues: { name: '', type: 'single' },
};

export default LevelForm;
