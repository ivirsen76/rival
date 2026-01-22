import Card from '@/components/Card';
import { useQuery, useQueryClient } from 'react-query';
import axios from '@/utils/axios';
import Loader from '@/components/Loader';
import Modal from '@/components/Modal';
import notification from '@/components/notification';
import ManagerForm from './ManagerForm';
import CloseIcon from '@/styles/metronic/icons/duotone/Navigation/Close.svg?react';
import confirmation from '@/utils/confirmation';
import { Link } from 'react-router-dom';

type ManagersProps = {};

const Managers = (props: ManagersProps) => {
    const queryClient = useQueryClient();

    const { data: list, isLoading } = useQuery(`getManagerList`, async () => {
        const response = await axios.put('/api/users/0', { action: 'getManagers' });
        return response.data.data;
    });

    const removeManager = async (user) => {
        const confirm = await confirmation({
            message: (
                <div>
                    You are about to remove manager role from {user.firstName} {user.lastName}.<br />
                    Are you sure?
                </div>
            ),
        });
        if (!confirm) {
            return;
        }

        // don't wait. It's optimistic delete
        axios.put('/api/users/0', { action: 'revokeManagerRole', userId: user.id });
        queryClient.setQueryData(
            'getManagerList',
            list.filter((item) => item.id !== user.id)
        );
    };

    if (isLoading) {
        return <Loader loading />;
    }

    return (
        <Card>
            <p className="mb-4">Managers have the same controls as admins, but they cannot create other managers.</p>
            <Modal
                title="Add manager"
                renderTrigger={({ show }) => (
                    <button type="button" className="btn btn-primary" onClick={show}>
                        Add manager
                    </button>
                )}
                renderBody={({ hide }) => (
                    <ManagerForm
                        list={list}
                        onSubmit={async (values) => {
                            await axios.put('/api/users/0', { action: 'assignManagerRole', userId: values.user.id });
                            await queryClient.invalidateQueries('getManagerList');
                            hide();
                            notification({
                                header: 'Success',
                                message: `${values.user.firstName} ${values.user.lastName} got a manager role.`,
                            });
                        }}
                    />
                )}
            />

            {list.length > 0 && (
                <table className="table tl-table mt-8" style={{ maxWidth: '30rem' }} data-season-list>
                    <thead>
                        <tr>
                            <th>&nbsp;</th>
                            <th>Name</th>
                            <th className="w-100">Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((user) => (
                            <tr key={user.id}>
                                <td className="pe-0">
                                    <button
                                        type="button"
                                        className="btn btn-light-danger btn-icon btn-sm"
                                        onClick={() => removeManager(user)}
                                        data-remove-manager-role={user.id}
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
                                <td>{user.email}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </Card>
    );
};

export default Managers;
