import Button from '@rival/common/components/Button';
import Birthday from '@rival/common/components/formik/Birthday';
import { Formik, Field, Form } from '@rival/common/components/formik';
import convertDate from '@rival/common/utils/convertDate';
import { updateCurrentUser } from '@/reducers/auth';

type FormBirthdayProps = {
    onSubmit: (...args: unknown[]) => unknown;
    onCancel: (...args: unknown[]) => unknown;
};

const FormBirthday = (props: FormBirthdayProps) => {
    return (
        <Formik
            initialValues={{ birthday: '' }}
            onSubmit={async (values) => {
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

export default FormBirthday;
