import { useSelector, useDispatch } from 'react-redux';
import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import Birthday from '@/components/formik/Birthday';
import { updateCurrentUser } from '@/reducers/auth';
import Button from '@rival/packages/components/Button';
import _pick from 'lodash/pick';
import Select from '@/components/formik/Select';
import Textarea from '@/components/formik/Textarea';
import Checkbox from '@/components/formik/Checkbox';
import convertDate from '@rival/packages/utils/convertDate';

export const genderOptions = [
    { value: '', label: '-- Choose --' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
];

type PersonalInfoFormProps = {
    onSubmit: (...args: unknown[]) => unknown;
};

const PersonalInfoForm = (props: PersonalInfoFormProps) => {
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();

    return (
        <Formik
            initialValues={_pick(user, ['firstName', 'lastName', 'gender', 'birthday', 'showAge', 'personalInfo'])}
            onSubmit={async (values) => {
                await dispatch(
                    updateCurrentUser({
                        ...values,
                        birthday: convertDate(values.birthday),
                    })
                );
                props.onSubmit && props.onSubmit();
            }}
        >
            {({ isSubmitting }) => (
                <Form noValidate>
                    <div className="row">
                        <div className="col">
                            <Field name="firstName" label="First name" component={Input} />
                        </div>
                        <div className="col">
                            <Field name="lastName" label="Last name" component={Input} />
                        </div>
                    </div>
                    <Field
                        name="gender"
                        label="Gender"
                        component={Select}
                        options={genderOptions}
                        style={{ width: 'auto' }}
                    />
                    <Field name="birthday" label="Birth date" component={Birthday} />
                    <Field name="showAge" label="Show my age on my profile" component={Checkbox} />
                    <Field name="personalInfo" label="About me" component={Textarea} style={{ minHeight: '10rem' }} />

                    <div className="mt-8">
                        <Button isSubmitting={isSubmitting}>Submit</Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default PersonalInfoForm;
