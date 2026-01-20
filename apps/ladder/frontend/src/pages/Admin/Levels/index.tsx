import { useQueryClient } from 'react-query';
import axios from '@/utils/axios';
import MoveIcon from '@rival/packages/metronic/icons/duotone/Navigation/Arrows-v.svg?react';
import Modal from '@/components/Modal';
import Card from '@/components/Card';
import Tooltip from '@/components/Tooltip';
import notification from '@/components/notification';
import LevelForm from './LevelForm';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import useSettings from '@/utils/useSettings';

const reorder = (list, startIndex, endIndex) => {
    const result = [...list];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

const Levels = (props) => {
    const queryClient = useQueryClient();
    const { settings } = useSettings();
    const { levels } = settings;

    const addLevel = async (values) => {
        await axios.post('/api/levels', values);
        await queryClient.invalidateQueries();
    };

    const updateLevel = async (id, values) => {
        await axios.patch(`/api/levels/${id}`, values);
        await queryClient.invalidateQueries();
    };

    const onDragEnd = async (result) => {
        if (!result.destination || result.source.index === result.destination.index) {
            return;
        }

        const newLevels = reorder(levels, result.source.index, result.destination.index);
        queryClient.setQueryData('globalSettings', { ...settings, levels: newLevels });

        await axios.put(`/api/levels/${levels[result.source.index].id}`, {
            destinationId: levels[result.destination.index].id,
        });
    };

    return (
        <Card>
            <Modal
                title="Add level"
                renderTrigger={({ show }) => (
                    <button type="button" className="btn btn-primary" onClick={show}>
                        Add level
                    </button>
                )}
                renderBody={({ hide }) => (
                    <LevelForm
                        onSubmit={async (values) => {
                            await addLevel(values);
                            hide();
                            notification({
                                header: 'Success',
                                message: 'The level has been added.',
                            });
                        }}
                    />
                )}
            />

            <DragDropContext onDragEnd={onDragEnd}>
                <table className="table table-sm align-middle w-auto mt-8 mb-0">
                    <Droppable droppableId="droppable">
                        {(provided) => (
                            <tbody ref={provided.innerRef} {...provided.droppableProps} data-level-list>
                                {levels.map((level, index) => (
                                    <Draggable key={level.id} draggableId={level.id.toString()} index={index}>
                                        {(provided1, snapshot) => (
                                            <tr ref={provided1.innerRef} {...provided1.draggableProps}>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-bg-secondary btn-color-dark btn-icon btn-sm"
                                                        {...provided1.dragHandleProps}
                                                        data-level-id={level.id}
                                                    >
                                                        <span className="svg-icon svg-icon-2">
                                                            <MoveIcon />
                                                        </span>
                                                    </button>
                                                </td>
                                                <td className="ps-0 pe-1">
                                                    {level.type === 'single' ? (
                                                        <Tooltip content="Single">
                                                            <div className="badge badge-square badge-success badge-small ms-2">
                                                                S
                                                            </div>
                                                        </Tooltip>
                                                    ) : level.type === 'doubles-team' ? (
                                                        <Tooltip content="Doubles Team">
                                                            <div className="badge badge-square badge-primary badge-small ms-2">
                                                                T
                                                            </div>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip content="Doubles">
                                                            <div className="badge badge-square badge-warning badge-small ms-2">
                                                                D
                                                            </div>
                                                        </Tooltip>
                                                    )}
                                                </td>
                                                <td className="fw-semibold text-nowrap">
                                                    <Modal
                                                        title="Edit level"
                                                        renderTrigger={({ show }) => (
                                                            <a
                                                                href=""
                                                                id={`tl-edit-level-${level.id}`}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    show();
                                                                }}
                                                            >
                                                                {level.name}
                                                            </a>
                                                        )}
                                                        renderBody={({ hide }) => (
                                                            <LevelForm
                                                                initialValues={level}
                                                                hideType
                                                                onSubmit={async (values) => {
                                                                    await updateLevel(level.id, values);
                                                                    hide();
                                                                    notification({
                                                                        header: 'Success',
                                                                        message: 'The level has been updated.',
                                                                    });
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </tbody>
                        )}
                    </Droppable>
                </table>
            </DragDropContext>
        </Card>
    );
};

export default Levels;
