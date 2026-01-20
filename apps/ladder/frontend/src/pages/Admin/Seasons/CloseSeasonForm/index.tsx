import PropTypes from 'prop-types';
import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import Button from '@/components/Button';

const CloseSeasonForm = props => {
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

CloseSeasonForm.propTypes = {
    onSubmit: PropTypes.func,
};

export default CloseSeasonForm;
