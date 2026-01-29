import { useState, useMemo, useEffect } from 'react';
import { Formik, Field, Form } from '@/components/formik';
import { useSelector } from 'react-redux';
import Select from '@/components/formik/Select';
import Button from '@/components/Button';
import FormMatch from '@/components/FormMatch';
import userIcon from '@/assets/user.svg';
import QuestionIcon from '@/styles/metronic/icons/duotone/Navigation/Question.svg?react';
import Tooltip from '@rival/packages/components/Tooltip';
import getPossibleOpponents from './getPossibleOpponents';
import getPlayersName from '@/utils/getPlayersName';
import style from './style.module.scss';

type JustFormProps = {
    values: object;
    players: unknown[];
    setFieldValue: (...args: unknown[]) => unknown;
    currentPlayerId: number;
};

const JustForm = (props: JustFormProps) => {
    const { values, players, setFieldValue, currentPlayerId } = props;

    useEffect(() => {
        if (values.challengerId !== 0 && values.challengerId !== currentPlayerId) {
            setFieldValue('acceptorId', currentPlayerId);
        }
    }, [values.challengerId]);

    useEffect(() => {
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

type FormNewMatchProps = {
    tournament: object;
    onAdd: (...args: unknown[]) => unknown;
    possibleMatches: unknown[];
};

const FormNewMatch = (props: FormNewMatchProps) => {
    const { tournament, onAdd, possibleMatches } = props;

    const [showPossibleOpponents, setShowPossibleOpponents] = useState(true);
    const [challenger, setChallenger] = useState();
    const [acceptor, setAcceptor] = useState();
    const [playedAt, setPlayedAt] = useState();
    const [matchId, setMatchId] = useState(null);

    const currentUser = useSelector((state) => state.auth.user);
    const isDoublesTeam = tournament.levelType === 'doubles-team';

    const currentPlayerId = useMemo(() => {
        const player = Object.values(tournament.players).find((item) => item.userId === currentUser.id);
        return player.partnerIds?.[0] || player.id;
    }, [tournament.players, currentUser]);

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

    const possibleOpponents = useMemo(() => {
        return getPossibleOpponents(possibleMatches, currentPlayerId);
    }, [possibleMatches, currentPlayerId]);

    const onSubmit = (values) => {
        setChallenger(tournament.players[values.challengerId]);
        setAcceptor(tournament.players[values.acceptorId]);
        setPlayedAt('2021-05-03 17:50:47');
    };

    const match = {
        id: matchId,
        challengerId: challenger && challenger.id,
        acceptorId: acceptor && acceptor.id,
        challengerRank: challenger && challenger.stats.rank,
        acceptorRank: acceptor && acceptor.stats.rank,
        playedAt,
        type: 'regular',
    };

    if (showPossibleOpponents && possibleOpponents.length > 0) {
        return (
            <>
                <p className="form-label">
                    Who did you play?
                    <Tooltip content="Listed players are based on existing proposals.">
                        <span className="svg-icon svg-icon-dark ms-2">
                            <QuestionIcon />
                        </span>
                    </Tooltip>
                </p>
                <div className={style.wrapper}>
                    {possibleOpponents.map((match1) => {
                        const challenger1 = tournament.players[match1.challengerId];
                        const acceptor1 = tournament.players[match1.acceptorId];
                        const opponent = currentUser.id === challenger1.userId ? acceptor1 : challenger1;

                        return (
                            <button
                                key={opponent.id}
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setChallenger(challenger1);
                                    setAcceptor(acceptor1);
                                    setPlayedAt(match1.playedAt);
                                    setMatchId(match1.id);
                                    setShowPossibleOpponents(false);
                                }}
                            >
                                <img src={opponent.avatar || userIcon} alt="" className={style.avatar + ' mb-2'} />
                                <div className={style.long}>
                                    {opponent.firstName}
                                    <br />
                                    {opponent.lastName}
                                </div>
                            </button>
                        );
                    })}
                    <button type="button" className="btn btn-secondary" onClick={() => setShowPossibleOpponents(false)}>
                        Another
                        <br />
                        player
                    </button>
                </div>
            </>
        );
    }

    return challenger && acceptor ? (
        <FormMatch tournament={tournament} match={match} onUpdate={onAdd} />
    ) : (
        <Formik initialValues={{ challengerId: 0, acceptorId: 0 }} onSubmit={onSubmit}>
            {({ setFieldValue, values }) => (
                <Form noValidate>
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

FormNewMatch.defaultProps = {
    possibleMatches: [],
};

export default FormNewMatch;
