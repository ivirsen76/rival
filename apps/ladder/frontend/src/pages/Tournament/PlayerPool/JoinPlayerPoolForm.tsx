import PropTypes from 'prop-types';
import { Formik, Field, Form } from '@/components/formik';
import Textarea from '@/components/formik/Textarea';

const JoinPlayerPoolForm = props => {
    const { onSubmit, initialValues, showWarning } = props;

    return (
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
            {() => (
                <Form noValidate>
                    {showWarning && (
                        <div className="alert alert-primary mb-8">
                            You are joining the Player Pool and disbanding your current Team. Any Team Captain will be
                            able to add you to their Team.
                        </div>
                    )}
                    <Field
                        name="partnerInfo"
                        label="Additional Information"
                        description="Your level, play availability, preferred location, etc."
                        component={Textarea}
                        maxLength={200}
                    />

                    <div className="mt-8">
                        <button type="submit" className="btn btn-primary">
                            Submit
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

JoinPlayerPoolForm.propTypes = {
    onSubmit: PropTypes.func,
    initialValues: PropTypes.object,
    showWarning: PropTypes.bool,
};

JoinPlayerPoolForm.defaultProps = {
    initialValues: { partnerInfo: '' },
    showWarning: true,
};

export default JoinPlayerPoolForm;
