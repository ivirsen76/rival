/* eslint-disable react/no-array-index-key */
import { useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import style from './style.module.scss';
import CommentIcon from '@rival/packages/metronic/icons/duotone/Interface/Comment.svg?react';
import ChartIcon from '@rival/packages/metronic/icons/duotone/Shopping/Chart-bar1.svg?react';
import OtherIcon from '@rival/packages/metronic/icons/duotone/General/Other2.svg?react';
import MarkerIcon from '@rival/packages/metronic/icons/duotune/general/gen018.svg?react';
import BattleIcon from '@/assets/battle1.svg?react';
import PointsIcon from './points.svg?react';
import { formatShort, formatMiddle, formatLong } from '@/utils/dayjs';
import Modal from '@/components/Modal';
import FormMatch from '@/components/FormMatch';
import FormScheduleMatch from '@/components/FormScheduleMatch';
import FormReplacePlayers from '@/components/FormReplacePlayers';
import FormReplaceTeamPlayers from '@/components/FormReplaceTeamPlayers';
import FormAddStats from '@/components/FormAddStats';
import notification from '@/components/notification';
import Tooltip from '@/components/Tooltip';
import FormDeleteProposal from '@/components/FormDeleteProposal';
import FormDeleteMatch from '@/components/FormDeleteMatch';
import FormDeleteDoublesProposal from '@/components/FormDeleteDoublesProposal';
import confirmation from '@/utils/confirmation';
import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerName from '@/components/PlayerName';
import Stats from './Stats';
import axios from '@/utils/axios';
import showLoader from '@/utils/showLoader';
import useScoreUpdated from './useScoreUpdated';
import getRelativeStringLength from '@/utils/getRelativeStringLength';
import parseScore from './parseScore';
import getPointsCalculation from './getPointsCalculation';
import {
    completeInjuryFullScore,
    completeInjuryFastScore,
    isFullSetScoreCorrect,
    isFastSetScoreCorrect,
    isFullScoreCorrect,
    isFastScoreCorrect,
} from '@rival/ladder.backend/src/services/matches/helpers';
import formatElo from '@rival/ladder.backend/src/utils/formatElo';
import useConfig from '@/utils/useConfig';
import useMatchPermissions from '@/utils/useMatchPermissions';
import { BYE_ID } from '@rival/ladder.backend/src/constants';
import matchFormatOptions from '@rival/ladder.backend/src/services/proposals/matchFormatOptions';

const isLongName = player => {
    return getRelativeStringLength(player.firstName + ' ' + player.lastName) > 15;
};

const Match = props => {
    const {
        match,
        onUpdate,
        onlyTime,
        showWeekDay,
        readOnly,
        isUpcoming,
        players,
        hideReplacePlayersAction,
        isReport,
        tournament,
        showHeader,
        emulateMyMatch,
        showInfo,
        showTeamsSign,
        scoreModalInterceptor,
    } = props;
    const {
        canDeleteMatch,
        canDeleteProposal,
        canUnacceptProposal,
        canScheduleMatch,
        canRescheduleMatch,
        canReportScore,
        canEditScore,
        canUploadStatistics,
        canClearResult,
        canReplacePlayers,
        canSeeMatchDetails,
        canSeeContact,
        canReplaceTeamPlayers,
    } = useMatchPermissions({ tournament, match, emulateMyMatch, readOnly });
    const tooltipRef = useRef();
    const isScoreUpdated = useScoreUpdated(match.score);
    const config = useConfig();

    const challenger = props.challenger || players[match.challengerId];
    const challenger2 = players[match.challenger2Id];
    const acceptor = props.acceptor || players[match.acceptorId];
    const acceptor2 = players[match.acceptor2Id];

    const isTournamentOver = Boolean(tournament?.isOver);
    const sets = parseScore(match.score);
    const isDoubles = tournament.levelType === 'doubles';
    const isDoublesTeam = tournament.levelType === 'doubles-team';
    const isPlayed = match.score && match.playedAt;
    const showPoints =
        isPlayed &&
        match.challengerPoints !== null &&
        match.acceptorPoints !== null &&
        (match.initial !== 5 || match.unavailable !== 1);
    const hasBye = challenger.id === BYE_ID || acceptor.id === BYE_ID;
    const hasPlayers = !hasBye && challenger.id !== 0 && acceptor.id !== 0;
    const isRegularTeamMatch = match.initial === 5 && !isTournamentOver;
    const showPointsCalculation =
        !isTournamentOver && match.score && !match.wonByDefault && !match.battleId && match.type === 'regular';
    const isChallengerWon = challenger.partnerIds
        ? challenger.partnerIds.includes(match.winner)
        : match.winner === match.challengerId;
    const isAcceptorWon = acceptor.partnerIds
        ? acceptor.partnerIds.includes(match.winner)
        : match.winner === match.acceptorId;
    const isFast4 = match.matchFormat === 2;
    const completeInjuryScore = isFast4 ? completeInjuryFastScore : completeInjuryFullScore;
    const isSetScoreCorrect = isFast4 ? isFastSetScoreCorrect : isFullSetScoreCorrect;
    const isScoreCorrect = isFast4 ? isFastScoreCorrect : isFullScoreCorrect;

    const ActualFormDeleteProposal = isDoubles ? FormDeleteDoublesProposal : FormDeleteProposal;

    const clearMatchResult = async () => {
        const confirm = await confirmation({
            message: (
                <div>
                    You are about to clear the match result.
                    <br />
                    Are you sure?
                </div>
            ),
        });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put(`/api/matches/${match.id}`, { action: 'clearResult' });
            await onUpdate();

            notification({
                header: 'Success',
                message: 'Match result was successfully cleared.',
            });
        });
    };

    const renderPlayedAt = () => {
        if (!match.playedAt) {
            return <>&nbsp;</>;
        }

        if (onlyTime) {
            return <span data-playwright-placeholder="short">{formatShort(match.playedAt)}</span>;
        }

        if (showWeekDay) {
            return <span data-playwright-placeholder="short">{formatLong(match.playedAt)}</span>;
        }

        return <span data-playwright-placeholder="middle">{formatMiddle(match.playedAt)}</span>;
    };

    const renderElo = elo => <div className={'badge badge-small bg-white ' + style.elo}>{formatElo(elo)}</div>;

    const getEloChange = (elo, diff) => {
        const prev = elo - diff;
        const unsignedDiff = Math.abs(diff);

        return (
            <div className={style.eloEquation}>
                <div>{formatElo(prev)}</div>
                <div className={classnames(diff < 0 && style.negative, diff > 0 && style.positive)}>
                    {diff < 0 ? '-' : '+'} {formatElo(unsignedDiff)}
                </div>
                <div>=</div>
                {renderElo(elo)}
            </div>
        );
    };

    const getEloPrediction = () => {
        const tlrToEloK = 6;
        const eloDiff = (challenger.elo.elo - acceptor.elo.elo) * tlrToEloK;
        const challengerWinPercent = (() => {
            const odds = 10 ** (eloDiff / 400);
            return Math.round((odds / (odds + 1)) * 100);
        })();

        const predictionMessage =
            !challenger.elo.isEloEstablished || !acceptor.elo.isEloEstablished
                ? 'Uncertain'
                : challengerWinPercent >= 50
                ? `${challenger.firstName} wins (${challengerWinPercent}%)`
                : `${acceptor.firstName} wins (${100 - challengerWinPercent}%)`;

        return (
            <div>
                <div className="fw-bold">
                    {challenger.firstName} {challenger.lastName}
                </div>
                {challenger.elo.isEloEstablished ? (
                    <div className={'badge badge-small bg-white mt-1 ' + style.elo}>
                        {formatElo(challenger.elo.elo)}
                    </div>
                ) : (
                    <div className={style.muted}>TLR not established</div>
                )}

                <div className="fw-bold mt-4">
                    {acceptor.firstName} {acceptor.lastName}
                </div>
                {acceptor.elo.isEloEstablished ? (
                    <div className={'badge badge-small bg-white mt-1 ' + style.elo}>{formatElo(acceptor.elo.elo)}</div>
                ) : (
                    <div className={style.muted}>TLR not established</div>
                )}

                <div className="fw-bold mt-4">Prediction</div>
                <div className={style.muted}>{predictionMessage}</div>
            </div>
        );
    };

    const getEloContent = () => {
        if (isDoubles || isDoublesTeam || !isPlayed) {
            return null;
        }

        return (
            <div className="p-1">
                <div className="fw-bold">
                    {challenger.firstName} {challenger.lastName}
                </div>
                {match.challengerMatches < config.minMatchesToEstablishTlr ? (
                    <div className={style.muted}>TLR not established</div>
                ) : match.wonByDefault ? (
                    renderElo(match.challengerElo)
                ) : match.challengerMatches === config.minMatchesToEstablishTlr ? (
                    <div className={style.muted}>{renderElo(match.challengerElo)} - Initial TLR</div>
                ) : (
                    getEloChange(match.challengerElo, match.challengerEloChange)
                )}

                {challenger2 && (
                    <>
                        <div className="fw-bold mt-2">
                            {challenger2.firstName} {challenger2.lastName}
                        </div>
                        {match.wonByDefault ? (
                            <div>{match.challenger2Elo}</div>
                        ) : (
                            getEloChange(match.challenger2Elo, match.challenger2EloChange)
                        )}
                    </>
                )}

                <div className="fw-bold mt-2">
                    {acceptor.firstName} {acceptor.lastName}
                </div>
                {match.acceptorMatches < config.minMatchesToEstablishTlr ? (
                    <div className={style.muted}>TLR not established</div>
                ) : match.wonByDefault ? (
                    renderElo(match.acceptorElo)
                ) : match.acceptorMatches === config.minMatchesToEstablishTlr ? (
                    <div className={style.muted}>{renderElo(match.acceptorElo)} - Initial TLR</div>
                ) : (
                    getEloChange(match.acceptorElo, match.acceptorEloChange)
                )}

                {acceptor2 && (
                    <>
                        <div className="fw-bold mt-2">
                            {acceptor2.firstName} {acceptor2.lastName}
                        </div>
                        {match.wonByDefault ? (
                            <div>{match.acceptor2Elo}</div>
                        ) : (
                            getEloChange(match.acceptor2Elo, match.acceptor2EloChange)
                        )}
                    </>
                )}

                {match.wonByDefault ? (
                    <div className={style.muted + ' mt-2'}>
                        TLR is not affected
                        <br />
                        for matches
                        <br />
                        won by default
                    </div>
                ) : null}
            </div>
        );
    };

    const getPointsContent = () => {
        if (!isPlayed) {
            return false;
        }

        const getAverageRank = (rank1, rank2) => Math.floor((rank1 + rank2) / 2);

        const calc = getPointsCalculation({
            challengerRank: isDoubles
                ? getAverageRank(match.challengerRank, match.challenger2Rank)
                : match.challengerRank,
            acceptorRank: isDoubles ? getAverageRank(match.acceptorRank, match.acceptor2Rank) : match.acceptorRank,
            score: match.wonByInjury ? completeInjuryScore(match.score, isChallengerWon) : match.score,
        });

        const replaceVars = str => {
            ['participationBonus', 'challengerBonus', 'rankDiff', 'totalGames', 'gamesDiff'].forEach(name => {
                str = str.replace(name, `<span class="${style[name]}">${calc[name]}</span>`);
            });

            ['challengerPoints', 'acceptorPoints'].forEach(name => {
                str = str.replace(
                    name,
                    `<span class="badge badge-small badge-square ${style.resultedPoints}">${calc[name]}</span>`
                );
            });

            ['winOverHigher', 'winOverEqual', 'winOverLower'].forEach(name => {
                str = str.replace(name, `<span class="${style.winPoints}">${calc[name]}</span>`);
            });

            return str;
        };

        const looserName = (() => {
            if (!isDoubles && !isDoublesTeam) {
                return isChallengerWon ? players[match.acceptorId].firstName : players[match.challengerId].firstName;
            }

            return isChallengerWon ? (
                <PlayerName player1={acceptor} player2={acceptor2} highlight={false} />
            ) : (
                <PlayerName player1={challenger} player2={challenger2} highlight={false} />
            );
        })();

        const winnerList = (
            <>
                <div className={style.winPoints}>{calc.winOverLower || calc.winOverEqual || calc.winOverHigher}</div>
                <div>-</div>
                <div>{`Win over ${calc.winOverLower ? 'lower' : calc.winOverEqual ? 'equal' : 'higher'} rank`}</div>

                {calc.rankDiff && (
                    <>
                        <div>
                            <span className={style.rankDiff}>{calc.rankDiff}</span>
                        </div>
                        <div>-</div>
                        <div>
                            Rank difference{calc.isRankDiffMax ? ` (Max 10)` : ''}
                            {calc.isRankDiffMin ? ` (Min 2)` : ''}
                        </div>
                    </>
                )}

                <div className={style.gamesDiff}>{calc.gamesDiff}</div>
                <div>-</div>
                <div>
                    Games difference
                    {calc.isGamesDiffMin ? ` (Min 2)` : ''}
                </div>
            </>
        );

        const looserList = (
            <>
                <div>
                    <span className={style.totalGames}>{calc.totalGames}</span>
                </div>
                <div>-</div>
                <div>
                    Total games won by {looserName}
                    {calc.isTotalGamesMax ? ` (Max 10)` : ''}
                </div>
            </>
        );

        const injuryExplanation = (() => {
            if (!match.wonByInjury || isScoreCorrect(match.score)) {
                return null;
            }

            const completeScore = completeInjuryScore(match.score, isChallengerWon);

            return (
                <div className="mb-4">
                    <span className={'badge badge-small ' + style.completeScore}>{completeScore}</span> - Score for
                    calculation
                </div>
            );
        })();

        return (
            <div className={style.pointsFormula}>
                <h3 className="text-white">Points Calculation</h3>

                {injuryExplanation}

                <div className={style.legend}>
                    <div className={style.participationBonus}>{calc.participationBonus}</div>
                    <div>-</div>
                    <div>Participation points</div>

                    <div className={style.challengerBonus}>{calc.challengerBonus}</div>
                    <div>-</div>
                    <div>Challenger points</div>
                    {isChallengerWon ? (
                        <>
                            {winnerList}
                            {looserList}
                        </>
                    ) : (
                        <>
                            {looserList}
                            {winnerList}
                        </>
                    )}
                </div>

                <div className="fw-bold">
                    <PlayerName player1={challenger} player2={challenger2} />
                </div>
                <div
                    className={style.formula}
                    dangerouslySetInnerHTML={{ __html: replaceVars(calc.challengerFormula) }}
                />

                <div className="fw-bold mt-4">
                    <PlayerName player1={acceptor} player2={acceptor2} />
                </div>
                <div
                    className={style.formula}
                    dangerouslySetInnerHTML={{ __html: replaceVars(calc.acceptorFormula) }}
                />
            </div>
        );
    };

    const actions = [];
    if (canSeeMatchDetails) {
        const matchFormat =
            match.matchFormat && match.matchFormat > 0
                ? matchFormatOptions.find(item => item.value === match.matchFormat).label
                : null;

        actions.push(
            <div className="text-start mb-3" key="proposal-actions">
                <div className="fw-bold mb-2">Match details:</div>
                <div className="d-flex">
                    <span className="svg-icon svg-icon-1 svg-icon-gray-700 me-2">
                        <MarkerIcon />
                    </span>
                    <div>{match.place}</div>
                </div>
                {matchFormat ? (
                    <div className="d-flex mt-1">
                        <span className="svg-icon svg-icon-1 svg-icon-gray-700 me-2">
                            <BattleIcon />
                        </span>
                        <div className="tl-fixed-value">{matchFormat}</div>
                    </div>
                ) : null}
                {match.comment ? (
                    <div className="d-flex mt-1">
                        <span className="svg-icon svg-icon-1 svg-icon-gray-700 me-2">
                            <CommentIcon />
                        </span>
                        <div>{match.comment}</div>
                    </div>
                ) : null}
            </div>
        );
    }
    if (canUnacceptProposal) {
        actions.push(
            <Modal
                key="unaccept-proposal"
                title="Unaccept proposal"
                renderTrigger={({ show }) => (
                    <button
                        type="button"
                        className="btn btn-warning btn-sm w-100"
                        data-delete-match={match.id}
                        onClick={show}
                    >
                        Unaccept proposal
                    </button>
                )}
                renderBody={({ hide }) => (
                    <ActualFormDeleteProposal match={match} tournament={tournament} onSubmit={onUpdate} />
                )}
            />
        );
    }
    if (canRescheduleMatch) {
        actions.push(
            <Modal
                key="reschedule"
                title="Reschedule match"
                renderTrigger={({ show }) => (
                    <button
                        type="button"
                        className="btn btn-primary btn-sm w-100"
                        onClick={show}
                        data-reschedule-match={match.id}
                    >
                        Reschedule match
                    </button>
                )}
                size="sm"
                renderBody={({ hide }) => (
                    <FormScheduleMatch
                        match={match}
                        tournament={tournament}
                        onSubmit={async () => {
                            await onUpdate();
                            hide();
                            notification({
                                header: 'Success',
                                message: 'The match was successfuly rescheduled.',
                            });
                        }}
                    />
                )}
            />
        );
    }
    if (canEditScore) {
        actions.push(
            <Modal
                key="edit"
                title="Edit match"
                hasForm={false}
                renderTrigger={({ show }) => (
                    <button type="button" className="btn btn-primary btn-sm" onClick={show} data-edit-match={match.id}>
                        Edit
                    </button>
                )}
                size="sm"
                renderBody={({ hide }) => (
                    <FormMatch
                        tournament={tournament}
                        match={match}
                        onUpdate={async () => {
                            await onUpdate();
                            hide();
                        }}
                    />
                )}
            />
        );
    }
    if (canUploadStatistics) {
        actions.push(
            <Modal
                key="swing"
                title="Upload statistics"
                size="lg"
                renderTrigger={({ show }) => (
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={show}
                        data-add-stats-match={match.id}
                    >
                        Upload statistics
                    </button>
                )}
                renderBody={({ hide }) => (
                    <FormAddStats
                        match={match}
                        onSubmit={async values => {
                            await onUpdate();
                            notification({
                                inModal: true,
                                title: 'Match statistics',
                                render: () => <Stats match={values} challenger={challenger} acceptor={acceptor} />,
                                modalProps: { size: 'xl', keyboard: true },
                            });
                            hide();
                        }}
                    />
                )}
            />
        );
    }
    if (canClearResult) {
        actions.push(
            <button
                key="clear"
                type="button"
                className="btn btn-danger btn-sm"
                data-clear-match-result={match.id}
                onClick={clearMatchResult}
            >
                Clear result
            </button>
        );
    }
    if (canDeleteMatch) {
        actions.push(
            <Modal
                key="delete-match"
                title="Delete match"
                renderTrigger={({ show }) => (
                    <button
                        type="button"
                        className="btn btn-danger btn-sm w-100"
                        data-delete-match={match.id}
                        onClick={show}
                    >
                        Delete match
                    </button>
                )}
                renderBody={() => <FormDeleteMatch match={match} onSubmit={onUpdate} />}
            />
        );
    }
    if (canDeleteProposal) {
        actions.push(
            <Modal
                key="delete-proposal"
                title="Delete proposal"
                renderTrigger={({ show }) => (
                    <button
                        type="button"
                        className="btn btn-danger btn-sm w-100"
                        data-delete-match={match.id}
                        onClick={show}
                    >
                        Delete proposal
                    </button>
                )}
                renderBody={() => (
                    <ActualFormDeleteProposal match={match} tournament={tournament} onSubmit={onUpdate} />
                )}
            />
        );
    }

    if (!hideReplacePlayersAction && canReplacePlayers) {
        actions.push(
            <Modal
                key="replace"
                title="Replace players"
                renderTrigger={({ show }) => (
                    <button type="button" className="btn btn-primary btn-sm" onClick={show}>
                        Replace players
                    </button>
                )}
                renderBody={({ hide }) => (
                    <FormReplacePlayers
                        match={match}
                        players={players}
                        onSubmit={async () => {
                            await onUpdate();
                            hide();
                        }}
                    />
                )}
            />
        );
    }

    if (canReplaceTeamPlayers) {
        actions.push(
            <Modal
                key="replaceTeammates"
                title="Replace players"
                renderTrigger={({ show }) => (
                    <button type="button" className="btn btn-primary btn-sm" onClick={show}>
                        Replace players
                    </button>
                )}
                renderBody={({ hide }) => (
                    <FormReplaceTeamPlayers
                        match={match}
                        players={players}
                        onSubmit={async () => {
                            await onUpdate();
                            hide();
                        }}
                    />
                )}
            />
        );
    }

    const defaultBadge = (
        <td>
            <div className={'badge badge-warning ms-2 ps-2 pe-2 ' + style.default}>Default</div>
        </td>
    );

    const unavailableBadge = (
        <td>
            <div className={'badge badge-warning ms-2 ' + style.unavailable} data-unavailable-sign>
                Unavailable
            </div>
        </td>
    );

    const showMatchLocation = match.type === 'final' && match.playedAt && !match.score && match.place;

    const injuryBadge = (
        <td>
            <Tooltip content="Retirement">
                <div className={'badge badge-danger ms-2 me-2 ' + style.injury}>Ret.</div>
            </Tooltip>
        </td>
    );

    return (
        <div className={style.wrapper} data-match={match.id} data-final-spot={match.finalSpot}>
            {showHeader && (
                <div className={style.header}>
                    <div className="me-8 d-flex align-items-center">
                        <div className={style.time}>{hasBye ? <>&nbsp;</> : renderPlayedAt()}</div>
                        {showMatchLocation && (
                            <Tooltip content={match.place}>
                                <div className={'ms-1 ' + style.location} data-final-match-location={match.id}>
                                    <MarkerIcon />
                                </div>
                            </Tooltip>
                        )}
                        {isRegularTeamMatch && showTeamsSign && (
                            <Tooltip content="Teams match">
                                <div className={'ms-2 ' + style.teamMatch} data-teams-match={match.id}>
                                    T
                                </div>
                            </Tooltip>
                        )}
                    </div>
                    {!isReport && (
                        <div className={style.icons}>
                            {actions.length > 0 && (
                                <Tooltip
                                    interactive
                                    placement="bottom-start"
                                    trigger="click"
                                    arrow={false}
                                    offset={[0, 2]}
                                    theme="light"
                                    content={
                                        <div
                                            className="d-grid m-2"
                                            style={{ gridGap: '0.5rem', whiteSpace: 'normal', maxWidth: '16rem' }}
                                            data-match-actions-content
                                            onClick={() => {
                                                tooltipRef.current && tooltipRef.current.hide();
                                            }}
                                        >
                                            {actions}
                                        </div>
                                    }
                                    onShow={instance => {
                                        tooltipRef.current = instance;
                                    }}
                                >
                                    <button
                                        type="button"
                                        className="btn btn-link btn-color-muted btn-active-color-primary p-0"
                                        data-match-actions={match.id}
                                    >
                                        <span className="svg-icon svg-icon-2">
                                            <OtherIcon />
                                        </span>
                                    </button>
                                </Tooltip>
                            )}
                            {isPlayed && (
                                <>
                                    {match.stat && (
                                        <Modal
                                            title="Match statistics"
                                            size="xl"
                                            hasForm={false}
                                            renderTrigger={({ show }) => (
                                                <a
                                                    href="#"
                                                    className="btn btn-link btn-active-icon-primary p-0"
                                                    style={{ position: 'relative', top: '-0.1rem' }}
                                                    data-match-stats={match.id}
                                                    onClick={async e => {
                                                        e.preventDefault();
                                                        show();
                                                    }}
                                                >
                                                    <span className="svg-icon svg-icon-4">
                                                        <ChartIcon />
                                                    </span>
                                                </a>
                                            )}
                                            renderBody={({ hide }) => (
                                                <Stats match={match} challenger={challenger} acceptor={acceptor} />
                                            )}
                                        />
                                    )}
                                    {showPointsCalculation && (
                                        <Tooltip content={getPointsContent()}>
                                            <span className="svg-icon svg-icon-2" data-points-calculation={match.id}>
                                                <PointsIcon />
                                            </span>
                                        </Tooltip>
                                    )}
                                    {showInfo && !isDoubles && !isDoublesTeam && (
                                        <Tooltip content={getEloContent()}>
                                            <button type="button" className="btn btn-link btn-color-muted p-0">
                                                TLR
                                            </button>
                                        </Tooltip>
                                    )}
                                </>
                            )}
                            {hasPlayers && !isPlayed && !isDoubles && !isDoublesTeam && showInfo && (
                                <Tooltip content={getEloPrediction()}>
                                    <button type="button" className="btn btn-link btn-color-muted p-0">
                                        TLR
                                    </button>
                                </Tooltip>
                            )}
                        </div>
                    )}
                    {canScheduleMatch && (
                        <Modal
                            title="Schedule Match"
                            renderTrigger={({ show }) => (
                                <a
                                    href=""
                                    className="btn btn-primary btn-xs me-1"
                                    style={{ marginBottom: '-0.2rem' }}
                                    onClick={async e => {
                                        e.preventDefault();
                                        show();
                                    }}
                                >
                                    Schedule
                                </a>
                            )}
                            renderBody={({ hide }) => (
                                <FormScheduleMatch
                                    match={match}
                                    tournament={tournament}
                                    onSubmit={async () => {
                                        await onUpdate();
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
                    {canReportScore && (
                        <Modal
                            title="Report Match"
                            hasForm={false}
                            renderTrigger={({ show }) => (
                                <a
                                    href=""
                                    className="btn btn-success btn-xs"
                                    style={{ marginBottom: '-0.2rem' }}
                                    onClick={async e => {
                                        e.preventDefault();
                                        scoreModalInterceptor ? scoreModalInterceptor(show) : show();
                                    }}
                                >
                                    Score
                                </a>
                            )}
                            size="sm"
                            renderBody={({ hide }) => (
                                <FormMatch tournament={tournament} match={match} onUpdate={onUpdate} />
                            )}
                        />
                    )}
                </div>
            )}
            <div className={style.matchWrapper}>
                <table className={classnames(style.match, { [style.isReport]: isReport })}>
                    <tbody>
                        <tr>
                            <td>
                                <PlayerAvatar
                                    player1={challenger}
                                    player2={challenger2}
                                    className={classnames(style.avatar, {
                                        [style.bye]: challenger.id === BYE_ID || !challenger.userId,
                                    })}
                                />
                            </td>
                            <td
                                className={classnames(
                                    style.player,
                                    isChallengerWon && style.win,
                                    isChallengerWon && isScoreUpdated && style.animateWinner
                                )}
                                {...((match.wonByDefault || match.unavailable || match.wonByInjury) && isChallengerWon
                                    ? { colSpan: 2 }
                                    : {})}
                            >
                                {(() => {
                                    if (isDoubles) {
                                        return (
                                            <PlayerName
                                                player1={challenger}
                                                player2={challenger2}
                                                rank1={match.challengerRank}
                                                rank2={match.challenger2Rank}
                                                isLink={isUpcoming}
                                            />
                                        );
                                    }

                                    if (challenger.id === BYE_ID) {
                                        return '(BYE)';
                                    }
                                    if (!challenger.userId) {
                                        return null;
                                    }

                                    const rank = match.type === 'final' ? match.challengerSeed : match.challengerRank;
                                    const isShort =
                                        (match.type === 'final' || isRegularTeamMatch) && isLongName(challenger);

                                    return (
                                        <PlayerName
                                            player1={challenger}
                                            player2={challenger2}
                                            rank1={rank}
                                            rank2={rank}
                                            isLink={isUpcoming || isDoublesTeam}
                                            isShort={isShort}
                                            highlight={Boolean(!match.score && (isUpcoming || isDoublesTeam))}
                                            showContactBadge={canSeeContact}
                                        />
                                    );
                                })()}
                                {match.finalSpot ? (
                                    <div className={style.flag} data-match-middle={match.finalSpot} />
                                ) : null}
                            </td>
                            {(() => {
                                if (match.wonByDefault) {
                                    return isChallengerWon ? null : defaultBadge;
                                }

                                if (match.unavailable) {
                                    return isChallengerWon ? null : unavailableBadge;
                                }
                                const injuryInfo = match.wonByInjury && isAcceptorWon ? injuryBadge : null;

                                return (
                                    <>
                                        {injuryInfo}
                                        {sets.map((set, index) => (
                                            <td
                                                key={index}
                                                className={classnames(style.score, {
                                                    [style.animateScore]: isScoreUpdated,
                                                    [style.win]: isSetScoreCorrect({
                                                        challengerPoints: set[0],
                                                        acceptorPoints: set[1],
                                                        isMatchTieBreak:
                                                            index === 2 && !match.wonByInjury && set[0] + set[1] === 1,
                                                    })
                                                        ? set[0] > set[1]
                                                        : false,
                                                })}
                                            >
                                                {set[0]}
                                            </td>
                                        ))}
                                    </>
                                );
                            })()}

                            {showPoints && (
                                <td className="ps-3">
                                    <span
                                        className={classnames(
                                            'badge badge-square badge-dark',
                                            style.points,
                                            isScoreUpdated && style.animateScore
                                        )}
                                        data-challenger-points={match.id}
                                    >
                                        +{match.challengerPoints}
                                    </span>
                                </td>
                            )}
                        </tr>
                        <tr>
                            <td>
                                <PlayerAvatar
                                    player1={acceptor}
                                    player2={acceptor2}
                                    className={classnames(style.avatar, {
                                        [style.bye]: acceptor.id === BYE_ID || !acceptor.userId,
                                    })}
                                />
                            </td>
                            <td
                                className={classnames(
                                    style.player,
                                    isAcceptorWon && style.win,
                                    isAcceptorWon && isScoreUpdated && style.animateWinner
                                )}
                                {...((match.wonByDefault || match.unavailable || match.wonByInjury) && isAcceptorWon
                                    ? { colSpan: 2 }
                                    : {})}
                            >
                                {(() => {
                                    if (isDoubles) {
                                        return (
                                            <PlayerName
                                                player1={acceptor}
                                                player2={acceptor2}
                                                rank1={match.acceptorRank}
                                                rank2={match.acceptor2Rank}
                                                isLink={isUpcoming}
                                            />
                                        );
                                    }
                                    if (acceptor.id === BYE_ID) {
                                        return '(BYE)';
                                    }
                                    if (!acceptor.userId) {
                                        return null;
                                    }

                                    const rank = match.type === 'final' ? match.acceptorSeed : match.acceptorRank;
                                    const isShort =
                                        (match.type === 'final' || isRegularTeamMatch) && isLongName(acceptor);

                                    return (
                                        <PlayerName
                                            player1={acceptor}
                                            player2={acceptor2}
                                            rank1={rank}
                                            rank2={rank}
                                            isLink={isUpcoming || isDoublesTeam}
                                            isShort={isShort}
                                            highlight={Boolean(!match.score && (isUpcoming || isDoublesTeam))}
                                            showContactBadge={canSeeContact}
                                        />
                                    );
                                })()}
                            </td>
                            {(() => {
                                if (match.wonByDefault) {
                                    return isAcceptorWon ? null : defaultBadge;
                                }

                                if (match.unavailable) {
                                    return isAcceptorWon ? null : unavailableBadge;
                                }
                                const injuryInfo = match.wonByInjury && isChallengerWon ? injuryBadge : null;

                                return (
                                    <>
                                        {injuryInfo}
                                        {sets.map((set, index) => (
                                            <td
                                                key={index}
                                                className={classnames(style.score, {
                                                    [style.animateScore]: isScoreUpdated,
                                                    [style.win]: isSetScoreCorrect({
                                                        challengerPoints: set[0],
                                                        acceptorPoints: set[1],
                                                        isMatchTieBreak:
                                                            index === 2 && !match.wonByInjury && set[0] + set[1] === 1,
                                                    })
                                                        ? set[1] > set[0]
                                                        : false,
                                                })}
                                            >
                                                {set[1]}
                                            </td>
                                        ))}
                                    </>
                                );
                            })()}
                            {showPoints && (
                                <td className="ps-3">
                                    <span
                                        className={classnames(
                                            'badge badge-square badge-dark',
                                            style.points,
                                            isScoreUpdated && style.animateScore
                                        )}
                                        data-acceptor-points={match.id}
                                    >
                                        +{match.acceptorPoints}
                                    </span>
                                </td>
                            )}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

Match.propTypes = {
    match: PropTypes.object,
    challenger: PropTypes.object,
    acceptor: PropTypes.object,
    players: PropTypes.object,
    onUpdate: PropTypes.func,
    onlyTime: PropTypes.bool,
    showWeekDay: PropTypes.bool,
    readOnly: PropTypes.bool,
    isUpcoming: PropTypes.bool,
    hideReplacePlayersAction: PropTypes.bool,
    isReport: PropTypes.bool,
    tournament: PropTypes.object.isRequired,
    showHeader: PropTypes.bool,
    emulateMyMatch: PropTypes.bool,
    showInfo: PropTypes.bool,
    showTeamsSign: PropTypes.bool,
    scoreModalInterceptor: PropTypes.func,
};

Match.defaultProps = {
    readOnly: false,
    showHeader: true,
    emulateMyMatch: false,
    showInfo: true,
    showTeamsSign: true,
};

export default Match;
