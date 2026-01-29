import Table from '@rival/packages/components/Table';
import { useQuery, useQueryClient } from 'react-query';
import Loader from '@rival/packages/components/Loader';
import Card from '@rival/packages/components/Card';
import Modal from '@/components/Modal';
import notification from '@/components/notification';
import ChangePasswordForm from './ChangePasswordForm';
import axios from '@/utils/axios';
import { Link } from 'react-router-dom';
import formatPhone from '@rival/packages/utils/formatPhone';
import LockIcon from '@rival/packages/metronic/icons/duotone/Interface/Lock.svg?react';
import { formatDate } from '@/utils/dayjs';
import { comeFromOptions } from '@/components/Authentication/Register';
import CheckIcon from '@rival/packages/metronic/icons/duotone/Navigation/Check.svg?react';
import CloseIcon from '@rival/packages/metronic/icons/duotone/Navigation/Close.svg?react';
import UpdateIcon from '@rival/packages/metronic/icons/duotone/General/Update.svg?react';
import { useSelector } from 'react-redux';
import hasAnyRole from '@rival/packages/utils/hasAnyRole';
import confirmation from '@rival/packages/utils/confirmation';
import showLoader from '@rival/packages/utils/showLoader';

const getFilteredData = (item, filter) => {
    filter = filter.toLowerCase();

    return (
        (item.name && item.name.toLowerCase().includes(filter)) ||
        (item.email && item.email.toLowerCase().includes(filter)) ||
        (item.phone && item.phone.includes(filter.replace(/-/g, ''))) ||
        (item.birthday && item.birthday.includes(filter))
    );
};

const Players = () => {
    const { data: users, isLoading } = useQuery(
        'getAllUsers',
        async () => {
            const response = await axios.put('/api/users/0', { action: 'getAllUsers' });
            return response.data.data.map((user) => ({ ...user, name: `${user.firstName} ${user.lastName}` }));
        },
        { staleTime: 0 }
    );
    const currentUser = useSelector((state) => state.auth.user);
    const isSuperAdmin = hasAnyRole(currentUser, ['superadmin']);
    const queryClient = useQueryClient();

    if (isLoading) {
        return <Loader loading />;
    }

    const disableUser = async (userId) => {
        const confirm = await confirmation({
            message: (
                <div className="alert alert-danger">
                    You are about to disable player. The player won&apos;t get any emails. His player page is gonna be
                    marked as disabled.
                    <br />
                    Are you sure?
                </div>
            ),
        });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put(`/api/users/${userId}`, {
                action: 'disableUser',
            });
            await queryClient.invalidateQueries('getAllUsers');

            notification({
                header: 'Success',
                message: 'Player has been successfully disabled.',
            });
        });
    };

    const restoreUser = async (userId) => {
        const confirm = await confirmation({
            message: (
                <div>
                    You are about to restore the user.
                    <br />
                    Are you sure?
                </div>
            ),
        });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put(`/api/users/${userId}`, {
                action: 'restoreUser',
            });
            await queryClient.invalidateQueries('getAllUsers');

            notification({
                header: 'Success',
                message: 'Player has been successfully restored.',
            });
        });
    };

    const columns = [
        {
            name: 'actions',
            className: 'w-1px text-nowrap',
            render: (value, row) => (
                <>
                    <Modal
                        title={`${row.name} - Change password`}
                        backdrop="static"
                        renderTrigger={({ show }) => (
                            <button
                                type="button"
                                className="btn btn-secondary btn-xs btn-icon"
                                title="Change password"
                                data-change-password={row.id}
                                onClick={show}
                            >
                                <span className="svg-icon svg-icon-3">
                                    <LockIcon />
                                </span>
                            </button>
                        )}
                        renderBody={({ hide }) => (
                            <ChangePasswordForm
                                onSubmit={async (values) => {
                                    await axios.put(`/api/users/${row.id}`, {
                                        action: 'changeUserPassword',
                                        ...values,
                                    });
                                    notification({
                                        header: 'Success',
                                        message: 'Your password has been successfully changed.',
                                    });
                                    hide();
                                }}
                            />
                        )}
                    />
                    {isSuperAdmin && !row.deletedAt && (
                        <button
                            type="button"
                            className="btn btn-secondary btn-xs btn-icon ms-2"
                            title="Disable user"
                            data-disable={row.id}
                            onClick={() => disableUser(row.id)}
                        >
                            <span className="svg-icon svg-icon-3">
                                <CloseIcon />
                            </span>
                        </button>
                    )}
                    {isSuperAdmin && row.deletedAt && (
                        <button
                            type="button"
                            className="btn btn-secondary btn-xs btn-icon ms-2"
                            title="Restore user"
                            data-restore={row.id}
                            onClick={() => restoreUser(row.id)}
                        >
                            <span className="svg-icon svg-icon-3">
                                <UpdateIcon />
                            </span>
                        </button>
                    )}
                </>
            ),
        },
        {
            name: 'name',
            label: 'Name',
            render: (value, row) => (
                <>
                    <div>
                        <Link to={`/player/${row.slug}`}>{value}</Link>
                    </div>
                    <div>{row.email}</div>
                    <div className="d-flex text-nowrap">
                        <div>{formatPhone(row.phone)}</div>
                        {row.isPhoneVerified === 1 ? (
                            <div className="svg-icon svg-icon-3 svg-icon-success ms-1">
                                <CheckIcon />
                            </div>
                        ) : null}
                    </div>
                    {row.birthday ? <div>DOB: {row.birthday}</div> : null}
                </>
            ),
            isSort: true,
        },
        { name: 'totalLadders', label: 'Ladders', className: 'text-center', isSort: true },
        { name: 'totalReferrals', label: 'Referrals', className: 'text-center', isSort: true },
        {
            name: 'comeFrom',
            label: 'Origin',
            render: (value, row) => {
                if (!row.comeFrom) {
                    return '-';
                }

                const comeFromInfo = comeFromOptions.find((item) => item.value === row.comeFrom);
                if (!comeFromInfo) {
                    return '-';
                }

                return comeFromInfo.label + (row.comeFromOther ? ` (${row.comeFromOther})` : '');
            },
        },
        {
            name: 'createdAt',
            label: <span className="text-nowrap">Registered at</span>,
            render: (value) => formatDate(value),
            isSort: true,
        },
        {
            name: 'loggedAt',
            label: <span className="text-nowrap">Logged at</span>,
            render: (value) => (value ? formatDate(value) : '-'),
        },
    ];

    return (
        <Card>
            <Table
                className="table tl-table tl-table-spacious"
                columns={columns}
                data={users}
                getFilteredData={getFilteredData}
                orderBy="createdAt"
                orderByDir="DESC"
            />
        </Card>
    );
};

export default Players;
