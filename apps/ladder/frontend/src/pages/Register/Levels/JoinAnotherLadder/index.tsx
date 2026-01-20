import PropTypes from 'prop-types';
import { Formik, Field } from '@/components/formik';
import Textarea from '@/components/formik/Textarea';

const JoinAnotherLadder = (props) => {
    const { initialReason, onSubmit } = props;

    const validate = (values) => {
        const errors = {};

        if (!values.reason) {
            errors.reason = 'The reason is required.';
        }

        return errors;
    };

    return (
        <Formik
            initialValues={{ reason: initialReason || '' }}
            validate={validate}
            onSubmit={(values) => {
                onSubmit(values.reason);
            }}
        >
            {({ handleSubmit }) => {
                return (
                    <div>
                        <div className="alert alert-primary">
                            <p>You must have a strong reason to join another ladder. Possible reasons could be:</p>
                            <ul className="ps-8 mb-0">
                                <li className="m-0">You were injured and your level dropped significantly.</li>
                                <li className="m-0">
                                    You are a woman and would like to play a Men&apos;s ladder for more competition.
                                </li>
                            </ul>
                        </div>
                        <Field
                            name="reason"
                            label="Describe why you'd like to join another ladder"
                            component={Textarea}
                            style={{ minHeight: '8rem' }}
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary" onClick={handleSubmit}>
                            Submit
                        </button>
                    </div>
                );
            }}
        </Formik>
    );
};

JoinAnotherLadder.propTypes = {
    initialReason: PropTypes.string,
    onSubmit: PropTypes.func,
};

export default JoinAnotherLadder;
