import { useCallback } from 'react';
import { Formik, Field, Form } from '@/components/formik';
import Autosave from '@rival/common/components/Autosave';
import Textarea from '@/components/formik/Textarea';
import { useQueryClient } from 'react-query';
import axios from '@/utils/axios';

type PersonalNoteFormProps = {
    user: object;
    hideDescription: boolean;
};

const PersonalNoteForm = (props: PersonalNoteFormProps) => {
    const { user, hideDescription } = props;
    const queryClient = useQueryClient();

    const save = useCallback(
        async (values) => {
            await axios.put('/api/users/0', { action: 'addPersonalNote', ...values });
            await queryClient.invalidateQueries(`/api/users/${user.slug}`);
        },
        [user]
    );

    return (
        <Formik initialValues={{ opponentId: user.id, note: user.note || '' }}>
            {({ values }) => (
                <Form noValidate>
                    <Field
                        name="note"
                        label=""
                        description={hideDescription ? null : 'Only you will be able to see these notes.'}
                        component={Textarea}
                        wrapperClassName=""
                        style={{ minHeight: '6rem' }}
                    />
                    <Autosave values={values} callback={save} />
                </Form>
            )}
        </Formik>
    );
};

export default PersonalNoteForm;
