import { useMemo } from 'react';
import { Formik, Field, Form } from '@/components/formik';
import Select from '@/components/formik/Select';
import Button from '@rival/packages/components/Button';
import notification from '@/components/notification';
import axios from '@/utils/axios';

type FormReplacePlayersProps = {
    match: object;
    players: object;
    onSubmit: (...args: unknown[]) => unknown;
};

const FormReplacePlayers = (props: FormReplacePlayersProps) => {
    const { players, match } = props;

    const playersOptions = useMemo(() => {
        return [
            ...Object.values(players)
                .filter((item) => item.isActive)
                .map((item) => ({ value: item.id, label: `${item.firstName} ${item.lastName}` }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        ];
    }, [players]);

    const onSubmit = async (values) => {
        await axios.put(`/api/matches/${match.id}`, {
            action: 'replacePlayers',
            challengerId: values.challengerId,
            acceptorId: values.acceptorId,
        });

        notification({
            header: 'Success',
            message: 'The players have been changed.',
        });

        props.onSubmit();
    };

    return (
        <Formik
            initialValues={{ challengerId: match.challengerId || 0, acceptorId: match.acceptorId || 0 }}
            onSubmit={onSubmit}
        >
            {({ handleSubmit, setFieldValue, values }) => (
                <Form noValidate>
                    {match.challengerId && (
                        <Field name="challengerId" label="First player" options={playersOptions} component={Select} />
                    )}
                    {match.acceptorId && (
                        <Field name="acceptorId" label="Second player" options={playersOptions} component={Select} />
                    )}
                    <Button disabled={values.challengerId === values.acceptorId} onClick={handleSubmit}>
                        Submit
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export default FormReplacePlayers;
