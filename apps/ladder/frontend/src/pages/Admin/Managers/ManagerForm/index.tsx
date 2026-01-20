import PropTypes from 'prop-types';
import { Formik, Field, Form } from '@/components/formik';
import UserPicker from '@/components/formik/UserPicker';
import Button from '@/components/Button';

const ManagerForm = (props) => {
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
                    <Button isSubmitting={isSubmitting}>Submit</Button>
                </Form>
            )}
        </Formik>
    );
};

ManagerForm.propTypes = {
    list: PropTypes.array,
    onSubmit: PropTypes.func,
};

export default ManagerForm;
