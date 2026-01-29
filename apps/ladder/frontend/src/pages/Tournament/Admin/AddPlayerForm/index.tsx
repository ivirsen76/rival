import { Formik, Field, Form } from '@/components/formik';
import UserPicker from '@/components/formik/UserPicker';
import Button from '@rival/common/components/Button';

type AddPlayerFormProps = {
    sortedPlayers: unknown[];
    onSubmit: (...args: unknown[]) => unknown;
};

const AddPlayerForm = (props: AddPlayerFormProps) => {
    const { sortedPlayers, onSubmit } = props;

    const getDisabledUsers = (values) => {
        const result = values.reduce((set, user) => {
            set.add(user.id);
            return set;
        }, new Set());

        for (const player of sortedPlayers) {
            result.add(player.userId);
        }

        return result;
    };

    return (
        <Formik initialValues={{ users: [] }} onSubmit={onSubmit}>
            {({ isSubmitting, values }) => (
                <Form noValidate>
                    <Field
                        name="users"
                        label="Players"
                        component={UserPicker}
                        multiple
                        getDisabledUsers={getDisabledUsers}
                    />
                    <Button isSubmitting={isSubmitting}>Submit</Button>
                </Form>
            )}
        </Formik>
    );
};

export default AddPlayerForm;
