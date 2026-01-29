import { useMemo } from 'react';
import Card from '@rival/packages/components/Card';
import Modal from '@/components/Modal';
import PlayerName from '@/components/PlayerName';
import AddPlayerForm from './AddPlayerForm';
import ManageDoublesTeam from './ManageDoublesTeam';
import CloseIcon from '@rival/packages/metronic/icons/duotone/Navigation/Close.svg?react';
import StopIcon from '@rival/packages/metronic/icons/duotone/Code/Stop.svg?react';
import UpdateIcon from '@rival/packages/metronic/icons/duotone/General/Update.svg?react';
import axios from '@/utils/axios';
import notification from '@/components/notification';
import confirmation from '@rival/packages/utils/confirmation';
import showLoader from '@rival/packages/utils/showLoader';
import compareFields from '@rival/ladder.backend/src/utils/compareFields';

type AdminProps = {
    tournament: object;
    reloadTournament: (...args: unknown[]) => unknown;
};

const Admin = (props: AdminProps) => {
    const { tournament, reloadTournament } = props;

    const sortedPlayers = useMemo(
        () => Object.values(tournament.players).sort(compareFields('firstName', 'lastName')),
        [tournament.players]
    );

    const removePlayer = async (player) => {
        const confirm = await confirmation({
            title: 'Remove player',
            message: (
                <div>
                    You are about to remove {player.firstName} {player.lastName} from the ladder.
                    <br />
                    Are you sure?
                </div>
            ),
        });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.delete(`/api/players/${player.id}`);
            await reloadTournament();

            notification({
                header: 'Success',
                message: `${player.firstName} ${player.lastName} removed from the ladder.`,
            });
        });
    };

    const activatePlayer = async (player) => {
        const confirm = await confirmation({
            title: 'Activate player',
            message: (
                <div>
                    You are about to activate {player.firstName} {player.lastName} for this ladder.
                    <br />
                    Are you sure?
                </div>
            ),
        });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put(`/api/players/${player.id}`, { action: 'activatePlayer' });
            await reloadTournament();

            notification({
                header: 'Success',
                message: `${player.firstName} ${player.lastName} activated for this ladder.`,
            });
        });
    };

    const deactivatePlayer = async (player) => {
        const confirm = await confirmation({
            title: 'Deactivate player',
            message: (
                <div>
                    You are about to deactivate {player.firstName} {player.lastName} for this ladder.
                    <br />
                    Are you sure?
                </div>
            ),
        });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put(`/api/players/${player.id}`, { action: 'deactivatePlayer' });
            await reloadTournament();

            notification({
                header: 'Success',
                message: `${player.firstName} ${player.lastName} deactivated for this ladder.`,
            });
        });
    };

    if (tournament.levelType === 'doubles-team') {
        return <ManageDoublesTeam tournament={tournament} reloadTournament={reloadTournament} />;
    }

    return (
        <Card>
            <Modal
                title="Add players"
                size="lg"
                renderTrigger={({ show }) => (
                    <button type="button" className="btn btn-primary" onClick={show}>
                        Add players
                    </button>
                )}
                backdrop="static"
                keyboard={false}
                renderBody={({ hide }) => (
                    <AddPlayerForm
                        sortedPlayers={sortedPlayers}
                        onSubmit={async (values) => {
                            await axios.put('/api/players/0', {
                                action: 'batchAddPlayers',
                                tournamentId: tournament.id,
                                users: values.users.map((user) => user.id),
                            });
                            await reloadTournament();
                            hide();
                            notification({
                                header: 'Success',
                                message: `${values.users.length} players were added to the ladder.`,
                            });
                        }}
                    />
                )}
            />

            <table className="table tl-table mt-8" style={{ width: 'auto' }}>
                <thead>
                    <tr>
                        <th>&nbsp;</th>
                        <th>#</th>
                        <th>Player</th>
                        <th className="text-center">Matches</th>
                        <th className="text-center">Proposals</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedPlayers.map((player, index) => {
                        const hasStartedPlaying = player.stats.total.matches + player.stats.total.proposals > 0;
                        const isActive = player.isActive;

                        return (
                            <tr key={player.id}>
                                <td>
                                    {isActive ? (
                                        <button
                                            type="button"
                                            className="btn btn-light-danger btn-icon btn-sm"
                                            onClick={() =>
                                                hasStartedPlaying ? deactivatePlayer(player) : removePlayer(player)
                                            }
                                            data-remove-player={player.userId}
                                        >
                                            <span className="svg-icon svg-icon-2">
                                                <CloseIcon />
                                            </span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn btn-light-success btn-icon btn-sm"
                                            onClick={() => activatePlayer(player)}
                                            style={player.deletedAt ? { visibility: 'hidden' } : {}}
                                            data-activate-player={player.userId}
                                        >
                                            <span className="svg-icon svg-icon-2">
                                                <UpdateIcon />
                                            </span>
                                        </button>
                                    )}
                                </td>
                                <td>{index + 1}</td>
                                <td>
                                    <PlayerName player1={player} isLink />
                                    {!isActive && (
                                        <span
                                            className="svg-icon svg-icon-2 svg-icon-danger ms-2"
                                            data-inactive-player={player.userId}
                                        >
                                            <StopIcon />
                                        </span>
                                    )}
                                </td>
                                <td className="text-center">{player.stats.total.matches}</td>
                                <td className="text-center">{player.stats.total.proposals}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </Card>
    );
};

export default Admin;
