import { useMemo, useEffect } from 'react';
import { Formik, Form } from '@/components/formik';
import Button from '@rival/packages/components/Button';
import PlayerName from '@/components/PlayerName';
import PlayerAvatar from '@/components/PlayerAvatar';
import notification from '@/components/notification';
import showLoader from '@rival/packages/utils/showLoader';
import { useSelector } from 'react-redux';
import CloseIcon from '@rival/packages/metronic/icons/duotone/Navigation/Close.svg?react';
import axios from '@/utils/axios';
import compareFields from '@rival/ladder.backend/src/utils/compareFields';
import style from './style.module.scss';

type JustFormProps = {
    params: object;
    players: object;
    match: object;
};

const JustForm = (props: JustFormProps) => {
    const { params, players, match } = props;
    const { isSubmitting, values, setFieldValue } = params;
    const currentUser = useSelector((state) => state.auth.user);
    const currentUserPlayerId = currentUser.tournaments[match.tournamentId].playerId;

    const usedPlayerIds = [match.challengerId, match.challenger2Id, match.acceptorId, match.acceptor2Id].filter(
        Boolean
    );
    const isMySlotTaken = [values.challengerId, values.challenger2Id, values.acceptorId, values.acceptor2Id].includes(
        currentUserPlayerId
    );
    const isOnlySlot = usedPlayerIds.length === 3;

    // Set current user by default if there is only one slot left
    useEffect(() => {
        if (!isOnlySlot) {
            return;
        }

        const fieldName = ['challengerId', 'challenger2Id', 'acceptorId', 'acceptor2Id'].find((name) => !match[name]);
        setFieldValue(fieldName, currentUserPlayerId);
    }, []);

    const actualPlayers = useMemo(() => {
        return Object.values(players)
            .sort(compareFields('firstName', 'lastName'))
            .filter((item) => !usedPlayerIds.includes(item.id) && item.id !== currentUserPlayerId)
            .map((item) => ({
                value: item.id,
                label: `${item.firstName} ${item.lastName}`,
            }));
    }, [players, values.challengerId]);

    const getPlayerPicker = (name) => () => {
        if (!values[name]) {
            return;
        }

        ['challenger2Id', 'acceptorId', 'acceptor2Id'].forEach((field) => {
            if (field === name) {
                return;
            }

            if (values[field] === values[name]) {
                setFieldValue(field, 0);
            }
        });
    };
    useEffect(getPlayerPicker('challenger2Id'), [values.challenger2Id]);
    useEffect(getPlayerPicker('acceptorId'), [values.acceptorId]);
    useEffect(getPlayerPicker('acceptor2Id'), [values.acceptor2Id]);

    const renderSlot = (name, label) => {
        if (match[name]) {
            return <PlayerName player1={players[match[name]]} isShort />;
        }

        if (!isMySlotTaken) {
            return (
                <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    data-pick-slot={name}
                    onClick={() => setFieldValue(name, currentUserPlayerId)}
                >
                    Pick this slot
                </button>
            );
        }

        if (values[name]) {
            return (
                <div>
                    <PlayerName player1={players[values[name]]} isShort />
                    {usedPlayerIds.length < 3 && (
                        <span
                            className={style.close + ' svg-icon svg-icon-3 svg-icon-danger'}
                            data-free-slot={name}
                            onClick={() => {
                                setFieldValue(name, 0);
                            }}
                        >
                            <CloseIcon />
                        </span>
                    )}
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
                    data-select-player={name}
                >
                    <option value={0}>Pick {label}</option>
                    {actualPlayers.map((player) => (
                        <option key={player.value} value={player.value}>
                            {player.label}
                        </option>
                    ))}
                </select>
            </div>
        );
    };

    return (
        <Form noValidate>
            <div className="mb-6">
                {isOnlySlot ? (
                    <label className="form-label">Please confirm you want to accept this proposal.</label>
                ) : (
                    <>
                        <label className="form-label">Pick the slot for you</label>
                        <div className={style.description}>
                            You can also include other players who agreed to play at this location and at this time.
                        </div>
                    </>
                )}

                <div className={style.team}>
                    <PlayerAvatar
                        player1={players[match.challengerId || values.challengerId] || {}}
                        player2={players[match.challenger2Id || values.challenger2Id] || {}}
                        className="me-2"
                    />
                    {renderSlot('challengerId', 'Challenger')}
                    <div className={style.separator}>/</div>
                    {renderSlot('challenger2Id', 'Partner')}
                </div>
                <div className={style.team}>
                    <PlayerAvatar
                        player1={players[match.acceptorId || values.acceptorId] || {}}
                        player2={players[match.acceptor2Id || values.acceptor2Id] || {}}
                        className="me-2"
                    />
                    {renderSlot('acceptorId', 'Opponent 1')}
                    <div className={style.separator}>/</div>
                    {renderSlot('acceptor2Id', 'Opponent 2')}
                </div>
            </div>

            <Button disabled={!isMySlotTaken} isSubmitting={isSubmitting}>
                Accept proposal
            </Button>
        </Form>
    );
};

type FormAcceptDoublesProposalProps = {
    match: object;
    onSubmit: (...args: unknown[]) => unknown;
    players: object;
};

const FormAcceptDoublesProposal = (props: FormAcceptDoublesProposalProps) => {
    const { match, onSubmit, players } = props;

    const acceptProposal = async (values) => {
        try {
            await showLoader(async () => {
                await axios.put(`/api/proposals/${match.id}`, { action: 'acceptDoublesProposal', ...values });
                await onSubmit();

                notification({
                    header: 'Success',
                    message: 'The proposal has been accepted.',
                });
            });
        } catch {
            // do nothing
        }
    };

    return (
        <Formik
            initialValues={{ challengerId: 0, challenger2Id: 0, acceptorId: 0, acceptor2Id: 0 }}
            onSubmit={acceptProposal}
        >
            {(params) => <JustForm params={params} players={players} match={match} />}
        </Formik>
    );
};

export default FormAcceptDoublesProposal;
