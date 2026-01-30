import classnames from 'classnames';
import PlayerAvatar from '@rival/common/components/PlayerAvatar';
import PlayerName from '@rival/common/components/PlayerName';
import getRelativeStringLength from '@rival/common/utils/getRelativeStringLength';
import { BYE_ID } from '@rival/ladder.backend/src/constants';
import style from './style.module.scss';

const isLongName = (player) => {
    return getRelativeStringLength(player.firstName + ' ' + player.lastName) > 15;
};

type MatchProps = {
    match: object;
    challenger: object;
    acceptor: object;
};

const Match = (props: MatchProps) => {
    const { match, challenger, acceptor } = props;

    return (
        <div className={style.spot}>
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
                        <td className={classnames(style.player, acceptor.id === BYE_ID && style.win)}>
                            {(() => {
                                if (challenger.id === BYE_ID) {
                                    return '(BYE)';
                                }
                                if (!challenger.userId) {
                                    return null;
                                }

                                const isShort = isLongName(challenger);
                                const rank = match.challengerSeed;

                                return <PlayerName player1={challenger} rank1={rank} isShort={isShort} />;
                            })()}
                            {match.finalSpot ? (
                                <div className={style.flag} data-bet-match-middle={match.finalSpot} />
                            ) : null}
                        </td>
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
                        <td className={classnames(style.player, challenger.id === BYE_ID && style.win)}>
                            {(() => {
                                if (acceptor.id === BYE_ID) {
                                    return '(BYE)';
                                }
                                if (!acceptor.userId) {
                                    return null;
                                }

                                const isShort = isLongName(acceptor);
                                const rank = match.acceptorSeed;

                                return <PlayerName player1={acceptor} rank1={rank} isShort={isShort} />;
                            })()}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default Match;
