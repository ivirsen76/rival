import { useState } from 'react';
import classnames from 'classnames';
import useBreakpoints from '@rival/common/utils/useBreakpoints';
import compareFields from '@rival/club.backend/src/utils/compareFields';
import PlayerName from '@rival/common/components/PlayerName';
import style from './usePlayerFilter.module.scss';

export default function usePlayerFilter({ players }) {
    const [selected, setSelected] = useState([]);
    const size = useBreakpoints();

    const playerList = Object.values(players)
        .filter((item) => {
            if (item.hidden) {
                return false;
            }
            if (item.partners?.length < 2) {
                return false;
            }
            return true;
        })
        .sort(compareFields('teamName', 'firstName', 'lastName'));

    const togglePlayer = (id) => {
        if (selected.includes(id)) {
            setSelected([]);
        } else {
            const player = players[id];
            setSelected(player.partnerIds || [id]);
        }
    };

    const isSmall = ['xs', 'sm', 'md'].includes(size);

    const playerFilter = (
        <>
            <h3>Players</h3>
            {isSmall ? (
                <select className={'form-select ' + style.select} onChange={(e) => togglePlayer(+e.target.value)}>
                    <option value="0">All players</option>
                    {playerList.map((player) => (
                        <option key={player.id} value={player.id} selected={selected.includes(player.id)}>
                            <PlayerName player1={player} />
                        </option>
                    ))}
                </select>
            ) : (
                <div className="mb-n2">
                    <div className="mb-3">
                        <button
                            type="button"
                            className={classnames('btn btn-sm me-2 mb-2', {
                                'btn-primary': selected.length === 0,
                                'btn-light': selected.length > 0,
                            })}
                            onClick={() => setSelected([])}
                        >
                            All players
                        </button>
                    </div>
                    {playerList.map((player) => (
                        <button
                            key={player.id}
                            type="button"
                            className={classnames('btn btn-sm me-2 mb-2', {
                                'btn-primary': selected.includes(player.id),
                                'btn-light': !selected.includes(player.id),
                            })}
                            onClick={() => togglePlayer(player.id)}
                        >
                            <PlayerName player1={player} />
                        </button>
                    ))}
                </div>
            )}
        </>
    );

    return { selected, playerFilter };
}
