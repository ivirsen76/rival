import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerName from '@/components/PlayerName';
import classnames from 'classnames';

type MostMatchesProps = {
    tournament?: object;
    isReport?: boolean;
};

const MostMatches = (props: MostMatchesProps) => {
    const { mostMatches, players } = props.tournament;
    const { isReport } = props;

    return (
        <>
            <h3>Most Matches</h3>
            <table className={classnames('table tl-table tl-table-spacious', { 'tl-table-report': isReport })}>
                <thead>
                    <tr>
                        <th colSpan={2}>Player</th>
                        <th className="text-end">Matches</th>
                    </tr>
                </thead>

                <tbody>
                    {mostMatches.map((obj) => {
                        const player = players[obj.id];

                        return (
                            <tr key={obj.id}>
                                <td>
                                    <PlayerAvatar player1={player} />
                                </td>
                                <td className="ps-0 text-break w-100">
                                    <PlayerName player1={player} highlight={false} />
                                </td>
                                <td className="text-end fw-bold">{obj.matches}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </>
    );
};

export default MostMatches;
