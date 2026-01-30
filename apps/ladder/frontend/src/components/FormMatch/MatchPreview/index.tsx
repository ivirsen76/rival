import classnames from 'classnames';
import style from './style.module.scss';
import PlayerAvatar from '@rival/common/components/PlayerAvatar';
import PlayerName from '@rival/common/components/PlayerName';
import Tooltip from '@rival/common/components/Tooltip';
import _isInteger from 'lodash/isInteger';
import parseScore from '@/components/Match/parseScore';
import { isFullSetScoreCorrect, isFastSetScoreCorrect } from '@rival/ladder.backend/src/services/matches/helpers';

type MatchPreviewProps = {
    tournament: object;
    match: object;
};

const MatchPreview = (props: MatchPreviewProps) => {
    const { tournament, match } = props;
    const { players } = tournament;

    const isFast4 = match.matchFormat === 2;
    const isSetScoreCorrect = isFast4 ? isFastSetScoreCorrect : isFullSetScoreCorrect;
    const sets = parseScore(match.score);
    const isPlayed = Boolean(match.score);
    const showPoints =
        match.type === 'regular' &&
        isPlayed &&
        _isInteger(match.challengerPoints) &&
        _isInteger(match.acceptorPoints) &&
        !match.unavailable;

    const challenger = players[match.challengerId];
    const challenger2 = players[match.challenger2Id];
    const acceptor = players[match.acceptorId];
    const acceptor2 = players[match.acceptor2Id];
    const isDoubles = tournament.levelType === 'doubles';

    const defaultBadge = (
        <td>
            <div className={'badge badge-warning ms-2 ' + style.default}>Default</div>
        </td>
    );
    const unavailableBadge = (
        <td>
            <div className={'badge badge-warning ms-2 ' + style.unavailable} data-unavailable-sign>
                Unavailable
            </div>
        </td>
    );

    const injuryBadge = (
        <td>
            <Tooltip content="Retirement">
                <div className={'badge badge-danger ms-2 me-2 ' + style.injury}>Ret.</div>
            </Tooltip>
        </td>
    );

    return (
        <div className={style.wrapper}>
            <div className={style.matchWrapper}>
                <table className={style.match}>
                    <tbody>
                        <tr>
                            <td>
                                {isDoubles ? (
                                    <PlayerAvatar player1={challenger} player2={challenger2} />
                                ) : (
                                    <PlayerAvatar player1={challenger} />
                                )}
                            </td>
                            <td
                                className={classnames(style.player, 'lh-sm', {
                                    [style.win]: match.winner === challenger.id,
                                })}
                                {...(match.wonByInjury && match.winner === match.acceptorId ? {} : { colSpan: 2 })}
                            >
                                {isDoubles ? (
                                    <PlayerName
                                        player1={challenger}
                                        player2={challenger2}
                                        rank1={match.challengerRank}
                                        rank2={match.challenger2Rank}
                                    />
                                ) : (
                                    <PlayerName
                                        player1={challenger}
                                        rank1={match.type === 'final' ? match.challengerSeed : match.challengerRank}
                                        highlight={false}
                                    />
                                )}
                            </td>
                            {(() => {
                                if (match.wonByDefault) {
                                    return match.winner === match.challengerId ? <td /> : defaultBadge;
                                }
                                if (match.unavailable) {
                                    return match.winner === match.challengerId ? <td /> : unavailableBadge;
                                }

                                const injuryInfo =
                                    match.wonByInjury && match.winner === match.acceptorId ? injuryBadge : null;

                                return (
                                    <>
                                        {injuryInfo}
                                        {sets.map((set, index) => (
                                            <td
                                                key={index}
                                                className={classnames(style.score, {
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
                                                {set.length > 2 && <span className={style.up}>{set[2]}</span>}
                                            </td>
                                        ))}
                                    </>
                                );
                            })()}
                            {showPoints ? (
                                <td className="ps-3">
                                    <span className={'badge badge-square badge-dark ' + style.points}>
                                        +{match.challengerPoints}
                                    </span>
                                </td>
                            ) : null}
                        </tr>
                        <tr>
                            <td>
                                {isDoubles ? (
                                    <PlayerAvatar player1={acceptor} player2={acceptor2} />
                                ) : (
                                    <PlayerAvatar player1={acceptor} />
                                )}
                            </td>
                            <td
                                className={classnames(style.player, 'lh-sm', {
                                    [style.win]: match.winner === acceptor.id,
                                })}
                                {...(match.wonByInjury && match.winner === match.challengerId ? {} : { colSpan: 2 })}
                            >
                                {isDoubles ? (
                                    <PlayerName
                                        player1={acceptor}
                                        player2={acceptor2}
                                        rank1={match.acceptorRank}
                                        rank2={match.acceptor2Rank}
                                    />
                                ) : (
                                    <PlayerName
                                        player1={acceptor}
                                        rank1={match.type === 'final' ? match.acceptorSeed : match.acceptorRank}
                                        highlight={false}
                                    />
                                )}
                            </td>
                            {(() => {
                                if (match.wonByDefault) {
                                    return match.winner === match.acceptorId ? <td /> : defaultBadge;
                                }
                                if (match.unavailable) {
                                    return match.winner === match.acceptorId ? <td /> : unavailableBadge;
                                }

                                const injuryInfo =
                                    match.wonByInjury && match.winner === match.challengerId ? injuryBadge : null;

                                return (
                                    <>
                                        {injuryInfo}
                                        {sets.map((set, index) => (
                                            <td
                                                key={index}
                                                className={classnames(style.score, {
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
                                                {set.length > 2 && <span className={style.up}>{set[3]}</span>}
                                            </td>
                                        ))}
                                    </>
                                );
                            })()}
                            {showPoints ? (
                                <td className="ps-3">
                                    <span className={'badge badge-square badge-dark ' + style.points}>
                                        +{match.acceptorPoints}
                                    </span>
                                </td>
                            ) : null}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MatchPreview;
