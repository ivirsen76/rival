import PlayerName from '@/components/PlayerName';
import PlayerAvatar from '@/components/PlayerAvatar';
import Button from '@rival/packages/components/Button';
import { Formik, Form } from '@/components/formik';
import classnames from 'classnames';
import style from './style.module.scss';

type PickPlayersFormProps = {
    match: object;
    players: object;
    isScheduling: boolean;
    onSubmit: (...args: unknown[]) => unknown;
};

const PickPlayersForm = (props: PickPlayersFormProps) => {
    const { match, players, isScheduling } = props;

    const challenger = players[match.challengerId];
    const acceptor = players[match.acceptorId];

    const onSubmit = (values) => {
        const challengers = values.challengers.filter(Boolean);
        const acceptors = values.acceptors.filter(Boolean);

        const matchValues = {
            challengerId: challengers[0],
            challenger2Id: challengers[1],
            acceptorId: acceptors[0],
            acceptor2Id: acceptors[1],
        };

        props.onSubmit(matchValues);
    };

    const getInitialValues = () => {
        const values = {
            challengers: [null, null, null],
            acceptors: [null, null, null],
        };

        if (challenger.partnerIds.length === 2) {
            values.challengers[0] = challenger.partnerIds[0];
            values.challengers[1] = challenger.partnerIds[1];
        }

        if (acceptor.partnerIds.length === 2) {
            values.acceptors[0] = acceptor.partnerIds[0];
            values.acceptors[1] = acceptor.partnerIds[1];
        }

        return values;
    };

    const isValuesValid = (values) => {
        return values.challengers.filter(Boolean).length === 2 && values.acceptors.filter(Boolean).length === 2;
    };

    const renderTeammates = (player, setFieldValue, values, key) => {
        if (player.partners.length < 3) {
            return null;
        }

        return (
            <div>
                <div>
                    <PlayerName player1={player} />:
                </div>
                <div className={style.team}>
                    {player.partners.map((partner, index) => {
                        const selected = values[key][index] === partner.id;
                        return (
                            <button
                                key={partner.id}
                                type="button"
                                className={classnames(
                                    'btn btn-sm',
                                    style.partner,
                                    selected ? 'btn-primary' : 'btn-secondary'
                                )}
                                onClick={() => {
                                    const newValue = [...values[key]];
                                    newValue[index] = selected ? null : partner.id;
                                    setFieldValue(key, newValue);
                                }}
                            >
                                <div className="fs-4">
                                    <PlayerAvatar player1={partner} />
                                </div>
                                <PlayerName player1={partner} />
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <Formik initialValues={getInitialValues()} onSubmit={onSubmit}>
            {({ setFieldValue, values }) => (
                <Form noValidate>
                    <div className="fw-bold mb-6">
                        {isScheduling
                            ? 'Pick two players who will play the match'
                            : 'Pick two players who played the match'}
                    </div>
                    <div className="d-grid gap-6">
                        {renderTeammates(challenger, setFieldValue, values, 'challengers')}
                        {renderTeammates(acceptor, setFieldValue, values, 'acceptors')}
                    </div>

                    <div className="mt-8">
                        <Button disabled={!isValuesValid(values)}>Next</Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default PickPlayersForm;
