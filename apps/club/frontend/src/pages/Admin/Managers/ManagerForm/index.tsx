import { Formik, Field, Form } from '@rival/common/components/formik';
import UserPicker from '@rival/common/components/formik/UserPicker';
import Button from '@rival/common/components/Button';

type ManagerFormProps = {
    list: unknown[];
    onSubmit: (...args: unknown[]) => unknown;
};

const ManagerForm = (props: ManagerFormProps) => {
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

export default ManagerForm;
