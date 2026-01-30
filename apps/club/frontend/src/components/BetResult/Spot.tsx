import classnames from 'classnames';
import PlayerAvatar from '@rival/common/components/PlayerAvatar';
import PlayerName from '@rival/common/components/PlayerName';
import getRelativeStringLength from '@rival/common/utils/getRelativeStringLength';
import { BYE_ID } from '@rival/club.backend/src/constants';
import style from './style.module.scss';

const isLongName = (player) => {
    return getRelativeStringLength(player.firstName + ' ' + player.lastName) > 15;
};

type MatchProps = {
    match: object;
    challenger: object;
    acceptor: object;
    correctWinner: boolean;
    wrongWinner: boolean;
    correctScore: boolean;
    wrongScore: boolean;
};

const Match = (props: MatchProps) => {
    const { match, challenger, acceptor, correctWinner, wrongWinner, correctScore, wrongScore } = props;
    const hasBye = match.challengerId === BYE_ID || match.acceptorId === BYE_ID;

    return (
        <div
            className={classnames(style.matchWrapper, {
                [style.hasBye]: hasBye,
                [style.correctWinner]: correctWinner,
                [style.wrongWinner]: wrongWinner,
                [style.correctScore]: correctScore,
                [style.wrongScore]: wrongScore,
            })}
        >
            <table className={style.match} data-match-bet={match.finalSpot}>
                <tbody>
                    <tr>
                        <td>
                            <PlayerAvatar
                                player1={challenger}
                                className={classnames(style.avatar, {
                                    [style.bye]: challenger.id === BYE_ID || !challenger.userId,
                                })}
                            />
                        </td>
                        <td
                            className={classnames(style.player, {
                                [style.win]: match.winner === challenger.id || acceptor.id === BYE_ID,
                            })}
                        >
                            {(() => {
                                if (challenger.id === BYE_ID) {
                                    return '(BYE)';
                                }
                                if (!challenger.userId) {
                                    return null;
                                }

                                const isShort = isLongName(challenger);

                                return <PlayerName player1={challenger} isShort={isShort} />;
                            })()}
                            {match.finalSpot ? (
                                <div className={style.flag} data-bet-match-middle={match.finalSpot} />
                            ) : null}
                        </td>
                        {!hasBye && (
                            <td className={style.score}>
                                {match.winner === match.challengerId ? (
                                    <span className={style.win}>2</span>
                                ) : match.sets === 3 ? (
                                    1
                                ) : (
                                    0
                                )}
                            </td>
                        )}
                    </tr>
                    <tr>
                        <td>
                            <PlayerAvatar
                                player1={acceptor}
                                className={classnames(style.avatar, {
                                    [style.bye]: acceptor.id === BYE_ID || !acceptor.userId,
                                })}
                            />
                        </td>
                        <td
                            className={classnames(style.player, {
                                [style.win]: match.winner === acceptor.id || challenger.id === BYE_ID,
                            })}
                        >
                            {(() => {
                                if (acceptor.id === BYE_ID) {
                                    return '(BYE)';
                                }
                                if (!acceptor.userId) {
                                    return null;
                                }

                                const isShort = isLongName(acceptor);

                                return <PlayerName player1={acceptor} isShort={isShort} />;
                            })()}
                        </td>
                        {!hasBye && (
                            <td className={style.score}>
                                {match.winner === match.acceptorId ? (
                                    <span className={style.win}>2</span>
                                ) : match.sets === 3 ? (
                                    1
                                ) : (
                                    0
                                )}
                            </td>
                        )}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default Match;
