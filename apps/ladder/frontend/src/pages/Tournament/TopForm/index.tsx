import PropTypes from 'prop-types';
import PlayerAvatar from '@/components/PlayerAvatar';
import compareFields from '@rival/ladder.backend/src/utils/compareFields';
import formatElo from '@rival/ladder.backend/src/utils/formatElo';
import style from './style.module.scss';

const MostProgress = (props) => {
    const { topForm, players } = props.tournament;

    const sortedTopForm = topForm
        .map((obj) => ({
            ...obj,
            player: players[obj.id],
        }))
        .sort(compareFields('player.firstName', 'player.lastName'));

    return (
        <div>
            <h3>Personal Best</h3>
            {sortedTopForm.length > 0 ? (
                <table className="table tl-table tl-table-spacious">
                    <thead>
                        <tr>
                            <th colSpan={2}>Player</th>
                            <th className="text-end text-nowrap">TLR</th>
                        </tr>
                    </thead>

                    <tbody>
                        {sortedTopForm.map((obj) => (
                            <tr key={obj.id}>
                                <td>
                                    <PlayerAvatar player1={obj.player} />
                                </td>
                                <td className="ps-0 w-100 text-break">
                                    {obj.player.firstName} {obj.player.lastName}
                                </td>
                                <td className="text-start fw-bold">
                                    {formatElo(obj.elo)}
                                    <span className={style.badge}>+{formatElo(obj.diff)}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div>There are no players with the personal best this season</div>
            )}
        </div>
    );
};

MostProgress.propTypes = {
    tournament: PropTypes.object,
};

export default MostProgress;
