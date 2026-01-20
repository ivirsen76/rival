import { useRef, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Match from '@/components/Match';
import UpsetMatch from '@/components/UpsetMatch';
import Proposal from '@/components/Proposal';
import ProposalDoubles from '@/components/ProposalDoubles';
import Card from '@/components/Card';
import Copy from '@/components/Copy';
import Final from '@/components/Final';
import Tooltip from '@/components/Tooltip';
import DoublesFinal from '@/components/DoublesFinal';
import Winner from '@/components/Winner';
import Modal from '@/components/Modal';
import FormProposal from '@/components/FormProposal';
import FormDoublesProposal from '@/components/FormDoublesProposal';
import FormNewMatch from '@/components/FormNewMatch';
import FormNewDoublesMatch from '@/components/FormNewDoublesMatch';
import FormNewMatchByAdmin from '@/components/FormNewMatchByAdmin';
import FormScheduleNewMatch from '@/components/FormScheduleNewMatch';
import CancelMessage from '@/components/CancelMessage';
import PlayersByPoints from '../PlayersByPoints';
import PlayersByElo from '../PlayersByElo';
import PlayersLive from '../PlayersLive';
import MostProgress from '../MostProgress';
import MostMatches from '../MostMatches';
import TopForm from '../TopForm';
import Coach from '../Coach';
import PlayerPool from '../PlayerPool';
import FinalParticipation from '../FinalParticipation';
import ClaimReward from '../ClaimReward';
import notification from '@/components/notification';
import { useSelector, useDispatch } from 'react-redux';
import ClockIcon from '@rival/packages/metronic/icons/duotone/Home/Clock.svg?react';
import MatchIcon from '@/assets/battle.svg?react';
import ArrowDownIcon from '@rival/packages/metronic/icons/duotone/Navigation/Angle-down.svg?react';
import AngleLeftIcon from '@rival/packages/metronic/icons/duotone/Navigation/Angle-double-left.svg?react';
import AngleRightIcon from '@rival/packages/metronic/icons/duotone/Navigation/Angle-double-right.svg?react';
import OtherIcon from '@rival/packages/metronic/icons/duotone/General/Other2.svg?react';
import dayjs from '@/utils/dayjs';
import useBreakpoints from '@/utils/useBreakpoints';
import useSettings from '@/utils/useSettings';
import useUserInterface from '@/utils/useUserInterface';
import useTabs from '../useTabs';
import hasAnyRole from '@/utils/hasAnyRole';
import { useQueryClient } from 'react-query';
import { Link, useHistory } from 'react-router-dom';
import classnames from 'classnames';
import Summary from './Summary';
import SwitchLadderForm from './SwitchLadderForm';
import FormChangeTeamName from '@/components/FormChangeTeamName';
import FormReplaceCaptain from './FormReplaceCaptain';
import FormLeaveTeam from './FormLeaveTeam';
import log from '@/utils/log';
import { loadCurrentUser } from '@/reducers/auth';
import showLoader from '@/utils/showLoader';
import confirmation from '@/utils/confirmation';
import checkUserReady from '@/utils/checkUserReady';
import formatElo from '@rival/ladder.backend/src/utils/formatElo';
import useConfig from '@/utils/useConfig';
import axios from '@/utils/axios';
import style from './style.module.scss';

const firstProposals = 5;
const tooManyProposals = 8;

const sortByDate = (a, b) =>
    !a.playedAt || !b.playedAt || a.playedAt === b.playedAt ? a.id - b.id : a.playedAt.localeCompare(b.playedAt);

const getEloDifference = (match) => {
    const diff = match.challengerElo - match.challengerEloChange - (match.acceptorElo - match.acceptorEloChange);
    return formatElo(match.winner === match.challengerId ? -diff : diff);
};

export const getUpcomingMatches = ({ tournament, currentUser }) => {
    if (!currentUser) {
        return [];
    }

    const currentDate = dayjs.tz();
    const isDoubles = tournament.levelType === 'doubles';
    const { players } = tournament;
    const currentPlayerId = currentUser?.tournaments[tournament.id]?.playerId;
    const partners = players[currentPlayerId]?.partners;

    return tournament.matches
        .filter((match) => {
            if (!currentPlayerId) {
                return false;
            }
            if (match.score || ![1, 5, 6].includes(match.initial) || !match.acceptedAt) {
                return false;
            }
            if (!match.challengerId || !match.acceptorId) {
                return false;
            }
            if (isDoubles && (!match.challenger2Id || !match.acceptor2Id)) {
                return false;
            }

            const playerIds = [match.challengerId, match.acceptorId, match.challenger2Id, match.acceptor2Id];
            if (partners) {
                if (!partners.some((item) => playerIds.includes(item.id))) {
                    return false;
                }
            } else if (!playerIds.includes(currentPlayerId)) {
                return false;
            }

            if (!currentDate.isSameOrBefore(dayjs.tz(match.playedAt), 'isoWeek')) {
                return false;
            }
            if (match.practiceType && dayjs.tz(match.playedAt).isSameOrBefore(currentDate)) {
                return false;
            }

            return true;
        })
        .sort(sortByDate);
};

const Overview = (props) => {
    const { tournament, reloadTournament } = props;
    const { players, winner, topUpsetMatches, isStarted, isOver, isBreak, isFinalTournament, cancelFinalTournament } =
        tournament;
    const [showAll, setShowAll] = useState(false);
    const currentUser = useSelector((state) => state.auth.user);
    const [learnedTheRules, setLearnedTheRules] = useState(Boolean(currentUser?.learnedTheRules));
    const size = useBreakpoints();
    const { settings } = useSettings();
    const config = useConfig();
    const dispatch = useDispatch();
    const otherActionsTooltipRef = useRef();
    const history = useHistory();
    const queryClient = useQueryClient();
    const [showDoublesPlayers, setShowDoublesPlayers] = useUserInterface('showDoublesPlayers', false);

    const isLive = isStarted && !isOver;
    const isSingle = tournament.levelType === 'single';
    const isDoubles = tournament.levelType === 'doubles';
    const isDoublesTeam = tournament.levelType === 'doubles-team';
    const currentPlayerId = currentUser?.tournaments[tournament.id]?.playerId;
    const currentPlayer = players[currentPlayerId];
    const isMyTournament = Boolean(
        currentUser?.tournaments[tournament.id]?.isActive && !currentUser?.tournaments[tournament.id]?.needPartner
    );
    const isDoublesTeamCaptain = Boolean(currentPlayer?.isDoublesTeamCaptain);
    const isDoublesTeamAloneCaptain = isDoublesTeamCaptain && currentPlayer.partners.length === 1;
    const isDoublesTeamPlayerPool = Boolean(currentPlayer?.isDoublesTeamPlayerPool);
    const isDoublesTeamPartner = currentPlayer?.partners?.length > 1 && !isDoublesTeamCaptain;
    const isDoublesTeamFull = Boolean(isDoublesTeamCaptain && currentPlayer.partners.length >= 3);
    const isAdmin = hasAnyRole(currentUser, ['admin', 'manager']);

    const {
        isFirstDay,
        isLastDay,
        showFinalReminder,
        allowChangeParticipationStatus,
        playedMatches,
        finalMatches,
        isChampion,
        isRunnerUp,
        todayMatches,
        yesterdayMatches,
        tomorrowMatches,
        proposals,
        upcomingMatches,
        totalPlayers,
        isFinalWonDefault,
    } = useMemo(() => {
        const currentDate = dayjs.tz();
        const currentDateString = currentDate.format('YYYY-MM-DD HH:mm:ss');
        const yesterdayDate = currentDate.subtract(1, 'day');
        const tomorrowDate = currentDate.add(1, 'day');
        const twoDaysAgoString = currentDate.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        const inTwoDaysString = currentDate.add(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        const dateReminder = dayjs
            .tz(tournament.endDate)
            .subtract(settings.config.tournamentReminderWeeks, 'week')
            .format('YYYY-MM-DD HH:mm:ss');
        const finalMatchesLocal = tournament.matches.filter((match) => match.type === 'final' && !match.battleId);
        const finalMatch = finalMatchesLocal.find((match) => match.finalSpot === 1);
        const doublesFinalMatch =
            tournament.doublesMatches && tournament.doublesMatches.find((match) => match.finalSpot === 1);

        const currentMatches = tournament.matches
            .filter(
                (match) =>
                    match.type === 'regular' &&
                    !match.unavailable &&
                    match.acceptedAt &&
                    match.playedAt &&
                    match.playedAt > twoDaysAgoString &&
                    match.playedAt < inTwoDaysString
            )
            .sort(sortByDate);

        const _showFinalReminder = (() => {
            if (isDoublesTeam && (isDoublesTeamPlayerPool || isDoublesTeamAloneCaptain)) {
                return false;
            }

            return currentDateString > dateReminder && currentDateString < tournament.endDate;
        })();

        return {
            isFirstDay: currentDate.isSame(dayjs.tz(tournament.startDate), 'day'),
            isLastDay: currentDate.isSame(dayjs.tz(tournament.endDate).subtract(12, 'hour'), 'day'),
            showFinalReminder: _showFinalReminder,
            allowChangeParticipationStatus: (() => {
                if (!_showFinalReminder) {
                    return false;
                }
                if (isDoublesTeam) {
                    if (!isDoublesTeamCaptain || isDoublesTeamAloneCaptain) {
                        return false;
                    }
                }

                return true;
            })(),
            playedMatches: tournament.matches.filter((match) => match.score && !match.wonByDefault),
            finalMatches: finalMatchesLocal,
            isChampion: (() => {
                if (isDoublesTeam) {
                    return finalMatch?.score && currentPlayer?.partnerIds.includes(finalMatch.winner);
                }
                if (isDoubles) {
                    return doublesFinalMatch && doublesFinalMatch.winner === currentPlayerId;
                }

                return finalMatch?.score && finalMatch.winner === currentPlayerId;
            })(),
            isRunnerUp: (() => {
                if (isDoubles) {
                    return doublesFinalMatch && doublesFinalMatch.runnerUp === currentPlayerId;
                }

                return (
                    !isDoublesTeam &&
                    finalMatch &&
                    finalMatch.score &&
                    [finalMatch.challengerId, finalMatch.acceptorId].includes(currentPlayerId) &&
                    finalMatch.winner !== currentPlayerId
                );
            })(),
            isFinalWonDefault: Boolean(finalMatch?.wonByDefault),
            todayMatches: currentMatches.filter((match) => dayjs.tz(match.playedAt).isSame(currentDate, 'day')),
            yesterdayMatches: currentMatches.filter((match) => dayjs.tz(match.playedAt).isSame(yesterdayDate, 'day')),
            tomorrowMatches: currentMatches.filter((match) => dayjs.tz(match.playedAt).isSame(tomorrowDate, 'day')),
            proposals: tournament.matches
                .filter((match) => {
                    if (match.initial !== 1 || match.acceptedAt || match.playedAt <= currentDateString) {
                        return false;
                    }

                    const proposer = players[match.challengerId];
                    const userIds = [match.challengerId, match.acceptorId, match.challenger2Id, match.acceptor2Id].map(
                        (id) => players[id]?.userId
                    );

                    if (currentUser && !userIds.includes(currentUser.id)) {
                        if (userIds.some((id) => currentUser.avoidedUsers.includes(id))) {
                            return false;
                        }
                        if (currentUser.isSoftBan && !proposer.elo.isEloEstablished) {
                            return false;
                        }

                        if (currentPlayer && !currentPlayer.elo.isEloEstablished && proposer.isSoftBan) {
                            return false;
                        }
                    }

                    if (match.isCompetitive && !currentPlayerId) {
                        return false;
                    }

                    if (match.isCompetitive && currentPlayerId) {
                        if (!currentPlayer.elo.isEloEstablished) {
                            return false;
                        }

                        const proposerTlr = proposer.elo.elo;
                        const currentPlayerElo = currentPlayer.elo.elo;

                        if (Math.abs(currentPlayerElo - proposerTlr) > config.maxCompetitiveTlrGap) {
                            return false;
                        }
                    }

                    if (match.isAgeCompatible) {
                        const challenger = players[match.challengerId];
                        if (!challenger?.isAgeCompatible) {
                            return false;
                        }
                    }

                    return true;
                })
                .sort(sortByDate),
            upcomingMatches: currentUser ? getUpcomingMatches({ tournament, currentUser }) : [],
            totalPlayers: Object.values(players).filter((player) => {
                if (player.hidden) {
                    return false;
                }
                if (isDoublesTeam && player.partnerIds.length < 2) {
                    return false;
                }
                return true;
            }).length,
        };
    }, [tournament, currentUser]);

    const [playersMode, playersModeTabs] = useTabs({
        key: tournament.id,
        options: [
            ...(isLive ? [{ value: 'live', label: 'Live' }] : []),
            { value: 'points', label: 'Rank' },
            ...(isDoubles || isDoublesTeam ? [] : [{ value: 'elo', label: 'TLR' }]),
        ],
        className: 'me-4',
    });
    const [matchesDay, matchesTabs] = useTabs({
        key: tournament.id,
        options: [
            ...(isFirstDay
                ? []
                : [
                      {
                          value: 'yesterday',
                          label: 'Yesterday',
                          inactiveLabel: (
                              <span className="svg-icon svg-icon-3">
                                  <AngleLeftIcon />
                              </span>
                          ),
                      },
                  ]),
            { value: 'today', label: 'Today' },
            ...(isLastDay
                ? []
                : [
                      {
                          value: 'tomorrow',
                          label: 'Tomorrow',
                          inactiveLabel: (
                              <span className="svg-icon svg-icon-3">
                                  <AngleRightIcon />
                              </span>
                          ),
                      },
                  ]),
        ],
        initial: 'today',
    });

    const isXs = size === 'xs';
    const isMobile = ['xs', 'sm', 'md'].includes(size);
    const isLarge = ['xl', 'xxl'].includes(size);
    const isFinalFor16 = Math.max(...finalMatches.map((item) => item.finalSpot)) > 7;
    const dayMatches =
        matchesDay === 'yesterday' ? yesterdayMatches : matchesDay === 'tomorrow' ? tomorrowMatches : todayMatches;

    const joinDoublesLink = (() => {
        if (!isDoublesTeamCaptain) {
            return null;
        }

        return currentPlayer.joinDoublesLink;
    })();

    const isClaimingReward = (() => {
        if (!isChampion && !isRunnerUp) {
            return false;
        }
        if (isRunnerUp && isFinalWonDefault) {
            return false;
        }
        if (currentPlayer.address !== null) {
            return false;
        }
        if (isDoublesTeam && !currentPlayer.isDoublesTeamCaptain) {
            return false;
        }
        if (isDoublesTeam && currentPlayer.address) {
            return false;
        }
        if (dayjs().diff(dayjs(tournament.endDate), 'week', true) > 10) {
            return false;
        }

        return true;
    })();

    const canJoin = Boolean(
        !isOver && currentUser && !currentUser.tournaments[tournament.id] && hasAnyRole(currentUser, ['player'])
    );

    const showAllProposals = showAll || isLarge || proposals.length <= tooManyProposals;
    const visibleProposals = showAllProposals ? proposals : proposals.slice(0, firstProposals);
    const showCoaches = (isLive || isBreak) && isMyTournament && tournament.coaches && tournament.coaches.length > 0;

    const ActualFormNewMatch = isDoubles ? FormNewDoublesMatch : FormNewMatch;
    const ActualFormProposal = isDoubles ? FormDoublesProposal : FormProposal;
    const ActualProposal = isDoubles ? ProposalDoubles : Proposal;
    const ActualFormNewMatchByAdmin = isDoubles ? FormNewDoublesMatch : FormNewMatchByAdmin;

    const showRulesReminders = isMyTournament && isLive && !isDoublesTeamPlayerPool && !learnedTheRules;

    const markRulesAsLearned = async () => {
        if (learnedTheRules) {
            return;
        }

        setLearnedTheRules(true);
        await log({ code: 'learnedTheRules' });
        await dispatch(loadCurrentUser());
    };

    const quitLadder = async () => {
        const confirm = await confirmation({
            message: (
                <div>
                    You are about to quit this ladder. You cannot get back after that.
                    <br />
                    Are you sure?
                </div>
            ),
        });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put(`/api/players/${currentPlayerId}`, { action: 'quitTournament' });
        });

        notification({
            header: 'Success',
            message: `You successfully quit the ladder.`,
        });

        history.push('/');
        await dispatch(loadCurrentUser());
    };

    const getOtherActions = () => {
        const otherActions = [];

        if (!isMyTournament) {
            return otherActions;
        }

        if (isBreak) {
            otherActions.push(
                <Modal
                    key="proposeFriendlyMatch"
                    title="Propose Friendly Match"
                    renderTrigger={({ show }) => (
                        <button
                            type="button"
                            className="btn btn-light-primary border border-dashed border-primary"
                            onClick={show}
                        >
                            Propose friendly match
                        </button>
                    )}
                    renderBody={({ hide }) => (
                        <ActualFormProposal
                            tournament={tournament}
                            onSubmit={async (values) => {
                                await reloadTournament();
                                hide();
                            }}
                        />
                    )}
                />
            );
        }
        if (isSingle && (isLive || isBreak)) {
            otherActions.push(
                <Modal
                    key="proposePractice"
                    title="Propose Practice"
                    hasForm={false}
                    renderTrigger={({ show }) => (
                        <button
                            type="button"
                            className="btn btn-light-primary border border-dashed border-primary"
                            onClick={show}
                        >
                            Propose practice
                        </button>
                    )}
                    renderBody={({ hide }) => (
                        <ActualFormProposal
                            tournament={tournament}
                            isPractice
                            onSubmit={async () => {
                                await reloadTournament();
                                hide();
                            }}
                        />
                    )}
                />
            );
        }
        if (isLive && !isDoubles) {
            otherActions.push(
                <Modal
                    key="schedule"
                    title="Schedule Match"
                    renderTrigger={({ show }) => (
                        <button
                            type="button"
                            className="btn btn-light-primary border border-dashed border-primary"
                            onClick={checkUserReady(show)}
                        >
                            Schedule match
                        </button>
                    )}
                    renderBody={({ hide }) => (
                        <FormScheduleNewMatch
                            tournament={tournament}
                            onAdd={async () => {
                                await reloadTournament();
                                hide();
                                notification({
                                    header: 'Success',
                                    message: 'Your match has been scheduled.',
                                });
                            }}
                        />
                    )}
                />
            );
        }
        if (!isOver && isDoublesTeamCaptain) {
            otherActions.push(
                <Modal
                    key="changeTeamName"
                    title="Change Team Name"
                    renderTrigger={({ show }) => (
                        <button
                            type="button"
                            className="btn btn-light-primary border border-dashed border-primary"
                            onClick={show}
                        >
                            Change team name
                        </button>
                    )}
                    renderBody={({ hide }) => (
                        <FormChangeTeamName
                            playerId={currentPlayerId}
                            initialValues={{ teamName: currentPlayer.teamName }}
                            tournament={tournament}
                            onSubmit={async () => {
                                await reloadTournament();
                                hide();
                                notification({
                                    header: 'Success',
                                    message: 'The team name has been changed.',
                                });
                            }}
                        />
                    )}
                />
            );
            if (!isDoublesTeamAloneCaptain) {
                otherActions.push(
                    <Modal
                        key="replaceCaptain"
                        title="Replace Team Captain"
                        renderTrigger={({ show }) => (
                            <button
                                type="button"
                                className="btn btn-light-primary border border-dashed border-primary"
                                onClick={show}
                            >
                                Replace team captain
                            </button>
                        )}
                        renderBody={({ hide }) => (
                            <FormReplaceCaptain
                                hide={hide}
                                tournament={tournament}
                                onSubmit={async () => {
                                    await reloadTournament();
                                    hide();
                                    notification({
                                        header: 'Success',
                                        message: 'The captain has been replaced.',
                                    });
                                }}
                            />
                        )}
                    />
                );
            }
        }
        if (!isOver && isDoublesTeamPartner) {
            otherActions.push(
                <Modal
                    key="leaveTheTeam"
                    title="Leave the Team"
                    renderTrigger={({ show }) => (
                        <button
                            type="button"
                            className="btn btn-light-danger border border-dashed border-danger"
                            onClick={show}
                        >
                            Leave the team
                        </button>
                    )}
                    renderBody={({ hide }) => (
                        <FormLeaveTeam
                            hide={hide}
                            tournament={tournament}
                            onSubmit={async () => {
                                await reloadTournament();
                                hide();
                                notification({
                                    header: 'Success',
                                    message: 'You successfuly left the team.',
                                });
                            }}
                        />
                    )}
                />
            );
        }
        if (!isOver && isSingle) {
            otherActions.push(
                <Modal
                    key="moveToAnotherladder"
                    title="Move to another ladder"
                    hasForm={false}
                    renderTrigger={({ show }) => (
                        <button
                            type="button"
                            className="btn btn-light-primary border border-dashed border-primary"
                            onClick={show}
                        >
                            Move to another ladder
                        </button>
                    )}
                    renderBody={({ hide }) => (
                        <SwitchLadderForm
                            tournament={tournament}
                            onSubmit={(values) => {
                                hide();
                                notification({
                                    inModal: true,
                                    message: `You succesfully switched to the ${values.levelName} ladder.`,
                                    buttonTitle: `Go to ${values.levelName} ladder`,
                                    onHide: async () => {
                                        history.push(values.url);
                                        await dispatch(loadCurrentUser());
                                        queryClient.invalidateQueries();
                                    },
                                });
                            }}
                        />
                    )}
                />
            );
            otherActions.push(
                <button
                    key="quitLadder"
                    type="button"
                    className="btn btn-light-danger border border-dashed border-danger"
                    onClick={quitLadder}
                >
                    Quit ladder
                </button>
            );
        }

        return otherActions;
    };

    const renderUserActions = () => {
        const otherActions = getOtherActions();

        const actions = isDoublesTeamPlayerPool ? null : (
            <div className={style.actions}>
                <Modal
                    title="Propose Match"
                    renderTrigger={({ show }) => (
                        <button
                            type="button"
                            className="btn btn-light-primary border border-dashed border-primary"
                            onClick={checkUserReady(show)}
                        >
                            <div className="svg-icon svg-icon-primary">
                                <ClockIcon />
                            </div>
                            <div>
                                Propose
                                <br />
                                match
                            </div>
                        </button>
                    )}
                    renderBody={({ hide }) => (
                        <ActualFormProposal
                            tournament={tournament}
                            onSubmit={async () => {
                                await reloadTournament();
                                hide();
                            }}
                        />
                    )}
                />
                <Modal
                    title="Report match"
                    hasForm={false}
                    renderTrigger={({ show }) => (
                        <button
                            type="button"
                            className="btn btn-light-primary border border-dashed border-primary"
                            onClick={checkUserReady(show)}
                        >
                            <div className="svg-icon svg-icon-primary">
                                <MatchIcon />
                            </div>
                            <div>
                                Report
                                <br />
                                match
                            </div>
                        </button>
                    )}
                    size="sm"
                    renderBody={({ hide }) => (
                        <ActualFormNewMatch
                            possibleMatches={upcomingMatches}
                            tournament={tournament}
                            onAdd={async () => {
                                await reloadTournament();
                                hide();
                            }}
                        />
                    )}
                />
                <Tooltip
                    interactive
                    placement="bottom-end"
                    trigger="click"
                    arrow={false}
                    offset={[0, 2]}
                    theme="light"
                    content={
                        <div
                            className="d-grid m-2"
                            style={{ gap: '0.5rem', whiteSpace: 'normal', maxWidth: '16rem' }}
                            data-other-actions
                            onClick={() => {
                                otherActionsTooltipRef.current?.hide();
                            }}
                        >
                            {otherActions}
                        </div>
                    }
                    onShow={(instance) => {
                        otherActionsTooltipRef.current = instance;
                    }}
                >
                    <button type="button" className="btn btn-light-primary border border-dashed border-primary">
                        <div className="svg-icon svg-icon-primary">
                            <OtherIcon />
                        </div>
                        <div>
                            Other
                            <br />
                            actions
                        </div>
                    </button>
                </Tooltip>
            </div>
        );

        const upcomingMatchesList =
            upcomingMatches.length > 0 ? (
                <>
                    <h3>{isDoublesTeam ? "Your Team's Upcoming Matches" : 'Your Upcoming Sessions'}</h3>
                    <div className={style.matchWrapper} data-your-upcoming-matches>
                        {upcomingMatches.map((match) => {
                            if (match.practiceType) {
                                return (
                                    <Proposal
                                        key={match.id}
                                        match={match}
                                        onStatusUpdate={reloadTournament}
                                        tournament={tournament}
                                        isUpcomingPlayStyle
                                    />
                                );
                            }

                            return (
                                <Match
                                    key={match.id}
                                    match={match}
                                    players={players}
                                    onUpdate={reloadTournament}
                                    tournament={tournament}
                                    showWeekDay
                                    isUpcoming
                                />
                            );
                        })}
                    </div>
                </>
            ) : null;

        if (!actions && !upcomingMatchesList) {
            return null;
        }

        return (
            <Card>
                {actions}
                {upcomingMatchesList}
            </Card>
        );
    };

    const renderFinal = () => {
        if (isFinalTournament) {
            if (isDoubles) {
                return (
                    <Card>
                        <DoublesFinal
                            matches={tournament.doublesMatches}
                            players={players}
                            reloadTournament={reloadTournament}
                            showTournamentText={isBreak}
                            tournament={tournament}
                        />
                    </Card>
                );
            }

            // if single
            return (
                <Card>
                    <Final
                        matches={finalMatches}
                        players={players}
                        reloadTournament={reloadTournament}
                        showTournamentText={isBreak}
                        tournament={tournament}
                    />
                </Card>
            );
        }

        if (!isBreak) {
            return null;
        }

        if (cancelFinalTournament) {
            return (
                <Card>
                    <h3>Final Tournament</h3>
                    <CancelMessage tournament={tournament} />
                </Card>
            );
        }

        return null;
    };

    const renderOverview = ({ showWeather = true } = {}) => {
        return (
            <Card>
                <Summary tournament={tournament} showWeather={showWeather} />

                {showRulesReminders && (
                    <div className="alert alert-primary mb-0 mt-4">
                        <div className="fs-3 fw-bold mb-4">Reminders About Rival Rules</div>
                        <ol className="ps-4">
                            <li>Always bring a new can of balls for every match. The winner takes the unopened can.</li>
                            <li>Winners must insert this week&apos;s scores by midnight on Sunday.</li>
                            <li>
                                If you don&apos;t arrive within 15 minutes to your match, and you don&apos;t notify your
                                opponent, you could be subject to a Default loss.
                            </li>
                        </ol>
                        <div className="mb-6">
                            Read the <Link to="/rules">Rival Rules</Link> for more info.
                        </div>
                        <button className="btn btn-primary" type="button" onClick={markRulesAsLearned}>
                            Got it!
                        </button>
                    </div>
                )}

                {canJoin && (
                    <div className="mt-4">
                        <Link to="/register" className="btn btn-primary w-100">
                            Join this ladder
                        </Link>
                    </div>
                )}
            </Card>
        );
    };

    const renderCompleteTeamBlock = () => {
        if (!isDoublesTeam || isOver) {
            return null;
        }

        const showInviteLink = isDoublesTeamCaptain && !isDoublesTeamFull;
        const showPlayerPool =
            (!currentUser || !currentPlayerId || isDoublesTeamCaptain || isDoublesTeamPlayerPool) && !isDoublesTeamFull;

        if (!showInviteLink && !showPlayerPool) {
            return null;
        }

        return (
            <Card
                tooltip={
                    showPlayerPool ? (
                        <div className="text-start p-2">
                            <h4 className="text-white">Player Pool</h4>
                            <div>
                                This is a list of individuals actively seeking to join a team. By joining the pool, you
                                make yourself available to teams looking to fill spots or other players who want to
                                start a new team.
                            </div>
                        </div>
                    ) : null
                }
            >
                <div className="d-grid gap-8">
                    {showInviteLink && (
                        <div>
                            <h3>Complete Your Team</h3>
                            <div>
                                <div>Share this link with your friends for them to join:</div>
                                <div>
                                    <Copy
                                        label={
                                            <a href={joinDoublesLink} target="_blank" rel="noreferrer">
                                                Link
                                            </a>
                                        }
                                        stringToCopy={joinDoublesLink}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    {showPlayerPool && <PlayerPool tournament={tournament} onSubmit={reloadTournament} />}
                </div>
            </Card>
        );
    };

    const renderAdminActions = () => {
        if (!isLive) {
            return null;
        }

        return (
            <Card>
                <h3>Admin actions</h3>
                <div className="d-grid gap-2">
                    <Modal
                        title="Report match"
                        hasForm={false}
                        renderTrigger={({ show }) => (
                            <button type="button" className="btn btn-primary" onClick={show}>
                                Report match
                            </button>
                        )}
                        size="sm"
                        renderBody={({ hide }) => (
                            <ActualFormNewMatchByAdmin
                                tournament={tournament}
                                onAdd={async () => {
                                    await reloadTournament();
                                    hide();
                                }}
                            />
                        )}
                    />
                    {!isDoubles && (
                        <Modal
                            title="Schedule match"
                            hasForm={false}
                            renderTrigger={({ show }) => (
                                <button type="button" className="btn btn-primary" onClick={show}>
                                    Schedule match
                                </button>
                            )}
                            size="sm"
                            renderBody={({ hide }) => (
                                <FormScheduleNewMatch
                                    tournament={tournament}
                                    onAdd={async () => {
                                        await reloadTournament();
                                        hide();
                                        notification({
                                            header: 'Success',
                                            message: 'The match was successfuly scheduled.',
                                        });
                                    }}
                                />
                            )}
                        />
                    )}
                </div>
            </Card>
        );
    };

    const renderOpenProposals = () => (
        <Card>
            <div data-open-proposals>
                <h3>{isBreak ? 'Open Friendly Proposals' : 'Open Proposals'}</h3>
                {visibleProposals.length > 0 ? (
                    <div className={style.proposalsWrapper + ' mt-4'}>
                        {visibleProposals.map((match, index) => {
                            return (
                                <ActualProposal
                                    key={match.id}
                                    match={match}
                                    onStatusUpdate={reloadTournament}
                                    tournament={tournament}
                                    showWeather
                                    showElo
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="mt-4">No proposals found.</div>
                )}
                {!showAllProposals && (
                    <div className="mt-4">
                        <a
                            href=""
                            onClick={(e) => {
                                e.preventDefault();
                                setShowAll(true);
                            }}
                        >
                            <span className="svg-icon svg-icon-2 svg-icon-primary me-2">
                                <ArrowDownIcon />
                            </span>
                            Show all {proposals.length} proposals
                        </a>
                    </div>
                )}
            </div>
        </Card>
    );

    const otherActions = getOtherActions();
    const renderFinalParticipation = () => (
        <Card>
            <FinalParticipation
                tournament={tournament}
                onStatusUpdate={reloadTournament}
                allowUpdate={allowChangeParticipationStatus}
            />
        </Card>
    );

    const renderShowPlayersToggle = () => (
        <div className="form-check form-switch form-check-custom form-check-solid">
            <input
                className="form-check-input h-20px w-30px"
                type="checkbox"
                value=""
                id="showPlayersToggle"
                checked={showDoublesPlayers}
                onChange={() => setShowDoublesPlayers(!showDoublesPlayers)}
                style={{ cursor: 'pointer' }}
            />
            <label className="form-check-label" htmlFor="showPlayersToggle">
                Show players
            </label>
        </div>
    );

    const bananas = settings.bananas.filter((item) => item.images.square);

    return (
        <div className="position-relative d-grid gap-6" key={tournament.id}>
            {isClaimingReward ? (
                <Card>
                    <ClaimReward isChampion={isChampion} tournament={tournament} reloadTournament={reloadTournament} />
                </Card>
            ) : null}
            {isMobile && renderOverview()}
            {isOver && winner && isMobile ? (
                <Card>
                    <Winner player={players[winner]} />
                </Card>
            ) : null}
            {isOver && (!isLarge || isFinalFor16) && renderFinal()}
            {isMobile && isMyTournament && showFinalReminder && renderFinalParticipation()}
            {isMobile && isLive && isMyTournament && renderUserActions()}
            {isMobile && !isLive && isMyTournament && otherActions.length > 0 && (
                <Card>
                    <div className="d-grid gap-2">{otherActions}</div>
                </Card>
            )}
            {isMobile && isAdmin && renderAdminActions()}
            {isMobile && (isBreak || isLive) && renderOpenProposals()}
            {isMobile && renderCompleteTeamBlock()}
            <div className={style.page} data-overview-content>
                <div className={style.main}>
                    {isOver && isLarge && !isFinalFor16 && renderFinal()}
                    {!isMobile && isMyTournament && showFinalReminder && renderFinalParticipation()}
                    <Card
                        tooltip={
                            <div className="text-start p-2">
                                {isLive && (
                                    <>
                                        <h4 className="text-white">Live</h4>
                                        <div>
                                            Projected player rank by total points gained. Updated after every match.
                                        </div>
                                    </>
                                )}

                                <h4 className="text-white">Rank</h4>
                                <div>
                                    Official current player rank. Used to calculate{' '}
                                    <Link to="/scoring">match points gained</Link>. Updated every Monday.
                                </div>

                                {!isDoubles && !isDoublesTeam && (
                                    <>
                                        <h4 className="text-white">TLR</h4>
                                        <div>
                                            <div>
                                                <Link to="/tlr">Tennis Ladder Rating</Link> (TLR) shows player skill
                                                over time. Updated after every match.
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        }
                        tooltipProps={{ interactive: true, delay: [null, 200], appendTo: () => document.body }}
                    >
                        <div className="d-flex justify-content-between mb-6">
                            <div className="d-flex align-items-center">
                                <h3 className="m-0">
                                    {isDoublesTeam ? 'Teams' : 'Players'}
                                    <span className="badge badge-secondary ms-2 align-middle">{totalPlayers}</span>
                                </h3>
                                {isDoublesTeam && !isXs && <div className="ms-6">{renderShowPlayersToggle()}</div>}
                            </div>
                            {playersModeTabs}
                        </div>
                        {isDoublesTeam && isXs && <div className="mb-6 mt-n2">{renderShowPlayersToggle()}</div>}
                        {playersMode === 'live' && (
                            <PlayersLive tournament={tournament} showDoublesPlayers={showDoublesPlayers} />
                        )}
                        {playersMode === 'points' && (
                            <PlayersByPoints tournament={tournament} showDoublesPlayers={showDoublesPlayers} />
                        )}
                        {playersMode === 'elo' && <PlayersByElo tournament={tournament} />}
                    </Card>
                </div>
                <div className={classnames(style.sidebar, { [style.over]: isOver })}>
                    {!isMobile && renderOverview()}
                    {!isMobile && isOver && winner ? (
                        <Card>
                            <Winner player={players[winner]} />
                        </Card>
                    ) : null}
                    {!isMobile && isAdmin && renderAdminActions()}
                    {!isMobile && isLive && isMyTournament && renderUserActions()}
                    {!isMobile && !isLive && isMyTournament && otherActions.length > 0 && (
                        <Card>
                            <div className="d-grid gap-2">{otherActions}</div>
                        </Card>
                    )}
                    {!isMobile && (isBreak || isLive) && renderOpenProposals()}
                    {isOver && playedMatches.length > 0 && (
                        <>
                            <Card tooltip="Players with the most matches played including the tournament. Default matches don't count.">
                                <MostMatches tournament={tournament} />
                            </Card>
                            {!isDoubles && !isDoublesTeam && tournament.mostProgress.length > 0 && (
                                <Card tooltip="Players who gained the most TLR points during the season.">
                                    <MostProgress tournament={tournament} />
                                </Card>
                            )}
                            {!isDoubles && !isDoublesTeam && tournament.topForm.length > 0 && (
                                <Card tooltip="Players who achieved their highest TLR during the season. Player has to play at least two seasons to be in the list.">
                                    <TopForm tournament={tournament} />
                                </Card>
                            )}
                            {!isDoubles && !isDoublesTeam && topUpsetMatches.length > 0 && (
                                <Card tooltip="Matches where players overcame the greatest TLR disparity.">
                                    <h3 className="mb-6">Biggest Wins</h3>
                                    <div style={{ display: 'grid', gridGap: '2rem' }}>
                                        {topUpsetMatches.map((match, index) => {
                                            const challenger = players[match.challengerId];
                                            const acceptor = players[match.acceptorId];
                                            return (
                                                <UpsetMatch
                                                    key={match.id}
                                                    match={match}
                                                    challenger={challenger}
                                                    acceptor={acceptor}
                                                    extraData={`${getEloDifference(match)} TLR diff`}
                                                />
                                            );
                                        })}
                                    </div>
                                </Card>
                            )}
                        </>
                    )}
                    {!isMobile && renderCompleteTeamBlock()}
                    {isLive && (
                        <Card>
                            <div className="d-flex justify-content-between mb-4">
                                <h3>Matches</h3>
                                {matchesTabs}
                            </div>
                            <div data-today-matches>
                                {dayMatches.length > 0 ? (
                                    <div className={style.matchWrapper}>
                                        {dayMatches.map((match) => (
                                            <Match
                                                key={match.id}
                                                match={match}
                                                players={players}
                                                onUpdate={reloadTournament}
                                                tournament={tournament}
                                                onlyTime
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div>No matches {matchesDay}.</div>
                                )}
                            </div>
                        </Card>
                    )}
                    {showCoaches && (
                        <Card>
                            <h3>Tennis Coaches</h3>
                            <div>
                                <Coach list={tournament.coaches} />
                            </div>
                        </Card>
                    )}
                    {bananas.length > 0 && (
                        <Card>
                            <h3>Our Partner{bananas.length > 1 ? 's' : ''}</h3>
                            <div className="d-grid gap-6">
                                {bananas.map((banana) => (
                                    <a
                                        key={banana.name}
                                        href={banana.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        data-banana-partner={banana.partner}
                                        onClick={() => {
                                            log({ code: `click-ladder-banana-${banana.partner}` });
                                        }}
                                    >
                                        <img
                                            className={style.banana}
                                            src={banana.images.square.src}
                                            alt={banana.name}
                                            style={{
                                                aspectRatio: banana.images.square.width / banana.images.square.height,
                                            }}
                                        />
                                    </a>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

Overview.propTypes = {
    tournament: PropTypes.object,
    reloadTournament: PropTypes.func,
};

Overview.defaultProps = {};

export default Overview;
