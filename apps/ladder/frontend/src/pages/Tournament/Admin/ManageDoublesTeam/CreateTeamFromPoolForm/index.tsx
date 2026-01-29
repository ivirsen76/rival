import { useMemo } from 'react';
import { Formik, Field, Form } from '@/components/formik';
import PlayerName from '@/components/PlayerName';
import PlayerAvatar from '@/components/PlayerAvatar';
import CheckboxArray from '@/components/formik/CheckboxArray';
import Button from '@rival/common/components/Button';
import TeamNamePicker, { getValidateTeamName } from '@/components/formik/TeamNamePicker';
import useConfig from '@/utils/useConfig';
import CaptainIcon from '@/assets/captain.svg?react';
import { Link } from 'react-router-dom';
import compareFields from '@rival/ladder.backend/src/utils/compareFields';
import axios from '@/utils/axios';
import style from './style.module.scss';

const validate = (values) => {
    const errors = {};

    if (values.players.length < 2 || values.players.length > 3) {
        errors.players = 'Team must include exactly 2 or 3 players';
    }

    return errors;
};

type CreateTeamFromPoolFormProps = {
    tournament: object;
    onSubmit: (...args: unknown[]) => unknown;
};

const CreateTeamFromPoolForm = (props: CreateTeamFromPoolFormProps) => {
    const { tournament, onSubmit } = props;
    const config = useConfig();

    const playerOptions = useMemo(() => {
        // TODO: use total matches including doubles instead of just ELO matches
        return Object.values(tournament.players)
            .filter((player) => player.isDoublesTeamPlayerPool)
            .sort(compareFields('firstName', 'lastName'))
            .map((player) => ({
                value: player.id,
                label: (
                    <>
                        <PlayerName player1={player} className="fw-semibold" />{' '}
                        <span className="text-muted">({player.elo.matches} matches)</span> -{' '}
                        <Link to={`/player/${player.userSlug}`}>Profile</Link>
                    </>
                ),
                description: player.partnerInfo,
            }));
    }, [tournament]);

    const createTeamFromPool = async (values) => {
        await axios.put(`/api/players/0`, { action: 'createTeamFromPool', ...values });
        await onSubmit();
    };

    if (playerOptions.length < 2) {
        return <div className="alert alert-danger mb-0">Not enough players in the Player Pool to create a team.</div>;
    }

    return (
        <Formik
            initialValues={{ teamName: '', players: [] }}
            onSubmit={createTeamFromPool}
            validate={validate}
            isInitialValid={false}
        >
            {({ isSubmitting, values, isValid }) => {
                return (
                    <Form noValidate>
                        <Field
                            name="teamName"
                            label="Come up with the team name or pick from the list below:"
                            component={TeamNamePicker}
                            tournamentId={tournament.id}
                            validate={getValidateTeamName(config)}
                        />
                        <Field
                            name="players"
                            label="Pick 2 or 3 players:"
                            description="The first one will be the Team Captain"
                            component={CheckboxArray}
                            options={playerOptions}
                            isBlockDescription
                        />
                        {isValid && (
                            <div className="mb-6">
                                <h3>Team &quot;{values.teamName}&quot;</h3>
                                <div>
                                    {values.players.map((playerId, index) => (
                                        <div key={playerId} className="d-flex align-items-center">
                                            <PlayerAvatar player1={tournament.players[playerId]} className="me-2" />
                                            <PlayerName player1={tournament.players[playerId]} />
                                            {index === 0 && <CaptainIcon className={style.captain} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button isSubmitting={isSubmitting}>Submit</Button>
                    </Form>
                );
            }}
        </Formik>
    );
};

export default CreateTeamFromPoolForm;
