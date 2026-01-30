import { useMemo } from 'react';
import EloPreview from './EloPreview';
import PlayerAvatar from '@rival/common/components/PlayerAvatar';
import PlayerName from '@rival/common/components/PlayerName';
import Tooltip from '@rival/common/components/Tooltip';
import { Link } from 'react-router-dom';
import WarningIcon from '@rival/common/metronic/icons/duotone/Code/Warning-1-circle.svg?react';
import compareFields from '@rival/ladder.backend/src/utils/compareFields';
import formatElo from '@rival/ladder.backend/src/utils/formatElo';
import classnames from 'classnames';
import useAppearance from '@rival/common/utils/useAppearance';
import Tlr from '../Player/Tlr';
import useConfig from '@rival/common/utils/useConfig';
import { useSelector } from 'react-redux';
import style from './style.module.scss';

type PlayersByEloProps = {
    tournament: object;
};

const PlayersByElo = (props: PlayersByEloProps) => {
    const { tournament } = props;
    const appearance = useAppearance();
    const config = useConfig();
    const currentUser = useSelector((state) => state.auth.user);

    const [eloPlayers, newPlayers] = useMemo(() => {
        const list = Object.values(tournament.players);

        return [
            list
                .filter((item) => item.elo.isEloEstablished)
                .sort(compareFields('elo.elo-desc', 'firstName', 'lastName')),
            list.filter((item) => !item.elo.isEloEstablished).sort(compareFields('firstName', 'lastName')),
        ];
    }, [tournament.players]);

    return (
        <table className="table tl-table" data-players-by-elo>
            <thead>
                <tr>
                    <th colSpan={2}>#</th>
                    <th className="ps-0 w-100">Player</th>
                    <th className="d-none d-sm-table-cell text-center">Matches</th>
                    <th className="d-none d-sm-table-cell text-nowrap text-center">Win - Loss</th>
                    <th className="text-center">TLR</th>
                    <th className="text-center ps-0">Trend</th>
                </tr>
            </thead>
            <tbody>
                {eloPlayers.map((player, index) => (
                    <tr
                        key={player.id}
                        className={classnames(currentUser?.id === player.userId && 'table-primary tl-tr-all-round')}
                    >
                        <td className={style.value}>{index + 1}</td>
                        <td>
                            <div className={style.avatar}>
                                <PlayerAvatar player1={player} />
                            </div>
                        </td>
                        <td className="ps-0 w-100 text-break" style={{ fontSize: '1rem', lineHeight: '1.3' }}>
                            <PlayerName
                                player1={player}
                                isLink
                                className={
                                    player.isStartingTlrTooHigh || player.isInitialTlrTooHigh
                                        ? style.tooStrongLink
                                        : null
                                }
                            />
                            {player.isStartingTlrTooHigh || player.isInitialTlrTooHigh ? (
                                <Tooltip
                                    content={
                                        <div className="text-center">
                                            Ineligible for Final Tournament
                                            <br />
                                            {player.isStartingTlrTooHigh
                                                ? '(TLR too high at season start)'
                                                : player.isInitialTlrTooHigh
                                                  ? '(initial TLR too high)'
                                                  : null}
                                        </div>
                                    }
                                >
                                    <span
                                        className="svg-icon svg-icon-2 svg-icon-danger ms-1"
                                        data-too-high-tlr={player.id}
                                    >
                                        <WarningIcon />
                                    </span>
                                </Tooltip>
                            ) : null}
                        </td>
                        <td className="d-none d-sm-table-cell text-center">{player.elo.matches}</td>
                        <td className="d-none d-sm-table-cell text-center text-nowrap">
                            {player.elo.won} - {player.elo.lost}
                        </td>
                        <td className="text-center">
                            <span className={`badge badge-square badge-dark ${style.elo}`}>
                                {formatElo(player.elo.elo)}
                            </span>
                        </td>
                        <td className="text-center ps-0">
                            <Tlr
                                user={{
                                    id: player.userId,
                                    firstName: player.firstName,
                                    lastName: player.lastName,
                                }}
                                renderTrigger={({ show }) => (
                                    <button
                                        type="button"
                                        className={classnames(
                                            'btn',
                                            appearance === 'light' ? 'btn-secondary' : 'btn-light'
                                        )}
                                        style={{ padding: '0.2rem', lineHeight: 0 }}
                                        onClick={show}
                                        data-elo-history={player.id}
                                    >
                                        <EloPreview width={60} height={30} data={player.elo.trend} />
                                    </button>
                                )}
                                tournament={tournament}
                            />
                        </td>
                    </tr>
                ))}
                {newPlayers.length > 0 && (
                    <tr>
                        <td colSpan="7">
                            <h3 className={classnames(eloPlayers.length > 0 ? 'mt-12' : 'mt-4')}>
                                TLR Not Established
                            </h3>
                            <div className="text-muted mt-n2 mb-4">
                                Players must play {config.minMatchesToEstablishTlr} singles matches to establish TLR.
                            </div>
                        </td>
                    </tr>
                )}
                {newPlayers.map((player, index) => (
                    <tr key={player.id} className={classnames(currentUser?.id === player.userId && 'table-primary')}>
                        <td className={style.value}>{eloPlayers.length + index + 1}</td>
                        <td>
                            <div className={style.avatar}>
                                <PlayerAvatar player1={player} />
                            </div>
                        </td>
                        <td className="ps-0 w-100 text-break" style={{ fontSize: '1rem', lineHeight: '1.3' }}>
                            <Link to={`/player/${player.userSlug}`} className="fw-semibold">
                                {player.firstName} {player.lastName}
                            </Link>
                        </td>
                        <td className="d-none d-sm-table-cell text-center">{player.elo.matches}</td>
                        <td className="d-none d-sm-table-cell text-center text-nowrap">
                            {player.elo.won} - {player.elo.lost}
                        </td>
                        <td className="text-center">
                            <span className={`badge badge-square badge-dark ${style.elo}`}>?</span>
                        </td>
                        <td className="ps-0" />
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default PlayersByElo;
