import Card from '@/components/Card';
import { useQuery, useQueryClient } from 'react-query';
import axios from '@/utils/axios';
import Loader from '@/components/Loader';
import Modal from '@/components/Modal';
import notification from '@/components/notification';
import BanForm from './BanForm';
import CloseIcon from '@/styles/metronic/icons/duotone/Navigation/Close.svg?react';
import confirmation from '@/utils/confirmation';
import { formatDate } from '@/utils/dayjs';
import { Link } from 'react-router-dom';
import showLoader from '@/utils/showLoader';

const Ban = (props) => {
    const queryClient = useQueryClient();

    const { data: list, isLoading } = useQuery(`getBanUsers`, async () => {
        const response = await axios.put('/api/users/0', { action: 'getBanUsers' });
        return response.data.data;
    });

    const removeBan = async (user) => {
        const confirm = await confirmation({
            message: (
                <div>
                    You are about to remove ban from {user.firstName} {user.lastName}.<br />
                    Are you sure?
                </div>
            ),
        });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put(`/api/users/${user.id}`, { action: 'removeBan' });
            await queryClient.invalidateQueries(`getBanUsers`);
        });
    };

    if (isLoading) {
        return <Loader loading />;
    }

    return (
        <Card>
            <Modal
                title="Ban user"
                renderTrigger={({ show }) => (
                    <button type="button" className="btn btn-primary" onClick={show}>
                        Ban user
                    </button>
                )}
                renderBody={({ hide }) => (
                    <BanForm
                        list={list}
                        onSubmit={async (values) => {
                            await axios.put('/api/users/0', {
                                action: 'addBan',
                                userId: values.user && values.user.id,
                                reason: values.reason,
                                duration: values.duration,
                            });
                            await queryClient.invalidateQueries('getBanUsers');
                            hide();
                            notification({
                                header: 'Success',
                                message: `${values.user.firstName} ${values.user.lastName} was successfully banned.`,
                            });
                        }}
                    />
                )}
            />

            {list.length > 0 ? (
                <table className="table tl-table w-auto mt-8" data-ban-user-list>
                    <thead>
                        <tr>
                            <th>&nbsp;</th>
                            <th>Name</th>
                            <th>Reason</th>
                            <th>Ban end date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((user) => (
                            <tr key={user.id}>
                                <td className="pe-0">
                                    <button
                                        type="button"
                                        className="btn btn-light-danger btn-icon btn-sm"
                                        onClick={() => removeBan(user)}
                                        data-remove-ban={user.id}
                                    >
                                        <span className="svg-icon svg-icon-2">
                                            <CloseIcon />
                                        </span>
                                    </button>
                                </td>
                                <td className="fw-semibold text-nowrap">
                                    <Link to={`/player/${user.slug}`}>
                                        {user.firstName} {user.lastName}
                                    </Link>
                                </td>
                                <td>{user.banReason}</td>
                                <td>{user.banDate.startsWith('2099') ? 'Forever' : formatDate(user.banDate)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="mt-4">No users with ban found</div>
            )}
        </Card>
    );
};

export default Ban;
