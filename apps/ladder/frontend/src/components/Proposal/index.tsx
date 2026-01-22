import style from './style.module.scss';
import MarkerIcon from '@/styles/metronic/icons/duotune/general/gen018.svg?react';
import CommentIcon from '@/styles/metronic/icons/duotone/Interface/Comment.svg?react';
import ClockIcon from '@/styles/metronic/icons/duotone/Home/Clock.svg?react';
import TimerIcon from '@/styles/metronic/icons/duotone/Home/Timer.svg?react';
import CheckIcon from '@/styles/metronic/icons/duotone/Navigation/Check.svg?react';
import BallIcon from '@/assets/ball.svg?react';
import BattleIcon from '@/assets/battle1.svg?react';
import { formatLong } from '@/utils/dayjs';
import { Formik, Field, Form } from '@/components/formik';
import { useSelector } from 'react-redux';
import axios from '@/utils/axios';
import notification from '@/components/notification';
import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerName from '@/components/PlayerName';
import Modal from '@/components/Modal';
import Tooltip from '@/components/Tooltip';
import FormDeleteProposal from '@/components/FormDeleteProposal';
import WeatherAtTime from '../WeatherForecast/WeatherAtTime';
import checkUserReady from '@/utils/checkUserReady';
import Button from '@/components/Button';
import DoublesPlayersPicker from '@/components/formik/DoublesPlayersPicker';
import useMatchPermissions from '@/utils/useMatchPermissions';
import practiceTypeOptions from '@rival/ladder.backend/src/services/proposals/practiceTypeOptions';
import matchFormatOptions from '@rival/ladder.backend/src/services/proposals/matchFormatOptions';
import durationOptions from '@rival/ladder.backend/src/services/proposals/durationOptions';

type FormAcceptProposalProps = {
    match?: object;
    tournament?: object;
    onSubmit?: (...args: unknown[]) => unknown;
    onCancel?: (...args: unknown[]) => unknown;
};

