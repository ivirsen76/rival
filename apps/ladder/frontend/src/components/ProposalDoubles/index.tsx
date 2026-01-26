import style from './style.module.scss';
import MarkerIcon from '@/styles/metronic/icons/duotune/general/gen018.svg?react';
import ClockIcon from '@/styles/metronic/icons/duotone/Home/Clock.svg?react';
import CommentIcon from '@/styles/metronic/icons/duotone/Interface/Comment.svg?react';
import dayjs, { formatLong } from '@/utils/dayjs';
import { useSelector } from 'react-redux';
import axios from '@/utils/axios';
import notification from '@/components/notification';
import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerName from '@/components/PlayerName';
import FormAcceptDoublesProposal from '@/components/FormAcceptDoublesProposal';
import showLoader from '@/utils/showLoader';
import useConfirmation from '@/utils/useConfirmation';
import Modal from '@/components/Modal';
import FormDeleteDoublesProposal from '@/components/FormDeleteDoublesProposal';
import WeatherAtTime from '../WeatherForecast/WeatherAtTime';

type ProposalDoublesProps = {
    tournament: object;
    match: object;
    onStatusUpdate: (...args: unknown[]) => unknown;
    showActions: boolean;
    showWeather: boolean;
};

const ProposalDoubles = (props: ProposalDoublesProps) => {
    const { match, onStatusUpdate, showActions, tournament, showWeather } = props;
    const { players } = tournament;
    const currentUser = useSelector((state) => state.auth.user);
    const { confirm, confirmMessage } = useConfirmation();
    const nowLocal = dayjs.tz();
    const challenger = players[match.challengerId];
    const challenger2 = match.challenger2Id ? players[match.challenger2Id] : null;
    const acceptor = match.acceptorId ? players[match.acceptorId] : null;
    const acceptor2 = match.acceptor2Id ? players[match.acceptor2Id] : null;

    const usedPlayerIds = [match.challengerId, match.challenger2Id, match.acceptorId, match.acceptor2Id].filter(
        Boolean
    );

    const isMyTournament = Boolean(currentUser && currentUser.tournaments[match.tournamentId]?.isActive);
    const currentUserPlayerId = isMyTournament && currentUser.tournaments[match.tournamentId].playerId;

    const cancelProposal = async () => {
        const answer = await confirm({
            message: (
                <div>
                    <p>Please confirm you want to delete this proposal.</p>
                    <ProposalDoubles {...props} showActions={false} />
                </div>
            ),
            confirmButtonTitle: 'Delete',
        });
        if (!answer) {
            return;
        }

        try {
            await showLoader(async () => {
                await axios.put(`/api/proposals/${match.id}`, { action: 'removeDoublesProposal' });
                await onStatusUpdate();
                notification({
                    header: 'Success',
                    message: 'Your proposal has been deleted.',
                });
            });
        } catch {
            // do nothing
        }
    };

    const isPast = dayjs.tz(match.playedAt).isBefore(nowLocal);

    return (
        <>
            {confirmMessage}
            <div className={style.wrapper} data-proposal={match.id}>
                <div className={style.matchWrapper}>
                    <div className={style.match}>
                        <div className={style.teams}>
                            <div>
                                <div className={style.team}>
                                    <PlayerAvatar player1={challenger} player2={challenger2 || {}} />
                                    <PlayerName
                                        player1={challenger}
                                        player2={challenger2 || {}}
                                        rank1={match.challengerRank}
                                        rank2={match.challenger2Rank}
                                        isLink
                                    />
                                </div>
                                <div className={style.team}>
                                    <PlayerAvatar player1={acceptor || {}} player2={acceptor2 || {}} />
                                    <PlayerName
                                        player1={acceptor || {}}
                                        player2={acceptor2 || {}}
                                        rank1={match.acceptorRank}
                                        rank2={match.acceptor2Rank}
                                        isLink
                                    />
                                </div>
                            </div>
                            {showActions && (
                                <div>
                                    {(() => {
                                        if (isPast || !isMyTournament) {
                                            return null;
                                        }

                                        if (!match.acceptedAt && !usedPlayerIds.includes(currentUserPlayerId)) {
                                            return (
                                                <Modal
                                                    key="accept-proposal-modal"
                                                    title="Accept Proposal"
                                                    hasForm={false}
                                                    size="sm"
                                                    renderTrigger={({ show }) => (
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary btn-xs"
                                                            onClick={show}
                                                        >
                                                            Accept
                                                        </button>
                                                    )}
                                                    renderBody={({ hide }) => (
                                                        <FormAcceptDoublesProposal
                                                            match={match}
                                                            players={players}
                                                            onSubmit={() => {
                                                                onStatusUpdate();
                                                                hide();
                                                            }}
                                                        />
                                                    )}
                                                />
                                            );
                                        }

                                        if (currentUserPlayerId === match.challengerId) {
                                            return usedPlayerIds.length === 1 ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-xs"
                                                    onClick={cancelProposal}
                                                >
                                                    Delete
                                                </button>
                                            ) : (
                                                <Modal
                                                    key="delete-proposal-modal"
                                                    title="Delete proposal"
                                                    renderTrigger={({ show }) => (
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger btn-xs"
                                                            onClick={show}
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                    renderBody={({ hide }) => (
                                                        <FormDeleteDoublesProposal
                                                            match={match}
                                                            tournament={tournament}
                                                            onSubmit={onStatusUpdate}
                                                        />
                                                    )}
                                                />
                                            );
                                        }

                                        if (usedPlayerIds.includes(currentUserPlayerId)) {
                                            return (
                                                <Modal
                                                    key="unaccept-proposal-modal"
                                                    title="Unaccept proposal"
                                                    renderTrigger={({ show }) => (
                                                        <button
                                                            type="button"
                                                            className="btn btn-warning btn-xs"
                                                            onClick={show}
                                                        >
                                                            Unaccept
                                                        </button>
                                                    )}
                                                    renderBody={({ hide }) => (
                                                        <FormDeleteDoublesProposal
                                                            match={match}
                                                            tournament={tournament}
                                                            onSubmit={onStatusUpdate}
                                                        />
                                                    )}
                                                />
                                            );
                                        }
                                    })()}
                                </div>
                            )}
                        </div>
                        <div>
                            {showWeather && (
                                <div className="float-end ms-4">
                                    <WeatherAtTime time={match.playedAt} />
                                </div>
                            )}
                            <div className="mb-1">
                                <span className="svg-icon svg-icon-1 svg-icon-gray-700 me-2">
                                    <ClockIcon />
                                </span>
                                <span data-playwright-placeholder="middle">{formatLong(match.playedAt)}</span>
                            </div>
                            <div className="d-flex">
                                <span className="svg-icon svg-icon-1 svg-icon-gray-700 me-2">
                                    <MarkerIcon />
                                </span>
                                {match.place}
                            </div>
                            {match.comment && match.comment.trim() ? (
                                <div className="d-flex mt-1">
                                    <span className="svg-icon svg-icon-1 svg-icon-gray-700 me-2">
                                        <CommentIcon />
                                    </span>
                                    <div className="tl-word-break">{match.comment}</div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

ProposalDoubles.defaultProps = {
    showActions: true,
    onStatusUpdate: () => {},
    showWeather: false,
};

export default ProposalDoubles;
