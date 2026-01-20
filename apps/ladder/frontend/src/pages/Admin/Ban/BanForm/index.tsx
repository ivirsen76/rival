import PropTypes from 'prop-types';
import { Formik, Field, Form } from '@/components/formik';
import UserPicker from '@/components/formik/UserPicker';
import Input from '@/components/formik/Input';
import Select from '@/components/formik/Select';
import Button from '@/components/Button';

export const banDurationOptions = [
    { value: 1, label: '1 day' },
    { value: 3, label: '3 days' },
    { value: 7, label: '1 week' },
    { value: 14, label: '2 weeks' },
    { value: 30, label: '1 month' },
    { value: 30 * 3, label: '3 months' },
    { value: 30 * 6, label: '6 months' },
    { value: 365, label: '1 year' },
    { value: 9999, label: 'Forever' },
];

const BanForm = (props) => {
    const { onSubmit, list } = props;

    const getDisabledUsers = (value) => {
        const result = new Set();
        for (const player of list) {
            result.add(player.id);
        }

        return result;
    };

    return (
        <Formik initialValues={{ user: null }} onSubmit={onSubmit}>
            {({ isSubmitting, values }) => (
                <Form noValidate>
                    <Field name="user" label="User" component={UserPicker} getDisabledUsers={getDisabledUsers} />
                    <Field name="reason" label="Reason" description="Visible to the player" component={Input} />
                    <Field
                        name="duration"
                        label="Ban period"
                        component={Select}
                        options={[{ value: 0, label: '-- Choose --' }, ...banDurationOptions]}
                        style={{ width: 'auto' }}
                    />
                    <Button isSubmitting={isSubmitting}>Submit</Button>
                </Form>
            )}
        </Formik>
    );
};

BanForm.propTypes = {
    list: PropTypes.array,
    onSubmit: PropTypes.func,
};

export default BanForm;
