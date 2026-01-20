import PropTypes from 'prop-types';
import Button from '@/components/Button';
import Birthday from '@/components/formik/Birthday';
import { Formik, Field, Form } from '@/components/formik';
import convertDate from '@/utils/convertDate';
import { updateCurrentUser } from '@/reducers/auth';

const FormBirthday = props => {
    return (
        <Formik
            initialValues={{ birthday: '' }}
            onSubmit={async values => {
                await window.tl.store.dispatch(updateCurrentUser({ birthday: convertDate(values.birthday) }));
                await props.onSubmit();
            }}
        >
            {({ isSubmitting }) => (
                <Form noValidate>
                    <Field name="birthday" label="Birth Date" component={Birthday} />

                    <div className="mt-8 d-flex gap-2">
                        <Button isSubmitting={isSubmitting}>Submit</Button>
                        {props.onCancel ? (
                            <button className="btn btn-secondary" type="button" onClick={props.onCancel}>
                                Cancel
                            </button>
                        ) : null}
                    </div>
                </Form>
            )}
        </Formik>
    );
};

FormBirthday.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
};

export default FormBirthday;
