import { useMemo, useState, useEffect } from 'react';
import Spot from './Spot';
import Bracket from './Bracket';
import classnames from 'classnames';
import { getInitialPrediction, setWinner, preparePredictionToSave } from './helpers';
import showLoader from '@rival/common/utils/showLoader';
import axios from '@/utils/axios';
import { useSelector } from 'react-redux';
import { BYE_ID } from '@rival/club.backend/src/constants';
import notification from '@/components/notification';
import style from './style.module.scss';

const isByeMatch = (match) => match.challengerId === BYE_ID || match.acceptorId === BYE_ID;

type BetProps = {
    tournament: object;
    matches: unknown[];
    players: object;
    onSubmit: (...args: unknown[]) => unknown;
};

const Bet = (props: BetProps) => {
    const { players, tournament, matches, onSubmit } = props;
    const finalMatches = matches.filter((match) => match.type === 'final' && !match.battleId);

    const [currentSpot, setCurrentSpot] = useState(() => Math.max(...finalMatches.map((item) => item.finalSpot)));
    const [position, setPosition] = useState({ left: 0, top: 0 });
    const [prediction, setPrediction] = useState(() => getInitialPrediction(finalMatches));
    const currentUser = useSelector((state) => state.auth.user);
    const currentPlayerId = currentUser?.tournaments[tournament.id]?.playerId;

    useEffect(() => {
        const wrapperNode = document.querySelector('[data-final-bet-wrapper]');
        const wrapperRect = wrapperNode.getBoundingClientRect();

        const matchesNode = document.querySelector('[data-final-bet-matches]');
        const matchesRect = matchesNode.getBoundingClientRect();

        const matchNode = document.querySelector(`[data-match-bet="${currentSpot}"]`);
        const matchRect = matchNode.getBoundingClientRect();

        const left = (wrapperRect.width - matchRect.width) / 2 - (matchRect.left - matchesRect.left);
        const top = (wrapperRect.height - matchRect.height) / 2 - (matchRect.top - matchesRect.top) + 24;

        setPosition({ left, top });
    }, [currentSpot]);

    const total = useMemo(() => {
        const maxFinalSpot = Math.max(...finalMatches.map((item) => item.finalSpot));
        return maxFinalSpot === 15 ? 15 : maxFinalSpot === 14 ? 11 : maxFinalSpot === 7 ? 7 : 3;
    }, [matches]);

    const completed = Object.values(prediction).filter(
        (item) => item.challengerId && item.acceptorId && item.winner
    ).length;

    const setPredictionAndProceed = async (finalSpot, winner, sets) => {
        setPrediction(setWinner(prediction, finalSpot, winner, sets));

        await new Promise((resolve) => setTimeout(resolve, 500));

        let nextSpot = currentSpot - 1;
        while (nextSpot > 0 && (!prediction[nextSpot] || isByeMatch(prediction[nextSpot]))) {
            nextSpot--;
        }

        if (nextSpot > 0) {
            setCurrentSpot(nextSpot);
        }
    };

    const submitPrediction = async () => {
        await showLoader(async () => {
            await axios.put(`/api/players/${currentPlayerId}`, {
                action: 'setPrediction',
                prediction: preparePredictionToSave(prediction),
            });

            notification('Thank you for participating in the Rival Bracket Battle!');

            await onSubmit();
        });
    };

    const renderMatch = (finalSpot) => {
        const match = prediction[finalSpot];
        let challenger;
        let acceptor;

        if (match) {
            challenger = match.challengerId === BYE_ID ? { id: BYE_ID } : players[match.challengerId];
            acceptor = match.acceptorId === BYE_ID ? { id: BYE_ID } : players[match.acceptorId];
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
            <Spot
                match={match}
                challenger={challenger}
                acceptor={acceptor}
                isActive={currentSpot === match.finalSpot}
                onSelect={setPredictionAndProceed}
                prediction={prediction[match.finalSpot]}
            />
        );
    };

    if (Object.keys(prediction).length === 0) {
        return null;
    }

    const hasRound16 =
        prediction[15] ||
        prediction[14] ||
        prediction[13] ||
        prediction[12] ||
        prediction[11] ||
        prediction[10] ||
        prediction[9] ||
        prediction[8];
    const hasQuarterfinals = prediction[7] || prediction[6] || prediction[5] || prediction[4];

    const totalLevels = hasRound16 ? 'four' : hasQuarterfinals ? 'three' : 'two';

    return (
        <div>
            <div className="mb-4">
                <label className="form-label">Guess the winner of each match.</label>
                <div className={style.description}>Choose the number of sets to win.</div>
            </div>
            <div className={style.bet} data-final-bet-wrapper>
                <div className={style.cover} />
                <div className={style.headerWrapper} data-final-bet-header style={{ left: position.left }}>
                    {hasRound16 && <div className={'fw-bold text-muted ' + style.header}>Round of 16</div>}
                    {hasQuarterfinals && <div className={'fw-bold text-muted ' + style.header}>Quarterfinals</div>}
                    <div className={'fw-bold text-muted ' + style.header}>Semifinals</div>
                    <div className={'fw-bold text-muted ' + style.header}>Final</div>
                </div>
                <div className={classnames(style.wrapper, style[totalLevels])} data-final-bet-matches style={position}>
                    {hasRound16 && (
                        <>
                            <div className={style.matches}>
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
                    <div className={style.matches}>
                        <div className={style.margin3}>{renderMatch(3)}</div>
                        <div className={style.margin2}>{renderMatch(2)}</div>
                    </div>
                    <div className={style.divider}>
                        <Bracket topFinalSpot={3} bottomFinalSpot={2} middleFinalSpot={1} />
                    </div>
                    <div>
                        <div className={style.margin1}>{renderMatch(1)}</div>
                    </div>
                </div>
            </div>
            <div className={style.total}>
                {completed} / {total}
            </div>
            {completed >= total && (
                <div className="mt-4">
                    <button type="submit" className="btn btn-primary" onClick={submitPrediction}>
                        Submit
                    </button>
                </div>
            )}
        </div>
    );
};

export default Bet;
