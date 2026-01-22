import { Formik, Field, Form } from '@/components/formik';
import Button from '@/components/Button';
import axios from '@/utils/axios';
import { useSelector } from 'react-redux';
import DoublesPlayersPicker from '@/components/formik/DoublesPlayersPicker';

type FormReplaceCaptainProps = {
    hide: (...args: unknown[]) => unknown;
    onSubmit: (...args: unknown[]) => unknown;
    tournament: object;
};

const FormReplaceCaptain = (props: FormReplaceCaptainProps) => {
    const { tournament, hide, onSubmit } = props;
    const currentUser = useSelector((state) => state.auth.user);
    const currentPlayerId = currentUser.tournaments[tournament.id].playerId;
    const currentPlayer = tournament.players[currentPlayerId];

    const needPickPlayer = currentPlayer.partners.length > 2;
    const anotherPartner = currentPlayer.partners[1];

    return (
        <Formik
            initialValues={{ players: needPickPlayer ? [currentPlayerId] : currentPlayer.partnerIds }}
            onSubmit={async (values) => {
                await axios.put(`/api/players/${currentPlayerId}`, {
                    action: 'replaceCaptain',
                    captainId: values.players[1],
                });
                await onSubmit();
            }}
        >
            {({ isSubmitting, values }) => (
                <Form noValidate>
                    {needPickPlayer ? (
                        <Field
                            name="players"
                            label="Pick who is going to be the new Team Captain:"
                            component={DoublesPlayersPicker}
                            partners={currentPlayer.partners}
                        />
                    ) : (
                        <div className="mb-6">
                            Are you sure you want to make{' '}
                            <b>
                                {anotherPartner.firstName} {anotherPartner.lastName}
                            </b>{' '}
                            the Team Captain?
                        </div>
                    )}
                    <Button isSubmitting={isSubmitting} disabled={values.players.length < 2}>
                        {needPickPlayer ? 'Submit' : 'Yes'}
                    </Button>
                    {!needPickPlayer && (
                        <button className="btn btn-secondary ms-2" type="button" onClick={hide}>
                            Cancel
                        </button>
                    )}
                </Form>
            )}
        </Formik>
    );
};

export default FormReplaceCaptain;
