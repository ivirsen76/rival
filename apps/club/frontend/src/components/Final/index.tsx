import { useMemo } from 'react';
import Match from '@/components/Match';
import TournamentText from '@/components/TournamentText';
import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerName from '@/components/PlayerName';
import Bracket from './Bracket';
import classnames from 'classnames';
import {
    getSinglesTournament8Text,
    getSinglesTournament12Text,
    getSinglesTournament16Text,
} from '@/pages/Tournament/texts';
import { useSelector } from 'react-redux';
import Bet from '@/components/Bet';
import BetResult from '@/components/BetResult';
import BetContest from '@/components/BetContest';
import TimeoutCallback from '@/components/TimeoutCallback';
import Modal from '@/components/Modal';
import { relationsUp, relationsDown } from '@rival/club.backend/src/services/matches/relations';
import { BYE_ID, BRACKET_BOT_ID } from '@rival/club.backend/src/constants';
import dayjs from '@/utils/dayjs';
import notification from '@/components/notification';
import BotIcon from '@/assets/bot.svg?react';
import style from './style.module.scss';

type FinalProps = {
    matches: unknown[];
    players: object;
    reloadTournament: (...args: unknown[]) => unknown;
    showTournamentText: boolean;
    tournament: object;
    isReport: boolean;
};

