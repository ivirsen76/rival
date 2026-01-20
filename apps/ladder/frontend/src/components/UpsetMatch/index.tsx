/* eslint-disable react/no-array-index-key */

import PropTypes from 'prop-types';
import classnames from 'classnames';
import style from './style.module.scss';
import PlayerName from '@/components/PlayerName';
import PlayerAvatar from '@/components/PlayerAvatar';
import Tooltip from '@/components/Tooltip';
import { formatMiddle } from '@/utils/dayjs';
import useConfig from '@/utils/useConfig';
import parseScore from '@/components/Match/parseScore';

const Match = props => {
    const { challenger, acceptor, challenger2, acceptor2, match, extraData } = props;
    const config = useConfig();

    const sets = parseScore(match.score);

    const defaultBadge = (
        <td>
            <div className={'badge badge-warning ms-2 ps-2 pe-2 ' + style.default}>Default</div>
        </td>
    );

    const injuryBadge = (
        <td>
            <Tooltip content="Retirement">
                <div className={'badge badge-danger ms-2 me-2 ' + style.injury}>Ret.</div>
            </Tooltip>
        </td>
    );

    const challengerRow = (
        <tr>
            <td>
                <PlayerAvatar player1={challenger} player2={challenger2} />
            </td>
            <td
                className={style.player + ' lh-sm'}
                {...((match.wonByDefault || match.wonByInjury) && match.winner === match.challengerId
                    ? { colSpan: 2 }
                    : {})}
            >
                <PlayerName
                    player1={challenger}
                    player2={challenger2}
                    elo1={
                        match.challengerMatches <= config.minMatchesToEstablishTlr
                            ? null
                            : match.challengerElo - match.challengerEloChange
                    }
                />
            </td>
            {(() => {
                if (match.wonByDefault) {
                    return match.winner === match.challengerId ? null : defaultBadge;
                }
                const injuryInfo = match.wonByInjury && match.winner === match.acceptorId ? injuryBadge : null;

                return (
                    <>
                        {injuryInfo}
                        {sets.map((set, index) => (
                            <td key={index} className={classnames(style.score, { [style.win]: set[0] > set[1] })}>
                                {set[0]}
                                {set.length > 2 && <span className={style.up}>{set[2]}</span>}
                            </td>
                        ))}
                    </>
                );
            })()}
        </tr>
    );
    const acceptorRow = (
        <tr>
            <td>
                <PlayerAvatar player1={acceptor} player2={acceptor2} />
            </td>
            <td
                className={style.player + ' lh-sm'}
                {...((match.wonByDefault || match.wonByInjury) && match.winner === match.acceptorId
                    ? { colSpan: 2 }
                    : {})}
            >
                <PlayerName
                    player1={acceptor}
                    player2={acceptor2}
                    elo1={
                        match.acceptorMatches <= config.minMatchesToEstablishTlr
                            ? null
                            : match.acceptorElo - match.acceptorEloChange
                    }
                />
            </td>
            {(() => {
                if (match.wonByDefault) {
                    return match.winner === match.acceptorId ? null : defaultBadge;
                }
                const injuryInfo = match.wonByInjury && match.winner === match.challengerId ? injuryBadge : null;

                return (
                    <>
                        {injuryInfo}
                        {sets.map((set, index) => (
                            <td key={index} className={classnames(style.score, { [style.win]: set[1] > set[0] })}>
                                {set[1]}
                                {set.length > 2 && <span className={style.up}>{set[3]}</span>}
                            </td>
                        ))}
                    </>
                );
            })()}
        </tr>
    );

    const dateFormat = props.customDateFormat || formatMiddle;
    const hasHeader = Boolean(match.playedAt || extraData);

    return (
        <div className={style.wrapper} data-match={match.id}>
            {hasHeader && (
                <div className={style.header}>
                    <div className={classnames(style.time, 'text-nowrap')} data-playwright-placeholder="middle">
                        {match.playedAt ? dateFormat(match.playedAt) : null}
                    </div>
                    {extraData && <div className={classnames(style.time, 'text-end')}>{extraData}</div>}
                </div>
            )}
            <div className={classnames(style.matchWrapper, !hasHeader && 'mt-n6')}>
                <table className={style.match}>
                    <tbody>
                        {match.winner === match.challengerId ? challengerRow : acceptorRow}
                        {match.winner === match.challengerId ? acceptorRow : challengerRow}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

Match.propTypes = {
    challenger: PropTypes.object,
    acceptor: PropTypes.object,
    challenger2: PropTypes.object,
    acceptor2: PropTypes.object,
    match: PropTypes.object,
    customDateFormat: PropTypes.func,
    extraData: PropTypes.node,
};

Match.defaultProps = {};

export default Match;
