import PropTypes from 'prop-types';
import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerName from '@/components/PlayerName';
import Tooltip from '@/components/Tooltip';
import CaptainIcon from '@/assets/captain.svg?react';
import style from './style.module.scss';

const TeamInfo = props => {
    const { captain, tournament } = props;

    const stats = (() => {
        const result = captain.partners.reduce((obj, item) => {
            obj[item.id] = { matches: 0, win: 0, lost: 0 };
            return obj;
        }, {});

        const processPlayer = (playerId, isWinner) => {
            if (!playerId || !result[playerId]) {
                return;
            }

            result[playerId].matches++;
            result[playerId].win += isWinner ? 1 : 0;
            result[playerId].lost += isWinner ? 0 : 1;
        };

        tournament.matches
            .filter(match => match.score)
            .forEach(match => {
                processPlayer(match.challengerId, match.challengerId === match.winner);
                processPlayer(match.challenger2Id, match.challengerId === match.winner);
                processPlayer(match.acceptorId, match.acceptorId === match.winner);
                processPlayer(match.acceptor2Id, match.acceptorId === match.winner);
            });

        return result;
    })();

    return (
        <div>
            <div className="d-flex gap-4">
                <div className={style.avatar}>
                    <PlayerAvatar player1={captain} highQuality />
                </div>
                <div>
                    <h3 className="mt-2 mb-2">{captain.teamName}</h3>
                    <div className="text-muted">
                        {captain.stats.live.matches} match{captain.stats.live.matches !== 1 ? 'es' : ''}
                    </div>
                </div>
            </div>

            <table className="table tl-table mt-6">
                <thead>
                    <tr>
                        <th className="w-100" colSpan={2}>
                            Teammate
                        </th>
                        <th className="text-center d-none d-xl-table-cell">Matches</th>
                        <th className="text-nowrap text-center">
                            <span className="d-none d-xl-inline">Win - Loss</span>
                            <span className="d-inline d-xl-none">W - L</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {captain.partners.map((partner, index) => (
                        <tr key={partner.id}>
                            <td>
                                <PlayerAvatar player1={partner} />
                            </td>
                            <td className="w-100 ps-0">
                                <PlayerName player1={partner} isLink className="me-2" />
                                {index === 0 && (
                                    <Tooltip content="Captain">
                                        <span>
                                            <CaptainIcon className={style.captain} />
                                        </span>
                                    </Tooltip>
                                )}
                            </td>
                            <td className="text-center text-nowrap d-none d-xl-table-cell">
                                {stats[partner.id].matches}
                            </td>
                            <td className="text-center text-nowrap">
                                {stats[partner.id].win} - {stats[partner.id].lost}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

TeamInfo.propTypes = {
    captain: PropTypes.object,
    tournament: PropTypes.object,
};

TeamInfo.defaultProps = {};

export default TeamInfo;
