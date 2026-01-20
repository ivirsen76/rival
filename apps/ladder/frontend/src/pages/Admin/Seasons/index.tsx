import axios from '@/utils/axios';
import Modal from '@/components/Modal';
import notification from '@/components/notification';
import SeasonForm from './SeasonForm';
import CloseSeasonForm from './CloseSeasonForm';
import Card from '@/components/Card';
import Tooltip from '@/components/Tooltip';
import _capitalize from 'lodash/capitalize';
import useSettings from '@/utils/useSettings';
import { useQueryClient } from 'react-query';
import dayjs from '@/utils/dayjs';
import CloseIcon from '@rival/packages/metronic/icons/duotone/Navigation/Close.svg?react';

const Seasons = props => {
    const queryClient = useQueryClient();
    const { settings } = useSettings();
    const { seasons } = settings;

    const addSeason = async values => {
        await axios.post('/api/seasons', values);
        await queryClient.invalidateQueries();
    };

    const updateSeason = async (id, values) => {
        await axios.patch(`/api/seasons/${id}`, values);
        await queryClient.invalidateQueries();
    };

    const closeSeason = async (id, values) => {
        await axios.put(`/api/seasons/${id}`, { action: 'closeSeason', ...values });
        await queryClient.invalidateQueries();
    };

    const format = date => dayjs.tz(date).format('MMM D');
    const currentDate = dayjs.tz().format('YYYY-MM-DD HH:mm:ss');

    const getStatus = season => {
        if (season.endDate < currentDate) {
            return <span className="badge badge-secondary">Finished</span>;
        }
        if (season.startDate > currentDate) {
            return <span className="badge badge-warning">Upcoming</span>;
        }

        return <span className="badge badge-success">Current</span>;
    };

    const lastSeason = seasons[0];

    return (
        <Card>
            <Modal
                title="Add season"
                renderTrigger={({ show }) => (
                    <button type="button" className="btn btn-primary" onClick={show}>
                        Add season
                    </button>
                )}
                renderBody={({ hide }) => (
                    <SeasonForm
                        initialValues={lastSeason ? { levels: lastSeason.levels.map(level => level.id) } : {}}
                        onSubmit={async values => {
                            await addSeason(values);
                            hide();
                            notification({
                                header: 'Success',
                                message: 'The season has been added.',
                            });
                        }}
                    />
                )}
            />

            <table className="table tl-table tl-table-spacious mt-8" data-season-list>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Dates</th>
                        <th>Status</th>
                        <th style={{ minWidth: '400px' }}>Levels</th>
                    </tr>
                </thead>
                <tbody>
                    {seasons.map(season => (
                        <tr key={season.id} data-season-id={season.id}>
                            <td className="fw-semibold text-nowrap">
                                {currentDate < season.endDate ? (
                                    <Modal
                                        title="Edit season"
                                        renderTrigger={({ show }) => (
                                            <a
                                                href=""
                                                onClick={e => {
                                                    e.preventDefault();
                                                    show();
                                                }}
                                                id={`tl-edit-season-${season.id}`}
                                            >
                                                {season.year} {_capitalize(season.season)}
                                            </a>
                                        )}
                                        renderBody={({ hide }) => (
                                            <SeasonForm
                                                initialValues={{
                                                    ...season,
                                                    weeks: Math.round(
                                                        dayjs(season.endDate).diff(
                                                            dayjs(season.startDate),
                                                            'week',
                                                            true
                                                        )
                                                    ),
                                                    levels: season.levels.map(level => level.id),
                                                }}
                                                isCurrentSeason={currentDate > season.startDate}
                                                onSubmit={async values => {
                                                    await updateSeason(season.id, values);
                                                    hide();
                                                    notification({
                                                        header: 'Success',
                                                        message: 'The season has been updated.',
                                                    });
                                                }}
                                            />
                                        )}
                                    />
                                ) : (
                                    `${season.year} ${_capitalize(season.season)}`
                                )}
                            </td>
                            <td className="text-nowrap">
                                {format(season.startDate)} - {format(dayjs.tz(season.endDate).subtract(1, 'minute'))}
                            </td>
                            <td className="text-nowrap">
                                {getStatus(season)}
                                {currentDate < season.endDate && currentDate > season.startDate && (
                                    <Modal
                                        title="Close the season"
                                        renderTrigger={({ show }) => (
                                            <Tooltip content="Close the season">
                                                <button
                                                    type="button"
                                                    className="btn btn-light-danger btn-icon btn-sm ms-2"
                                                    onClick={show}
                                                    data-close-season
                                                >
                                                    <span className="svg-icon svg-icon-2">
                                                        <CloseIcon />
                                                    </span>
                                                </button>
                                            </Tooltip>
                                        )}
                                        renderBody={({ hide }) => (
                                            <CloseSeasonForm
                                                onSubmit={async values => {
                                                    await closeSeason(season.id, values);
                                                    hide();
                                                    notification({
                                                        header: 'Success',
                                                        message: 'The season has been closed.',
                                                    });
                                                }}
                                            />
                                        )}
                                    />
                                )}
                            </td>
                            <td className="text-muted">{season.levels.map(level => level.name).join(', ')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    );
};

export default Seasons;