const FormAcceptProposal = (props: FormAcceptProposalProps) => {
    const { match, onSubmit, onCancel, tournament } = props;
    const currentUser = useSelector((state) => state.auth.user);
    const currentPlayerId = currentUser.tournaments[tournament.id].playerId;
    const currentPlayer = tournament.players[currentPlayerId];
    const isDoublesTeam = tournament.levelType === 'doubles-team';
    const isPracticeProposal = Boolean(match.practiceType);

    const matchFormat = matchFormatOptions.find((item) => item.value === match.matchFormat);
    const needPickPlayers = isDoublesTeam && currentPlayer.partners.length > 2;

    const getInitialValues = () => {
        const values = {};

        if (isDoublesTeam) {
            values.acceptors =
                currentPlayer.partners.length === 2
                    ? [currentPlayer.id, currentPlayer.partners.find((item) => item.id !== currentPlayer.id).id]
                    : [currentPlayer.id];
        }

        return values;
    };

    return (
        <Formik initialValues={getInitialValues()} onSubmit={onSubmit}>
            {({ isSubmitting }) => (
                <Form noValidate>
                    <div className="mb-6">
                        <p>Please confirm you want to accept this proposal.</p>
                        <Proposal {...props} showActions={false} />
                    </div>
                    {isDoublesTeam && (
                        <div className="alert alert-primary mb-6">
                            <b>Notice!</b> You&apos;re going to be the contact for this match.
                        </div>
                    )}
                    {matchFormat.rules ? (
                        <div className="alert alert-primary mb-6">
                            This is a <b>{matchFormat.label}</b> match proposal following these rules:
                            <ul className="mt-2 mb-0 ps-8">
                                {matchFormat.rules.map((rule) => (
                                    <li key={rule} className="mb-1">
                                        {rule}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : matchFormat.warning ? (
                        <div className="alert alert-primary mb-6">
                            This is a <b>{matchFormat.label}</b> match proposal. {matchFormat.warning}
                        </div>
                    ) : null}
                    {isPracticeProposal && (
                        <div className="alert alert-primary mb-6">
                            This is a <b>practice session</b>, not a ranked match. Old balls are acceptable for
                            practice. <b>Do no report the score</b>.
                        </div>
                    )}
                    {needPickPlayers && (
                        <Field name="acceptors" component={DoublesPlayersPicker} partners={currentPlayer.partners} />
                    )}
                    <div className="d-flex gap-2">
                        <Button isSubmitting={isSubmitting}>Accept</Button>
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>
                            Cancel
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

type ProposalProps = {
    tournament?: object;
    match?: object;
    onStatusUpdate?: (...args: unknown[]) => unknown;
    showActions?: boolean;
    showWeather?: boolean;
    isUpcomingPlayStyle?: boolean;
    showElo?: boolean;
};

const Proposal = (props: ProposalProps) => {
    const { tournament, match, onStatusUpdate, showActions, showWeather, isUpcomingPlayStyle, showElo } = props;
    const { canAcceptProposal, canDeleteProposal, canUnacceptProposal, canSeeContact } = useMatchPermissions({
        tournament,
        match,
    });
    const currentUser = useSelector((state) => state.auth.user);

    const { players } = tournament;
    const challenger = players[match.challengerId];
    const challenger2 = players[match.challenger2Id];
    const acceptor = players[match.acceptorId];
    const acceptor2 = players[match.acceptor2Id];
    const opponent = (() => {
        if (!currentUser || !match.practiceType || !isUpcomingPlayStyle) {
            return null;
        }

        return currentUser.id === challenger.userId ? acceptor : challenger;
    })();

    const acceptProposal = async (values) => {
        try {
            await axios.put(`/api/proposals/${match.id}`, { action: 'acceptProposal', ...values });
        } catch (e) {
            await onStatusUpdate();
            throw e;
        }

        await onStatusUpdate();

        notification({
            header: 'Success',
            message: 'The proposal has been accepted.',
        });
    };

    const practiceType =
        match.practiceType && match.practiceType < 99
            ? practiceTypeOptions.find((item) => item.value === match.practiceType).explanation
            : null;

    const matchFormat =
        match.matchFormat && match.matchFormat !== 0
            ? matchFormatOptions.find((item) => item.value === match.matchFormat)
            : null;
    const duration = match.duration ? durationOptions.find((item) => item.value === match.duration).label : null;

    const challengerElo = (() => {
        if (!showElo || !match.challengerId) {
            return null;
        }
        const player = tournament.players[match.challengerId];
        return player.elo.isEloEstablished ? player.elo.elo : null;
    })();

    return (
        <div className={style.wrapper} data-proposal={match.id}>
            <div className={style.matchWrapper}>
                <div className={style.match}>
                    <div className={style.first}>
                        {match.practiceType ? (
                            <Tooltip content="Practice">
                                <div className={style.practice} />
                            </Tooltip>
                        ) : null}
                        <div className={style.avatar}>
                            <PlayerAvatar player1={opponent || challenger} player2={challenger2} />
                        </div>
                        <div className={style.player + ' fw-bold text-break'}>
                            <PlayerName
                                player1={opponent || challenger}
                                player2={challenger2}
                                rank1={match.practiceType ? null : match.challengerRank}
                                rank2={match.challenger2Rank}
                                elo1={challengerElo}
                                isLink
                                showContactBadge={canSeeContact}
                            />
                        </div>
                        {showActions && (
                            <div>
                                {canAcceptProposal && (
                                    <Modal
                                        title="Accept Proposal"
                                        hasForm={false}
                                        size="sm"
                                        renderTrigger={({ show }) => (
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-xs"
                                                onClick={checkUserReady(show)}
                                            >
                                                Accept
                                            </button>
                                        )}
                                        renderBody={({ hide }) => (
                                            <FormAcceptProposal {...props} onSubmit={acceptProposal} onCancel={hide} />
                                        )}
                                    />
                                )}
                                {canDeleteProposal && (
                                    <Modal
                                        title="Delete proposal"
                                        renderTrigger={({ show }) => (
                                            <button type="button" className="btn btn-danger btn-xs" onClick={show}>
                                                Delete
                                            </button>
                                        )}
                                        renderBody={({ hide }) => (
                                            <FormDeleteProposal
                                                match={match}
                                                tournament={tournament}
                                                onSubmit={onStatusUpdate}
                                                onCancel={hide}
                                                renderDeletedProposal={() => (
                                                    <Proposal {...props} showActions={false} />
                                                )}
                                            />
                                        )}
                                    />
                                )}
                                {canUnacceptProposal && (
                                    <Modal
                                        title="Unaccept proposal"
                                        renderTrigger={({ show }) => (
                                            <button type="button" className="btn btn-warning btn-xs" onClick={show}>
                                                Unaccept
                                            </button>
                                        )}
                                        renderBody={({ hide }) => (
                                            <FormDeleteProposal
                                                match={match}
                                                tournament={tournament}
                                                onSubmit={onStatusUpdate}
                                                renderDeletedProposal={() => (
                                                    <Proposal {...props} showActions={false} />
                                                )}
                                            />
                                        )}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                    <div>
                        {showWeather && (
                            <div className="float-end ms-4">
                                <WeatherAtTime time={match.playedAt} />
                            </div>
                        )}
                        <div className={style.grid}>
                            <div className={style.row}>
                                <span className="svg-icon svg-icon-1 svg-icon-gray-700" title="Time">
                                    <ClockIcon />
                                </span>
                                <div data-playwright-placeholder="middle">{formatLong(match.playedAt)}</div>
                            </div>
                            <div className={style.row}>
                                <span className="svg-icon svg-icon-1 svg-icon-gray-700" title="Location">
                                    <MarkerIcon />
                                </span>
                                <div className="tl-word-break">{match.place}</div>
                            </div>
                            {practiceType ? (
                                <div className={style.row}>
                                    <span className="svg-icon svg-icon-1 svg-icon-gray-700" title="Practice type">
                                        <BallIcon />
                                    </span>
                                    <div className="tl-word-break">{practiceType}</div>
                                </div>
                            ) : null}
                            {matchFormat ? (
                                <div className={style.row}>
                                    <span
                                        className="svg-icon svg-icon-1 svg-icon-gray-700"
                                        style={{ transform: 'scale(0.9)' }}
                                    >
                                        <BattleIcon />
                                    </span>
                                    <Tooltip
                                        content={
                                            matchFormat.rules ? (
                                                <div className="p-2">
                                                    <h2 className="text-white">Rules</h2>
                                                    <ul className="m-0 ps-4">
                                                        {matchFormat.rules.map((rule) => (
                                                            <li key={rule}>{rule}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : (
                                                matchFormat.description
                                            )
                                        }
                                    >
                                        <div className="tl-fixed-value">{matchFormat.label}</div>
                                    </Tooltip>
                                </div>
                            ) : null}
                            {duration ? (
                                <div className={style.row}>
                                    <span className="svg-icon svg-icon-1 svg-icon-gray-700" title="Duration">
                                        <TimerIcon />
                                    </span>
                                    <div className="tl-word-break">{duration}</div>
                                </div>
                            ) : null}
                            {match.comment?.trim() ? (
                                <div className={style.row}>
                                    <span className="svg-icon svg-icon-1 svg-icon-gray-700" title="Comment">
                                        <CommentIcon />
                                    </span>
                                    <div className="tl-word-break">{match.comment}</div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                    {showActions && match.acceptorId && !isUpcomingPlayStyle && (
                        <div>
                            <div className="d-flex">
                                <span className="svg-icon svg-icon-1 svg-icon-success me-2">
                                    <CheckIcon />
                                </span>
                                <div className="text-nowrap me-1 mt-1 lh-sm">Accepted by</div>
                                <div className="mt-1 lh-sm text-break">
                                    <PlayerName
                                        player1={acceptor}
                                        player2={acceptor2}
                                        rank1={match.practiceType ? null : match.acceptorRank}
                                        rank2={match.acceptor2Rank}
                                        isLink
                                        showContactBadge={canSeeContact}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

Proposal.defaultProps = {
    showActions: true,
    showWeather: false,
    onStatusUpdate: () => {},
    isUpcomingPlayStyle: false,
};

export default Proposal;
