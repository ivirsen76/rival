import classnames from 'classnames';
import style from './style.module.scss';
import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerName from '@/components/PlayerName';
import getRelativeStringLength from '@/utils/getRelativeStringLength';
import { BYE_ID } from '@rival/ladder.backend/src/constants';

const isLongName = (player) => {
    return getRelativeStringLength(player.firstName + ' ' + player.lastName) > 15;
};

type MatchProps = {
    match?: object;
    challenger?: object;
    acceptor?: object;
    isActive?: boolean;
    onSelect?: (...args: unknown[]) => unknown;
    prediction?: object;
};

const Match = (props: MatchProps) => {
    const { match, isActive, challenger, acceptor, onSelect, prediction } = props;
    const hasBye = challenger.id === BYE_ID || acceptor.id === BYE_ID;

    return (
        <table className={classnames(style.match, isActive && style.active)} data-match-bet={match.finalSpot}>
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
                    <td className={classnames(style.player, prediction?.winner === challenger.id && style.win)}>
                        {(() => {
                            if (challenger.id === BYE_ID) {
                                return '(BYE)';
                            }
                            if (!challenger.userId) {
                                return null;
                            }

                            const isShort = isLongName(challenger);
                            const rank = challenger.elo.isEloEstablished ? challenger.elo.elo : null;

                            return <PlayerName player1={challenger} elo1={rank} isShort={isShort} />;
                        })()}
                        {match.finalSpot ? (
                            <div className={style.flag} data-bet-match-middle={match.finalSpot} />
                        ) : null}
                    </td>
                    {!hasBye && (
                        <td>
                            <button
                                className={classnames(
                                    'btn btn-xs',
                                    prediction?.winner === challenger.id && prediction?.sets === 2
                                        ? 'btn-primary'
                                        : 'btn-secondary'
                                )}
                                type="button"
                                onClick={() => onSelect(match.finalSpot, challenger.id, 2)}
                                data-challenger-bet="2"
                            >
                                2 sets
                            </button>
                            <button
                                className={classnames(
                                    'btn btn-xs ms-1',
                                    prediction?.winner === challenger.id && prediction?.sets === 3
                                        ? 'btn-primary'
                                        : 'btn-secondary'
                                )}
                                type="button"
                                onClick={() => onSelect(match.finalSpot, challenger.id, 3)}
                                data-challenger-bet="3"
                            >
                                3 sets
                            </button>
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
                    <td className={classnames(style.player, prediction?.winner === acceptor.id && style.win)}>
                        {(() => {
                            if (acceptor.id === BYE_ID) {
                                return '(BYE)';
                            }
                            if (!acceptor.userId) {
                                return null;
                            }

                            const isShort = isLongName(acceptor);
                            const rank = acceptor.elo.isEloEstablished ? acceptor.elo.elo : null;

                            return <PlayerName player1={acceptor} elo1={rank} isShort={isShort} />;
                        })()}
                    </td>
                    {!hasBye && (
                        <td>
                            <button
                                className={classnames(
                                    'btn btn-xs',
                                    prediction?.winner === acceptor.id && prediction?.sets === 2
                                        ? 'btn-primary'
                                        : 'btn-secondary'
                                )}
                                type="button"
                                onClick={() => onSelect(match.finalSpot, acceptor.id, 2)}
                                data-acceptor-bet="2"
                            >
                                2 sets
                            </button>
                            <button
                                className={classnames(
                                    'btn btn-xs ms-1',
                                    prediction?.winner === acceptor.id && prediction?.sets === 3
                                        ? 'btn-primary'
                                        : 'btn-secondary'
                                )}
                                type="button"
                                onClick={() => onSelect(match.finalSpot, acceptor.id, 3)}
                                data-acceptor-bet="3"
                            >
                                3 sets
                            </button>
                        </td>
                    )}
                </tr>
            </tbody>
        </table>
    );
};

export default Match;
