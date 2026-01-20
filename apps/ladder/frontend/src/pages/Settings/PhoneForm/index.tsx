import PropTypes from 'prop-types';
import { Formik, Field, Form } from '@/components/formik';
import FieldWrapper from '@/components/formik/FieldWrapper';
import Button from '@/components/Button';
import VerifyPhone from '@/components/VerifyPhone';
import notification from '@/components/notification';
import { useSelector, useDispatch } from 'react-redux';
import NotFound from '@/pages/NotFound';
import { setCurrentUser } from '@/reducers/auth';
import { IMaskInput } from 'react-imask';
import classnames from 'classnames';
import axios from '@/utils/axios';

const PhoneForm = props => {
    const currentUser = useSelector(state => state.auth.user);
    const dispatch = useDispatch();

    if (!currentUser) {
        return <NotFound />;
    }

    const validate = values => {
        const errors = {};

        if (!values.phone) {
            errors.phone = 'Phone is required.';
        } else if (values.phone === currentUser.phone) {
            errors.phone = "Your phone number hasn't changed.";
        } else if (!/^[1-9]\d{9}$/.test(values.phone)) {
            errors.phone = 'Phone number should contain exactly 10 digits.';
        }

        return errors;
    };

    return (
        <Formik
            initialValues={{ phone: '' }}
            validate={validate}
            onSubmit={async values => {
                await axios.put('/api/users/0', { action: 'validatePhone', phone: values.phone });
                props.onSubmit();

                notification({
                    inModal: true,
                    title: 'Verify your phone',
                    render: ({ hide }) => (
                        <VerifyPhone
                            phone={values.phone}
                            onSuccess={async () => {
                                hide();
                                notification("You've successfully changed your phone number.");
                                await dispatch(setCurrentUser({ user: { phone: values.phone } }));
                            }}
                        />
                    ),
                });
            }}
        >
            {({ isSubmitting }) => (
                <Form noValidate>
                    <Field name="phone">
                        {({ field, form }) => (
                            <FieldWrapper label="New phone number" field={field} form={form}>
                                <IMaskInput
                                    mask="000-000-0000"
                                    value={field.value}
                                    unmask
                                    onAccept={(value, mask) => {
                                        form.setFieldValue(field.name, value);
                                    }}
                                    name="phone"
                                    className={classnames('form-control form-control-solid', {
                                        'is-invalid': form.errors[field.name] && form.submitCount > 0,
                                    })}
                                    autoFocus
                                    inputMode="numeric"
                                />
                            </FieldWrapper>
                        )}
                    </Field>
                    <Button isSubmitting={isSubmitting}>Submit</Button>
                </Form>
            )}
        </Formik>
    );
};

PhoneForm.propTypes = {
    onSubmit: PropTypes.func,
};

export default PhoneForm;
