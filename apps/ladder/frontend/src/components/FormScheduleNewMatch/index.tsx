import { useState, useMemo, useEffect } from 'react';
import { Formik, Field, Form } from '@/components/formik';
import { useSelector } from 'react-redux';
import Select from '@/components/formik/Select';
import Button from '@rival/packages/components/Button';
import FormScheduleMatch from '@/components/FormScheduleMatch';
import FormPickDoublesPlayers from '@/components/FormPickDoublesPlayers';
import getPlayersName from '@/utils/getPlayersName';
import hasAnyRole from '@rival/packages/utils/hasAnyRole';

type JustFormProps = {
    values: object;
    players: unknown[];
    setFieldValue: (...args: unknown[]) => unknown;
    currentPlayerId: number;
};

const JustForm = (props: JustFormProps) => {
    const { values, players, setFieldValue, currentPlayerId } = props;

    useEffect(() => {
        if (!currentPlayerId) {
            return;
        }
        if (values.challengerId !== 0 && values.challengerId !== currentPlayerId) {
            setFieldValue('acceptorId', currentPlayerId);
        }
    }, [values.challengerId]);

    useEffect(() => {
        if (!currentPlayerId) {
            return;
        }
        if (values.acceptorId !== 0 && values.acceptorId !== currentPlayerId) {
            setFieldValue('challengerId', currentPlayerId);
        }
    }, [values.acceptorId]);

    return (
        <>
            <Field name="challengerId" label="Challenger" options={players} component={Select} />
            <Field name="acceptorId" label="Opponent" options={players} component={Select} />
        </>
    );
};

type FormScheduleNewNewMatchProps = {
    tournament: object;
    onAdd: (...args: unknown[]) => unknown;
};

const FormScheduleNewNewMatch = (props: FormScheduleNewNewMatchProps) => {
    const { tournament, onAdd } = props;
    const [match, setMatch] = useState({ id: 0, type: 'regular' });
    const currentUser = useSelector((state) => state.auth.user);
    const isDoublesTeam = tournament.levelType === 'doubles-team';
    const isAdmin = hasAnyRole(currentUser, ['admin', 'manager']);
    const currentPlayerId = (() => {
        if (isAdmin) {
            return null;
        }

        const currentPlayer = currentUser.tournaments[tournament.id];
        return currentPlayer.partnerId || currentPlayer.playerId;
    })();

    const players = useMemo(() => {
        return [
            { value: 0, label: isDoublesTeam ? '-- Select the team --' : '-- Select the player --' },
            ...Object.values(tournament.players)
                .filter((item) => {
                    if (!item.isActive) {
                        return false;
                    }
                    if (item.hidden) {
                        return false;
                    }
                    if (item.partners?.length < 2) {
                        return false;
                    }

                    return true;
                })
                .map((item) => ({ value: item.id, label: item.teamName || getPlayersName(item) }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        ];
    }, [tournament.players]);

    const onSubmit = (values) => {
        const newMatch = { ...match, ...values };

        if (isDoublesTeam) {
            const challenger = tournament.players[values.challengerId];
            if (challenger.partnerIds.length === 2) {
                newMatch.challengerId = challenger.partnerIds[0];
                newMatch.challenger2Id = challenger.partnerIds[1];
            }

            const acceptor = tournament.players[values.acceptorId];
            if (acceptor.partnerIds.length === 2) {
                newMatch.acceptorId = acceptor.partnerIds[0];
                newMatch.acceptor2Id = acceptor.partnerIds[1];
            }
        }

        setMatch(newMatch);
    };

    const warning =
        tournament.levelType === 'doubles-team'
            ? 'Schedule a match both teams have already arranged to see it in your upcoming matches.'
            : 'Schedule a match you and your opponent have already arranged to see it in your upcoming matches.';

    const needPickPlayers = (() => {
        if (!isDoublesTeam || !match.challengerId || !match.acceptorId) {
            return false;
        }
        return !match.challenger2Id || !match.acceptor2Id;
    })();

    return needPickPlayers ? (
        <FormPickDoublesPlayers
            match={match}
            players={tournament.players}
            onSubmit={(values) => {
                setMatch({ ...match, ...values });
            }}
            isScheduling
        />
    ) : match.challengerId && match.acceptorId ? (
        <FormScheduleMatch match={match} tournament={tournament} onSubmit={onAdd} />
    ) : (
        <Formik initialValues={{ challengerId: 0, acceptorId: 0 }} onSubmit={onSubmit}>
            {({ setFieldValue, values }) => (
                <Form noValidate>
                    {!isAdmin && <div className="alert alert-warning mb-6">{warning}</div>}
                    <JustForm
                        values={values}
                        players={players}
                        setFieldValue={setFieldValue}
                        currentPlayerId={currentPlayerId}
                    />
                    <Button
                        disabled={
                            !values.challengerId || !values.acceptorId || values.challengerId === values.acceptorId
                        }
                    >
                        Next
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export default FormScheduleNewNewMatch;
