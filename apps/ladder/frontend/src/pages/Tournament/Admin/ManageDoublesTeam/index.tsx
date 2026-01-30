import { useState, useEffect, useMemo, useCallback } from 'react';
import Card from '@rival/common/components/Card';
import Modal from '@rival/common/components/Modal';
import PlayerName from '@rival/common/components/PlayerName';
import PlayerAvatar from '@rival/common/components/PlayerAvatar';
import CreateTeamFromPoolForm from './CreateTeamFromPoolForm';
import FormChangeTeamName from '@/components/FormChangeTeamName';
import notification from '@rival/common/components/notification';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import EditIcon from '@rival/common/metronic/icons/duotone/General/Edit.svg?react';
import classnames from 'classnames';
import axios from '@rival/common/axios';
import movePartner from './movePartner';
import _omit from 'lodash/omit';
import style from './style.module.scss';

type ManageDoublesTeamProps = {
    tournament: object;
    reloadTournament: (...args: unknown[]) => unknown;
};

const ManageDoublesTeam = (props: ManageDoublesTeamProps) => {
    const { tournament, reloadTournament } = props;
    const [draggedPlayerId, setDraggedPlayerId] = useState(null);
    const [cachedTournament, setCachedTournament] = useState(tournament);

    const { captains, poolPlayers, playersWithMatches } = useMemo(() => {
        const players = Object.values(cachedTournament.players);

        return {
            captains: players
                .filter((player) => player.isDoublesTeamCaptain)
                .sort((a, b) => (a.teamName || '').localeCompare(b.teamName || '')),
            poolPlayers: players.filter((player) => player.isDoublesTeamPlayerPool),
            playersWithMatches: cachedTournament.matches
                .filter((match) => match.score)
                .reduce((set, match) => {
                    set.add(match.challengerId);
                    set.add(match.challenger2Id);
                    set.add(match.acceptorId);
                    set.add(match.acceptor2Id);
                    return set;
                }, new Set()),
        };
    }, [cachedTournament]);

    useEffect(() => {
        setCachedTournament(tournament);
    }, [tournament]);

    const onDragStart = useCallback(async (result) => {
        setDraggedPlayerId(Number(result.draggableId));
    });

    const onDragEnd = useCallback(async (result) => {
        setDraggedPlayerId(null);

        if (!result.destination) {
            return;
        }

        const playerId = Number(result.draggableId);
        const fromCaptainId = Number(result.source.droppableId);
        const toCaptainId = Number(result.destination.droppableId);
        const replaceCaptain = result.destination.index === 0;

        // if captain is dragged to the same position
        if (playerId === toCaptainId && replaceCaptain) {
            return;
        }

        // if partner is dragged to the same team
        if (toCaptainId === fromCaptainId && playerId !== toCaptainId && !replaceCaptain) {
            return;
        }

        // ignore dragging inside player pool
        if (toCaptainId === fromCaptainId && toCaptainId === 999999) {
            return;
        }

        setCachedTournament(
            movePartner({
                tournament: cachedTournament,
                playerId,
                captainId: toCaptainId,
                replaceCaptain,
            })
        );

        await axios.put(`/api/players/${playerId}`, {
            action: 'movePartner',
            toCaptainId,
            isReplaceCaptain: replaceCaptain,
        });
        await reloadTournament();
    });

    const isPoolDropDisabled = Boolean(
        draggedPlayerId &&
        (poolPlayers.some((item) => item.id === draggedPlayerId) || playersWithMatches.has(draggedPlayerId))
    );

    return (
        <Card>
            <Modal
                title="Create a Team from Player Pool"
                renderTrigger={({ show }) => (
                    <button type="button" className="btn btn-primary" onClick={show}>
                        Create team from Player Pool
                    </button>
                )}
                backdrop="static"
                keyboard={false}
                renderBody={({ hide }) => (
                    <CreateTeamFromPoolForm
                        tournament={tournament}
                        onSubmit={async (values) => {
                            await reloadTournament();
                            hide();
                            notification({
                                header: 'Success',
                                message: 'The team was successfuly created.',
                            });
                        }}
                    />
                )}
            />

            <h3>Manage Teams</h3>
            <ul className="ps-8 mb-8">
                <li className="m-0">Drag & Drop players to the desired team.</li>
                <li className="m-0">Captain is the teammate on the first position.</li>
                <li className="m-0">Other teammates are always ordered based on the join date.</li>
                <li className="m-0">Cannot move players with matches to another team (*).</li>
                <li className="m-0">No messages are sent to players.</li>
            </ul>

            <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
                <div className={style.teams}>
                    {captains.map((captain) => {
                        const isDropDisabled = (() => {
                            const fromDifferentTeam = !captain.partnerIds.includes(draggedPlayerId);

                            if (captain.partnerIds.length >= 3 && fromDifferentTeam) {
                                return true;
                            }
                            if (playersWithMatches.has(draggedPlayerId) && fromDifferentTeam) {
                                return true;
                            }

                            return false;
                        })();

                        return (
                            <div
                                key={captain.id}
                                className={classnames(
                                    style.team,
                                    draggedPlayerId && !isDropDisabled && style.droppable
                                )}
                            >
                                <div className={style.name}>
                                    {captain.teamName || '-'}
                                    <Modal
                                        title="Edit team name"
                                        renderTrigger={({ show }) => (
                                            <button className="btn btn-secondary btn-xs" onClick={show}>
                                                <span className="svg-icon svg-icon-6">
                                                    <EditIcon />
                                                </span>
                                            </button>
                                        )}
                                        renderBody={({ hide }) => (
                                            <FormChangeTeamName
                                                playerId={captain.id}
                                                tournament={tournament}
                                                initialValues={{ teamName: captain.teamName || '' }}
                                                onSubmit={async (values) => {
                                                    await reloadTournament();
                                                    hide();
                                                }}
                                            />
                                        )}
                                    />
                                </div>
                                <Droppable droppableId={captain.id.toString()} isDropDisabled={isDropDisabled}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={style.partners}
                                        >
                                            {captain.partnerIds.map((partnerId, index) => {
                                                const partner = _omit(tournament.players[partnerId], [
                                                    'partners',
                                                    'partnerIds',
                                                ]);

                                                return (
                                                    <Draggable
                                                        key={partner.id}
                                                        draggableId={partner.id.toString()}
                                                        index={index}
                                                    >
                                                        {(provided1) => (
                                                            <div
                                                                ref={provided1.innerRef}
                                                                {...provided1.draggableProps}
                                                                {...provided1.dragHandleProps}
                                                                className={style.partner}
                                                            >
                                                                <PlayerAvatar player1={partner} />
                                                                <PlayerName
                                                                    player1={partner}
                                                                    elo1={
                                                                        partner.elo.isEloEstablished
                                                                            ? partner.elo.elo
                                                                            : null
                                                                    }
                                                                    isLink
                                                                    highlight={false}
                                                                />
                                                                {playersWithMatches.has(partner.id) && <span>*</span>}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
                <div className={style.teams + ' mt-8'}>
                    <div className={classnames(style.team, draggedPlayerId && !isPoolDropDisabled && style.droppable)}>
                        <div className={style.name}>Player pool</div>
                        <Droppable droppableId="999999" isDropDisabled={isPoolDropDisabled}>
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className={style.partners}>
                                    {poolPlayers.map((partner, index) => {
                                        partner = _omit(partner, ['partners', 'partnerIds']);

                                        return (
                                            <Draggable
                                                key={partner.id}
                                                draggableId={partner.id.toString()}
                                                index={index}
                                            >
                                                {(provided1) => (
                                                    <div
                                                        ref={provided1.innerRef}
                                                        {...provided1.draggableProps}
                                                        {...provided1.dragHandleProps}
                                                        className={style.partner}
                                                    >
                                                        <PlayerAvatar player1={partner} />
                                                        <PlayerName
                                                            player1={partner}
                                                            elo1={partner.elo.isEloEstablished ? partner.elo.elo : null}
                                                            isLink
                                                            highlight={false}
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                </div>
            </DragDropContext>
        </Card>
    );
};

export default ManageDoublesTeam;
