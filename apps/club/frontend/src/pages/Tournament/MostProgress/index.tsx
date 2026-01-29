import PlayerAvatar from '@/components/PlayerAvatar';
import classnames from 'classnames';
import formatElo from '@rival/ladder.backend/src/utils/formatElo';
import style from './style.module.scss';

type MostProgressProps = {
    tournament: object;
    isReport: boolean;
};

const MostProgress = (props: MostProgressProps) => {
    const { mostProgress, players } = props.tournament;
    const { isReport } = props;

    return (
        <>
            <h3>Most Progress</h3>
            {mostProgress.length > 0 ? (
                <table className={classnames('table tl-table tl-table-spacious', { 'tl-table-report': isReport })}>
                    <thead>
                        <tr>
                            <th colSpan={2}>Player</th>
                            <th className="text-end text-nowrap">TLR</th>
                        </tr>
                    </thead>

                    <tbody>
                        {mostProgress.map((obj) => {
                            const player = players[obj.id];

                            return (
                                <tr key={obj.id}>
                                    <td>
                                        <PlayerAvatar player1={player} />
                                    </td>
                                    <td className="ps-0 w-100 text-break">
                                        {player.firstName} {player.lastName}
                                    </td>
                                    <td className="text-start fw-bold">
                                        {formatElo(obj.elo)}
                                        <span className={style.badge}>+{formatElo(obj.progress)}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <div>There are no players with the progress this season</div>
            )}
        </>
    );
};

export default MostProgress;