const Final = (props: FinalProps) => {
    const { players, reloadTournament, showTournamentText, tournament, isReport } = props;
    const matches = props.matches
        .filter((match) => match.type === 'final' && !match.battleId)
        .reduce((obj, match) => {
            obj[match.finalSpot] = match;
            return obj;
        }, {});

    const isTop12 = tournament.playersBeforeDeadline >= 50;
    const isTop16 = tournament.playersBeforeDeadline >= 75;
    const isDoublesTeam = tournament.levelType === 'doubles-team';

    const addPredictionDeadline = useMemo(() => dayjs.tz(tournament.endDate).add(18, 'hour'), []);
    const allowAddPrediction = tournament.hasPredictionContest && dayjs.tz().isBefore(addPredictionDeadline);
    const currentUser = useSelector((state) => state.auth.user);
    const currentPlayerId = currentUser?.tournaments[tournament.id]?.playerId;
    const currentPlayer = players[currentPlayerId];

    const scoreModalInterceptor = (show) => {
        if (!allowAddPrediction) {
            return show();
        }

        notification({
            inModal: true,
            title: 'Wait for Rival Bracket Battle',
            render: ({ hide }) => (
                <div>
                    <div className="mb-8">
                        Please report your score after 6 PM today. Players are currently filling out their brackets, and
                        we don&apos;t want to spoil it!
                    </div>
                    <button type="button" className="btn btn-primary" onClick={hide}>
                        Ok, got it!
                    </button>
                </div>
            ),
        });
    };

    const renderMatch = (finalSpot) => {
        let match = matches[finalSpot];
        let challenger;
        let acceptor;

        if (match) {
            challenger = players[match.challengerId];
            acceptor = players[match.acceptorId];
        }
        if (!match && relationsUp[finalSpot]) {
            const relation = relationsUp[finalSpot];
            const relatedMatch = matches[relation.finalSpot];
            if (relatedMatch && relatedMatch[relation.player]) {
                match = {
                    winner: relatedMatch[relation.player],
                    type: 'final',
                    finalSpot,
                    challengerSeed: relatedMatch.challengerSeed,
                    acceptorSeed: relatedMatch.acceptorSeed,
                };
                challenger = finalSpot % 2 ? players[relatedMatch[relation.player]] : { id: BYE_ID };
                acceptor = finalSpot % 2 ? { id: BYE_ID } : players[relatedMatch[relation.player]];
            }
        }
        if (!match && relationsDown[finalSpot]) {
            const relation = relationsDown[finalSpot];
            const relatedChallengerMatch = matches[relation.challengerFinalSpot];
            if (relatedChallengerMatch && relatedChallengerMatch.winner) {
                challenger = players[relatedChallengerMatch.winner];
            }
            const relatedAcceptorMatch = matches[relation.acceptorFinalSpot];
            if (relatedAcceptorMatch && relatedAcceptorMatch.winner) {
                acceptor = players[relatedAcceptorMatch.winner];
            }
        }

        const readOnly = (() => {
            if (!match) {
                return false;
            }

            const relation = relationsUp[finalSpot];
            if (!relation) {
                return false;
            }

            const nextMatch = matches[relation.finalSpot];
            if (!nextMatch) {
                return false;
            }

            return Boolean(nextMatch.score);
        })();

        const hideReplacePlayersAction = (() => {
            if (!match) {
                return false;
            }

            const relation = relationsDown[finalSpot];
            if (!relation) {
                return false;
            }

            if (match.challengerId && matches[relation.challengerFinalSpot]) {
                return true;
            }
            if (match.acceptorId && matches[relation.acceptorFinalSpot]) {
                return true;
            }

            return false;
        })();

        if (!match) {
            match = { id: 0, type: 'final', finalSpot };
        }
        if (!challenger) {
            challenger = { id: 0 };
        }
        if (!acceptor) {
            acceptor = { id: 0 };
        }

        // Get the latest rank for the players
        if (challenger.stats) {
            match.challengerRank = challenger.stats.rank;
        }
        if (acceptor.stats) {
            match.acceptorRank = acceptor.stats.rank;
        }

        return (
            <Match
                match={match}
                challenger={challenger}
                acceptor={acceptor}
                onUpdate={reloadTournament}
                readOnly={readOnly}
                players={players}
                hideReplacePlayersAction={hideReplacePlayersAction}
                isReport={isReport}
                tournament={tournament}
                scoreModalInterceptor={scoreModalInterceptor}
            />
        );
    };

    if (Object.keys(matches).length === 0) {
        return null;
    }

    const hasRound16 =
        matches[15] ||
        matches[14] ||
        matches[13] ||
        matches[12] ||
        matches[11] ||
        matches[10] ||
        matches[9] ||
        matches[8];
    const hasQuarterfinals = hasRound16 || matches[7] || matches[6] || matches[5] || matches[4];
    const hasSemifinals = hasQuarterfinals || matches[3] || matches[2];

    let totalLevels = 'four';
    if (!hasRound16) {
        totalLevels = 'three';
    }
    if (!hasQuarterfinals) {
        totalLevels = 'two';
    }
    if (!hasSemifinals) {
        totalLevels = 'one';
    }

    const tournamentText = (() => {
        const entity = isDoublesTeam ? 'team' : 'player';
        return isTop16
            ? getSinglesTournament16Text(entity)
            : isTop12
              ? getSinglesTournament12Text(entity)
              : getSinglesTournament8Text(entity);
    })();

    let tournamentRules;
    if (showTournamentText && tournamentText) {
        tournamentRules = (
            <div className="mb-4">
                <Modal
                    title="Tournament information"
                    hasForm={false}
                    size="lg"
                    renderTrigger={({ show }) => (
                        <a
                            href=""
                            onClick={(e) => {
                                e.preventDefault();
                                show();
                            }}
                        >
                            Tournament information
                        </a>
                    )}
                    renderBody={({ hide }) => <TournamentText text={tournamentText} tournament={tournament} />}
                />
            </div>
        );
    }

    const renderBracketBattle = () => {
        if (!tournament.hasPredictionContest) {
            return null;
        }

        let actions;
        if (allowAddPrediction) {
            if (!currentPlayer) {
                return null;
            }

            actions = currentPlayer.prediction ? (
                <>
                    <Modal
                        title="Rival Bracket Battle"
                        hasForm={false}
                        size="xl"
                        renderTrigger={({ show }) => (
                            <button type="button" className="btn btn-sm btn-primary text-nowrap" onClick={show}>
                                Your picks
                            </button>
                        )}
                        renderBody={() => (
                            <BetResult
                                players={props.players}
                                prediction={currentPlayer.prediction}
                                predictionPoints={currentPlayer.predictionPoints}
                                matches={matches}
                            />
                        )}
                    />
                    <div className={style.timeoutInfo}>
                        <TimeoutCallback
                            deadline={addPredictionDeadline}
                            onTimeout={reloadTournament}
                            render={({ timeLeft }) => (
                                <div>
                                    Contest starts in:
                                    <br />
                                    <b>{timeLeft}</b>
                                </div>
                            )}
                        />
                    </div>
                </>
            ) : (
                <>
                    <Modal
                        title="Rival Bracket Battle"
                        hasForm={false}
                        renderTrigger={({ show }) => (
                            <button type="button" className="btn btn-sm btn-primary text-nowrap" onClick={show}>
                                Make your picks
                            </button>
                        )}
                        renderBody={({ hide }) => (
                            <Bet
                                players={props.players}
                                tournament={props.tournament}
                                matches={props.matches}
                                onSubmit={async () => {
                                    await reloadTournament();
                                    hide();
                                }}
                            />
                        )}
                    />
                    <div className={style.timeoutInfo}>
                        <TimeoutCallback
                            deadline={addPredictionDeadline}
                            onTimeout={reloadTournament}
                            render={({ timeLeft }) => (
                                <div>
                                    Time left: <b>{timeLeft}</b>
                                </div>
                            )}
                        />
                    </div>
                </>
            );
        } else {
            actions = (
                <Modal
                    title="Standings"
                    hasForm={false}
                    renderTrigger={({ show }) => (
                        <button type="button" className="btn btn-sm btn-primary text-nowrap" onClick={show}>
                            Standings
                        </button>
                    )}
                    renderBody={({ hide }) => (
                        <BetContest tournament={tournament} players={props.players} matches={matches} />
                    )}
                />
            );
        }

        const predictionWinner = (() => {
            if (!tournament.predictionWinner) {
                return null;
            }
            if (tournament.predictionWinner === BRACKET_BOT_ID) {
                return {
                    id: BRACKET_BOT_ID,
                    firstName: 'BracketBot',
                    lastName: '',
                };
            }

            return players[tournament.predictionWinner];
        })();

        return (
            <div className={'alert alert-primary mb-6 ' + style.betContest} data-bet-contest>
                <div>
                    <h3 className="mt-0 mb-1 text-nowrap">
                        {predictionWinner ? 'Bracket Battle Winner' : 'Bracket Battle'}
                    </h3>
                    {predictionWinner ? (
                        <div className="d-flex align-items-center gap-1">
                            {predictionWinner.id === BRACKET_BOT_ID ? (
                                <span className={style.botIcon}>
                                    <BotIcon />
                                </span>
                            ) : (
                                <PlayerAvatar player1={predictionWinner} />
                            )}

                            <PlayerName player1={predictionWinner} />
                        </div>
                    ) : (
                        <Modal
                            title="Rival Bracket Battle"
                            hasForm={false}
                            renderTrigger={({ show }) => (
                                <a
                                    href=""
                                    onClick={(e) => {
                                        e.preventDefault();
                                        show();
                                    }}
                                >
                                    Learn more
                                </a>
                            )}
                            renderBody={({ hide }) => (
                                <div>
                                    <p>
                                        Play in the Rival Bracket Battle to predict who you think will win the ladder
                                        this season!
                                    </p>
                                    <h3>How It Works</h3>
                                    <p>
                                        Fill out your bracket by picking who you think will win each matchup and in how
                                        many sets. You get <b>2 points</b> for picking the correct winner of the match
                                        and <b>1 point</b> for choosing the correct number of sets.
                                    </p>
                                    <h3>Beat the BracketBot</h3>
                                    <p>
                                        Using sophisticated tennis technology and TLR insights, our BracketBot thinks it
                                        knows best about who will win. Beyond beating the other players, this challenge
                                        is your chance to show you know your ladder better than anyone, even our AI.
                                    </p>
                                    <h3>How to Win</h3>
                                    <p>
                                        Win the Rival Bracket Battle by accumulating the most points at the end of the
                                        tournament. If you beat both the players and the BracketBot, you will win{' '}
                                        <b>The Oracle</b> badge and <b>$5</b> of credit!
                                    </p>
                                    <h3>Deadline</h3>
                                    <p>
                                        All submissions to the Rival Bracket Battle must be complete by{' '}
                                        <b>6&nbsp;PM on Monday, {addPredictionDeadline.format('MMMM D')}</b>.
                                    </p>
                                    <div className="mt-8">
                                        <button type="button" className="btn btn-secondary" onClick={hide}>
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        />
                    )}
                </div>
                <div className="text-end align-self-start">{actions}</div>
            </div>
        );
    };

    return (
        <div data-final-tournament-area>
            {!isReport && (
                <div className={style.tournamentWrapper}>
                    <div>
                        <h3>Final Tournament</h3>
                        {tournamentRules}
                    </div>
                    {renderBracketBattle()}
                </div>
            )}

            <div
                className={classnames(style.wrapper, style[totalLevels], { [style.isReport]: isReport })}
                data-final-brackets
            >
                {hasRound16 && (
                    <>
                        <div className={style.matches}>
                            <div className={'fw-bold text-muted ' + style.header}>Round of 16</div>
                            {renderMatch(15)}
                            {renderMatch(14)}
                            {renderMatch(13)}
                            {renderMatch(12)}
                            {renderMatch(11)}
                            {renderMatch(10)}
                            {renderMatch(9)}
                            {renderMatch(8)}
                        </div>
                        <div className={style.divider}>
                            <Bracket topFinalSpot={15} bottomFinalSpot={14} middleFinalSpot={7} />
                            <Bracket topFinalSpot={13} bottomFinalSpot={12} middleFinalSpot={6} />
                            <Bracket topFinalSpot={11} bottomFinalSpot={10} middleFinalSpot={5} />
                            <Bracket topFinalSpot={9} bottomFinalSpot={8} middleFinalSpot={4} />
                        </div>
                    </>
                )}
                {hasQuarterfinals && (
                    <>
                        <div className={style.matches}>
                            <div className={'fw-bold text-muted ' + style.header}>Quarterfinals</div>
                            <div className={hasRound16 ? style.margin7 : ''}>{renderMatch(7)}</div>
                            <div className={hasRound16 ? style.margin6 : ''}>{renderMatch(6)}</div>
                            <div className={hasRound16 ? style.margin5 : ''}>{renderMatch(5)}</div>
                            <div className={hasRound16 ? style.margin4 : ''}>{renderMatch(4)}</div>
                        </div>
                        <div className={style.divider}>
                            <Bracket topFinalSpot={7} bottomFinalSpot={6} middleFinalSpot={3} />
                            <Bracket topFinalSpot={5} bottomFinalSpot={4} middleFinalSpot={2} />
                        </div>
                    </>
                )}
                {hasSemifinals && (
                    <>
                        <div className={style.matches}>
                            <div className={'fw-bold text-muted ' + style.header}>Semifinals</div>
                            <div className={hasQuarterfinals ? style.margin3 : ''}>{renderMatch(3)}</div>
                            <div className={hasQuarterfinals ? style.margin2 : ''}>{renderMatch(2)}</div>
                        </div>
                        <div className={style.divider}>
                            <Bracket topFinalSpot={3} bottomFinalSpot={2} middleFinalSpot={1} />
                        </div>
                    </>
                )}
                <div>
                    <div className={'fw-bold text-muted ' + style.header}>Final</div>
                    <div className={style.margin1}>{renderMatch(1)}</div>
                </div>
            </div>
        </div>
    );
};

export default Final;
