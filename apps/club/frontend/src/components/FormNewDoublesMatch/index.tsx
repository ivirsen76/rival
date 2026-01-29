import { useState, useMemo, useEffect } from 'react';
import { Formik, Form } from '@/components/formik';
import { useSelector } from 'react-redux';
import Button from '@rival/common/components/Button';
import FormMatch from '@/components/FormMatch';
import PlayerName from '@/components/PlayerName';
import PlayerAvatar from '@/components/PlayerAvatar';
import CloseIcon from '@rival/common/metronic/icons/duotone/Navigation/Close.svg?react';
import hasAnyRole from '@rival/common/utils/hasAnyRole';
import style from './style.module.scss';

type JustFormProps = {
    values: object;
    players: object;
    playerOptions: unknown[];
    setFieldValue: (...args: unknown[]) => unknown;
    isAdmin: boolean;
};

const JustForm = (props: JustFormProps) => {
    const { values, players, playerOptions, setFieldValue, isAdmin } = props;

    const getPlayerPicker = (name) => () => {
        if (!values[name]) {
            return;
        }

        ['challengerId', 'challenger2Id', 'acceptorId', 'acceptor2Id'].forEach((field) => {
            if (field === name) {
                return;
            }

            if (values[field] === values[name]) {
                setFieldValue(field, 0);
            }
        });
    };
    useEffect(getPlayerPicker('challengerId'), [values.challengerId]);
    useEffect(getPlayerPicker('challenger2Id'), [values.challenger2Id]);
    useEffect(getPlayerPicker('acceptorId'), [values.acceptorId]);
    useEffect(getPlayerPicker('acceptor2Id'), [values.acceptor2Id]);

    const renderSlot = (name, label) => {
        if (values[name]) {
            return (
                <div>
                    <PlayerName player1={players[values[name]]} isShort />
                    <span
                        className={style.close + ' svg-icon svg-icon-3 svg-icon-danger'}
                        onClick={() => {
                            setFieldValue(name, 0);
                        }}
                        data-remove-player={name}
                    >
                        <CloseIcon />
                    </span>
                </div>
            );
        }

        return (
            <div className={style.picker}>
                <select className={style.placeholder + ' form-select form-select-solid'}>
                    <option>Pick {label}</option>
                </select>
                <select
                    className={style.select + ' form-select form-select-solid'}
                    onChange={(event) => setFieldValue(name, Number(event.target.value))}
                    name={name}
                    {...{ [`data-${name.toLowerCase()}`]: true }}
                >
                    <option value={0}>Pick {label}</option>
                    {playerOptions.map((player) => (
                        <option key={player.value} value={player.value}>
                            {player.label}
                        </option>
                    ))}
                </select>
            </div>
        );
    };

    return (
        <div className="mb-6">
            <label className="form-label">Players</label>
            {!isAdmin && <div className={style.description}>You have to be one of the players.</div>}
            <div className={style.team}>
                <PlayerAvatar
                    player1={players[values.challengerId] || {}}
                    player2={players[values.challenger2Id] || {}}
                    className="me-2"
                />
                {renderSlot('challengerId', 'Proposer')}
                <div className={style.separator}>/</div>
                {renderSlot('challenger2Id', 'Partner')}
            </div>
            <div className={style.team}>
                <PlayerAvatar
                    player1={players[values.acceptorId] || {}}
                    player2={players[values.acceptor2Id] || {}}
                    className="me-2"
                />
                {renderSlot('acceptorId', 'Opponent 1')}
                <div className={style.separator}>/</div>
                {renderSlot('acceptor2Id', 'Opponent 2')}
            </div>
        </div>
    );
};

type FormNewMatchProps = {
    tournament: object;
    onAdd: (...args: unknown[]) => unknown;
};

const FormNewMatch = (props: FormNewMatchProps) => {
    const { tournament, onAdd } = props;

    const [matchValues, setMatchValues] = useState();
    const [playedAt, setPlayedAt] = useState();

    const currentUser = useSelector((state) => state.auth.user);
    const isAdmin = hasAnyRole(currentUser, ['admin', 'manager']);

    const currentPlayerId = useMemo(() => {
        if (isAdmin) {
            return 0;
        }

        return Object.values(tournament.players).find((item) => item.userId === currentUser.id).id;
    }, [tournament.players, currentUser]);

    const playerOptions = useMemo(() => {
        return [
            ...Object.values(tournament.players)
                .filter((item) => item.isActive)
                .map((item) => ({ value: item.id, label: `${item.firstName} ${item.lastName}` }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        ];
    }, [tournament.players]);

    const onSubmit = (values) => {
        setMatchValues(values);
        setPlayedAt('2021-05-03 17:50:47');
    };

    const match = {
        ...matchValues,
        ...(matchValues && {
            challengerRank: tournament.players[matchValues.challengerId].stats.rank,
            challenger2Rank: tournament.players[matchValues.challenger2Id].stats.rank,
            acceptorRank: tournament.players[matchValues.acceptorId].stats.rank,
            acceptor2Rank: tournament.players[matchValues.acceptor2Id].stats.rank,
        }),
        playedAt,
        type: 'regular',
    };

    return matchValues ? (
        <FormMatch tournament={tournament} match={match} onUpdate={onAdd} />
    ) : (
        <Formik
            initialValues={{ challengerId: currentPlayerId, challenger2Id: 0, acceptorId: 0, acceptor2Id: 0 }}
            onSubmit={onSubmit}
        >
            {({ setFieldValue, values }) => {
                const isMyMatch = [
                    values.challengerId,
                    values.challenger2Id,
                    values.acceptorId,
                    values.acceptor2Id,
                ].includes(currentPlayerId);

                return (
                    <Form noValidate>
                        <JustForm
                            values={values}
                            players={tournament.players}
                            playerOptions={playerOptions}
                            setFieldValue={setFieldValue}
                            isAdmin={isAdmin}
                        />
                        <Button
                            disabled={
                                (!isAdmin && !isMyMatch) ||
                                !values.challengerId ||
                                !values.challenger2Id ||
                                !values.acceptorId ||
                                !values.acceptor2Id
                            }
                        >
                            Next
                        </Button>
                    </Form>
                );
            }}
        </Formik>
    );
};

export default FormNewMatch;
