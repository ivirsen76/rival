import { Formik, Field, Form } from '@/components/formik';
import Button from '@/components/Button';
import notification from '@/components/notification';
import DoublesPlayersPicker from '@/components/formik/DoublesPlayersPicker';
import { useSelector } from 'react-redux';
import axios from '@/utils/axios';

type FormReplaceTeamPlayersProps = {
    match: object;
    players: object;
    onSubmit: (...args: unknown[]) => unknown;
};

const FormReplaceTeamPlayers = (props: FormReplaceTeamPlayersProps) => {
    const { match, players, onSubmit } = props;
    const currentUser = useSelector((state) => state.auth.user);
    const currentPlayer = Object.values(players).find((item) => item.userId === currentUser.id);

    const handleSubmit = async (values) => {
        await axios.put(`/api/matches/${match.id}`, { action: 'replaceTeammates', ...values });
        notification('Players have been replaced.');
        await onSubmit();
    };

    return (
        <Formik initialValues={{ players: [currentPlayer.id] }} onSubmit={handleSubmit}>
            {({ isSubmitting }) => (
                <Form noValidate>
                    <div className="alert alert-primary mb-6">
                        <b>Notice!</b> You&apos;re going to be the contact for this match.
                    </div>
                    <Field name="players" component={DoublesPlayersPicker} partners={currentPlayer.partners} />
                    <Button isSubmitting={isSubmitting}>Replace players</Button>
                </Form>
            )}
        </Formik>
    );
};

export default FormReplaceTeamPlayers;
