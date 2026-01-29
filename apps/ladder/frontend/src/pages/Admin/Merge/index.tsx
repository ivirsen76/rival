import { useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import Loader from '@/components/Loader';
import Card from '@rival/packages/components/Card';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import PlayerName from '@/components/PlayerName';
import { formatDate } from '@/utils/dayjs';
import formatPhone from '@/utils/formatPhone';
import FormMerge from './FormMerge';
import axios from '@/utils/axios';
import classnames from 'classnames';
import WarningIcon from '@rival/packages/metronic/icons/duotone/Code/Warning-1-circle.svg?react';
import _uniqBy from 'lodash/uniqBy';
import confirmation from '@/utils/confirmation';
import showLoader from '@/utils/showLoader';
import useTabs from '../../Tournament/useTabs';
import style from './style.module.scss';

const Merge = () => {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery('getDuplicatedUsers', async () => {
        const response = await axios.put('/api/users/0', { action: 'getDuplicatedUsers' });
        return response.data.data;
    });

    const [duplicatedMode, duplicatedModeTabs] = useTabs({
        options: [
            { value: 'new', label: `New` },
            { value: 'ignored', label: `Ignored` },
        ],
    });

    const duplicates = useMemo(() => {
        if (!data) {
            return [];
        }

        return data
            .filter((item) => (duplicatedMode === 'new' ? !item.ignored : item.ignored))
            .reduce((arr, item) => {
                for (let i = 0; i < item.users.length; i++) {
                    const user = item.users[i];
                    const result = {
                        key: `${item.key}-${user.id}`,
                        duplicateId: item.users[i === 0 ? 1 : 0].id,
                        ...user,
                    };
                    if (i === 0) {
                        result.metrics = item.metrics;
                    }
                    arr.push(result);
                }
                return arr;
            }, []);
    }, [data, duplicatedMode]);

    if (isLoading) {
        return <Loader loading />;
    }

    const renderHistory = (row, code) => {
        if (!row.information?.history?.[code] || row.information.history[code].length === 0) {
            return null;
        }

        const history = _uniqBy(row.information.history[code], 'value');

        return history.map((item, index) => (
            <div className="text-muted" key={index}>
                {code === 'phone' ? formatPhone(item.value) : item.value}
            </div>
        ));
    };

    const ignoreDuplication = async (userId1, userId2) => {
        const confirm = await confirmation({
            message: (
                <div>
                    You will remove this user pair from this list.
                    <br />
                    Are you sure?
                </div>
            ),
        });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put('/api/users/0', { action: 'ignoreDuplicatedUsers', userId1, userId2 });
            await queryClient.invalidateQueries('getDuplicatedUsers');
        });
    };

    const columns = [
        {
            name: 'action',
            className: 'ps-0 pe-0',
            render: (value, row) => (
                <Modal
                    title="Merge players"
                    renderTrigger={({ show }) => (
                        <button
                            className="btn btn-primary btn-xs me-2 text-nowrap"
                            type="button"
                            style={{ transform: 'translate(0,-0.25rem)' }}
                            onClick={show}
                            data-merge-to={row.id}
                        >
                            Use
                        </button>
                    )}
                    renderBody={({ hide }) => (
                        <FormMerge
                            duplicates={duplicates}
                            userIdTo={row.id}
                            userIdFrom={row.duplicateId}
                            hide={hide}
                            onSubmit={async () => {
                                await queryClient.invalidateQueries('getDuplicatedUsers');
                                hide();
                            }}
                        />
                    )}
                />
            ),
        },
        {
            name: 'name',
            label: 'Name',
            className: 'ps-1 pe-0',
            render: (value, row) => (
                <>
                    <div>
                        <PlayerName player1={row} isLink />
                        {row.isCheater ? (
                            <span
                                className="svg-icon svg-icon-2 svg-icon-danger ms-1"
                                title="Possible cheater"
                                data-possible-cheater={row.id}
                            >
                                <WarningIcon />
                            </span>
                        ) : null}
                    </div>
                    {renderHistory(row, 'name')}
                    {!row.metrics && duplicatedMode === 'new' && (
                        <div className="mt-4">
                            <button
                                className="btn btn-secondary btn-xs"
                                type="button"
                                onClick={() => ignoreDuplication(row.duplicateId, row.id)}
                            >
                                Ignore these users
                            </button>
                        </div>
                    )}
                </>
            ),
        },
        {
            name: 'email',
            label: 'Email',
            render: (value, row) => (
                <>
                    <div>{value}</div>
                    <div>{renderHistory(row, 'email')}</div>
                </>
            ),
        },
        {
            name: 'phone',
            label: 'Phone',
            className: 'text-nowrap',
            render: (value, row) => (
                <>
                    <div>{formatPhone(value)}</div>
                    <div>{renderHistory(row, 'phone')}</div>
                </>
            ),
        },
        {
            name: 'birthday',
            label: 'Birthdate',
            render: (value, row) => (
                <>
                    <div>{value}</div>
                    <div>{renderHistory(row, 'birthday')}</div>
                </>
            ),
        },
        {
            name: 'matches',
            label: 'Matches',
            className: 'text-center',
        },
        {
            name: 'createdAt',
            label: 'Joined at',
            render: (value, row) => formatDate(row.createdAt),
        },
        {
            name: 'loggedAt',
            label: 'Logged at',
            render: (value, row) => (row.loggedAt ? formatDate(row.loggedAt) : ''),
        },
        {
            name: 'metrics',
            label: 'Duplicates',
            className: 'text-center',
            render: (value) =>
                value ? (
                    <div className="d-flex flex-column gap-1 align-items-center">
                        {value.map((metric) => (
                            <div
                                key={metric}
                                className={classnames(
                                    'badge',
                                    metric === 'phone' && 'badge-warning',
                                    metric === 'name' && 'badge-success',
                                    metric === 'email' && 'badge-danger',
                                    metric === 'cookie' && 'badge-danger',
                                    metric === 'birthday' && 'badge-info'
                                )}
                            >
                                {metric}
                            </div>
                        ))}
                    </div>
                ) : null,
        },
    ];

    return (
        <Card>
            <div className="mb-8 ms-2">{duplicatedModeTabs}</div>
            <Table
                showRowNumber={false}
                getKey={(row) => row.key}
                className={'table tl-table ' + style.table}
                getRowClassName={(row, index) => (index === 0 ? style.topPair : row.metrics ? style.pair : '')}
                columns={columns}
                data={duplicates}
            />
        </Card>
    );
};

export default Merge;
