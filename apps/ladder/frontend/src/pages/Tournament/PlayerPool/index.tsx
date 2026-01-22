import { useMemo } from 'react';
import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerName from '@/components/PlayerName';
import Modal from '@/components/Modal';
import { useSelector } from 'react-redux';
import compareFields from '@rival/ladder.backend/src/utils/compareFields';
import confirmation from '@/utils/confirmation';
import axios from '@/utils/axios';
import style from './style.module.scss';
import showLoader from '@/utils/showLoader';
import notification from '@/components/notification';
import JoinPlayerPoolForm from './JoinPlayerPoolForm';
import CreateTeamForm from './CreateTeamForm';

type PlayerPoolProps = {
    tournament: object;
    onSubmit: (...args: unknown[]) => unknown;
};

const PlayerPool = (props: PlayerPoolProps) => {
    const { tournament, onSubmit } = props;
    const currentUser = useSelector((state) => state.auth.user);
    const currentPlayerId = currentUser?.tournaments[tournament.id]?.playerId;
    const currentPlayer = tournament.players[currentPlayerId];
    const isAloneDoublesTeamCaptain = currentPlayer?.isDoublesTeamCaptain && currentPlayer?.partnerIds.length === 1;

    const players = useMemo(() => {
        return Object.values(tournament.players)
            .filter((item) => item.isDoublesTeamPlayerPool)
            .sort(compareFields('firstName', 'lastName'));
    }, [tournament]);

    const removeFromPool = async (playerId) => {
        const confirm = await confirmation({
            message: <div>Are you sure you want to remove yourself from the Player Pool and the ladder?</div>,
        });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put(`/api/players/${playerId}`, { action: 'removeFromPlayerPool' });
            await onSubmit();
            notification({
                header: 'Success',
                message: "You've been successfuly removed from the Player Pool.",
            });
        });
    };
    const acceptToTheTeam = async (playerId) => {
        const player = tournament.players[playerId];
        const fullName = `${player.firstName} ${player.lastName}`;

        const confirm = await confirmation({
            title: 'Are you sure?',
            message: (
                <div>
                    Are you sure you want to add <b>{fullName}</b> to your Doubles Team?
                </div>
            ),
        });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put(`/api/players/${playerId}`, { action: 'acceptPlayerFromPool' });
            await onSubmit();
            notification({
                header: 'Success',
                message: `${fullName} joined your team.`,
            });
        });
    };

    return (
        <div>
            <h3>Player Pool</h3>
            {players.length === 0 ? (
                <div>No players available</div>
            ) : (
                <div className={style.players}>
                    {players.map((player) => {
                        const isMe = currentPlayerId === player.id;
                        const canAcceptToTheTeam = Boolean(
                            !isMe && currentPlayerId && !currentPlayer.isDoublesTeamPlayerPool
                        );
                        const canCreateTeam = Boolean(!isMe && currentPlayer?.isDoublesTeamPlayerPool);

                        return (
                            <div key={player.id} className={style.player} data-player-pool={player.userId}>
                                <div className={style.header}>
                                    <div>
                                        <PlayerAvatar player1={player} />
                                    </div>
                                    <div className={style.player + ' fw-bold text-break'}>
                                        <PlayerName player1={player} isLink />
                                    </div>
                                    <div className={style.actions}>
                                        {isMe && (
                                            <>
                                                <Modal
                                                    title="Update information"
                                                    renderTrigger={({ show }) => (
                                                        <button
                                                            type="button"
                                                            className="btn btn-success btn-xs"
                                                            onClick={show}
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    renderBody={({ hide }) => (
                                                        <JoinPlayerPoolForm
                                                            initialValues={{ partnerInfo: player.partnerInfo }}
                                                            showWarning={false}
                                                            onSubmit={async (values) => {
                                                                await axios.put(`/api/players/${currentPlayerId}`, {
                                                                    action: 'moveToPlayerPool',
                                                                    partnerInfo: values.partnerInfo,
                                                                });
                                                                await onSubmit();
                                                                notification({
                                                                    header: 'Success',
                                                                    message: `You've successfuly updated your information.`,
                                                                });

                                                                hide();
                                                            }}
                                                        />
                                                    )}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-xs"
                                                    onClick={() => removeFromPool(player.id)}
                                                >
                                                    Remove
                                                </button>
                                            </>
                                        )}
                                        {canAcceptToTheTeam && (
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-xs"
                                                onClick={() => acceptToTheTeam(player.id)}
                                            >
                                                Add to Team
                                            </button>
                                        )}
                                        {canCreateTeam && (
                                            <Modal
                                                title="Update information"
                                                renderTrigger={({ show }) => (
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-xs"
                                                        onClick={show}
                                                    >
                                                        Create Team
                                                    </button>
                                                )}
                                                renderBody={({ hide }) => (
                                                    <CreateTeamForm
                                                        tournament={tournament}
                                                        player={player}
                                                        onSubmit={async (values) => {
                                                            await axios.put(`/api/players/${player.id}`, {
                                                                action: 'acceptPlayerFromPool',
                                                                ...values,
                                                            });
                                                            await onSubmit();
                                                            notification({
                                                                header: 'Success',
                                                                message: `${player.firstName} ${player.lastName} joined your team.`,
                                                            });

                                                            hide();
                                                        }}
                                                    />
                                                )}
                                            />
                                        )}
                                    </div>
                                </div>
                                {player.partnerInfo ? <div className={style.info}>{player.partnerInfo}</div> : null}
                            </div>
                        );
                    })}
                </div>
            )}
            {isAloneDoublesTeamCaptain && (
                <div className="mt-6">
                    <Modal
                        title="Join the Player Pool"
                        renderTrigger={({ show }) => (
                            <button type="button" className="btn btn-success w-100" onClick={show}>
                                Join the Player Pool
                            </button>
                        )}
                        renderBody={({ hide }) => (
                            <JoinPlayerPoolForm
                                onSubmit={async (values) => {
                                    await axios.put(`/api/players/${currentPlayerId}`, {
                                        action: 'moveToPlayerPool',
                                        partnerInfo: values.partnerInfo,
                                    });
                                    await onSubmit();
                                    notification({
                                        header: 'Success',
                                        message: `You've been successfuly moved to the Player Pool.`,
                                    });

                                    hide();
                                }}
                            />
                        )}
                    />
                </div>
            )}
        </div>
    );
};

PlayerPool.defaultProps = {};

export default PlayerPool;
