import { Formik, Field, Form } from '@rival/common/components/formik';
import Textarea from '@rival/common/components/formik/Textarea';

type JoinPlayerPoolFormProps = {
    onSubmit: (...args: unknown[]) => unknown;
    initialValues: object;
    showWarning: boolean;
};

const JoinPlayerPoolForm = (props: JoinPlayerPoolFormProps) => {
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

JoinPlayerPoolForm.defaultProps = {
    initialValues: { partnerInfo: '' },
    showWarning: true,
};

export default JoinPlayerPoolForm;
