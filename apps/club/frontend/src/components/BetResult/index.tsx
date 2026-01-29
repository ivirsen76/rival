import Spot from './Spot';
import Bracket from './Bracket';
import Tooltip from '@rival/common/components/Tooltip';
import getComments from './getComments';
import classnames from 'classnames';
import { BYE_ID } from '@rival/club.backend/src/constants';
import style from './style.module.scss';

type BetResultProps = {
    players: object;
    prediction: unknown[];
    predictionPoints: object;
    matches: object;
    showMaxPoints: boolean;
};

const BetResult = (props: BetResultProps) => {
    const { players, prediction, predictionPoints, matches, showMaxPoints } = props;
    const predictionObject = prediction.reduce((obj, item) => {
        obj[item.finalSpot] = item;
        return obj;
    }, {});

    const comments = getComments(matches, prediction, players);

    const loosers = Object.values(matches)
        .filter((match) => match.score)
        .reduce((obj, match) => {
            obj[match.challengerId === match.winner ? match.acceptorId : match.challengerId] = match.finalSpot;
            return obj;
        }, {});
    const playerIds = Object.values(matches).reduce((set, match) => {
        set.add(match.challengerId);
        set.add(match.acceptorId);
        return set;
    }, new Set());

    const renderMatch = (finalSpot) => {
        const match = predictionObject[finalSpot];
        let challenger;
        let acceptor;

        const hasBye = match.challengerId === BYE_ID || match.acceptorId === BYE_ID;
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

        let correctWinner = false;
        let wrongWinner = false;
        let correctScore = false;
        let wrongScore = false;

        if (!hasBye && !playerIds.has(match.winner)) {
            wrongWinner = true;
            wrongScore = true;
        } else if (matches[finalSpot]?.winner) {
            correctWinner = matches[finalSpot].winner === match.winner;
            wrongWinner = !correctWinner;

            const sets = matches[finalSpot].score.split(' ').length;
            correctScore = correctWinner && sets === match.sets;
            wrongScore = wrongWinner || sets !== match.sets;
        } else if (loosers[match.winner] && finalSpot <= loosers[match.winner]) {
            wrongWinner = true;
            wrongScore = true;
        }

        const spot = (
            <Spot
                match={match}
                challenger={challenger}
                acceptor={acceptor}
                correctWinner={correctWinner}
                wrongWinner={wrongWinner}
                correctScore={correctScore}
                wrongScore={wrongScore}
            />
        );

        if (comments[finalSpot]) {
            return (
                <Tooltip
                    content={<div className="text-center" dangerouslySetInnerHTML={{ __html: comments[finalSpot] }} />}
                >
                    <div>{spot}</div>
                </Tooltip>
            );
        }

        return spot;
    };

    const hasRound16 =
        predictionObject[15] ||
        predictionObject[14] ||
        predictionObject[13] ||
        predictionObject[12] ||
        predictionObject[11] ||
        predictionObject[10] ||
        predictionObject[9] ||
        predictionObject[8];
    const hasQuarterfinals = predictionObject[7] || predictionObject[6] || predictionObject[5] || predictionObject[4];

    const totalLevels = hasRound16 ? 'four' : hasQuarterfinals ? 'three' : 'two';

    return (
        <div>
            <div className="mb-6">
                <div>
                    <b>Points:</b> {predictionPoints.points}
                </div>
                {showMaxPoints && (
                    <div>
                        <b>Max Points:</b> {predictionPoints.maxPoints}
                    </div>
                )}
            </div>
            <div className={classnames(style.wrapper, style[totalLevels])} data-final-bet-matches>
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
                <div className={style.matches}>
                    <div className={'fw-bold text-muted ' + style.header}>Semifinals</div>
                    <div className={hasQuarterfinals ? style.margin3 : ''}>{renderMatch(3)}</div>
                    <div className={hasQuarterfinals ? style.margin2 : ''}>{renderMatch(2)}</div>
                </div>
                <div className={style.divider}>
                    <Bracket topFinalSpot={3} bottomFinalSpot={2} middleFinalSpot={1} />
                </div>
                <div>
                    <div className={'fw-bold text-muted ' + style.header}>Final</div>
                    <div className={style.margin1}>{renderMatch(1)}</div>
                </div>
            </div>
        </div>
    );
};

BetResult.defaultProps = {
    showMaxPoints: true,
};

export default BetResult;
