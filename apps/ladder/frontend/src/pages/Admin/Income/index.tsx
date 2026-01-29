import Card from '@/components/Card';
import Modal from '@/components/Modal';
import { useQuery } from 'react-query';
import axios from '@/utils/axios';
import Loader from '@/components/Loader';
import Table from '@/components/Table';
import List from './List';
import formatSum from '@/utils/formatSum';
import WalletIcon from '@rival/packages/metronic/icons/duotone/Shopping/Wallet.svg?react';

const Income = (props) => {
    const { data: incomes, isLoading } = useQuery('getSeasonIncomes', async () => {
        const response = await axios.put('/api/seasons/0', { action: 'getSeasonIncomes' });
        return response.data.data;
    });

    if (isLoading) {
        return <Loader loading />;
    }

    const columns = [
        {
            name: 'name',
            label: 'Season',
            className: 'text-nowrap',
        },
        {
            name: 'payments',
            label: 'Payments',
            className: 'text-end',
            render: (value, row) => {
                return formatSum(value);
            },
        },
        {
            name: 'fees',
            label: 'Fees',
            className: 'text-end',
            render: (value, row) => {
                return formatSum(value);
            },
        },
        {
            name: 'income',
            label: 'Income',
            className: 'text-end fw-bold',
            render: (value, row) => {
                return formatSum(Math.round((row.payments - row.fees) * 0.7));
            },
        },
        {
            name: 'list',
            render: (value, row) => {
                return (
                    <Modal
                        title={<div>{row.name}</div>}
                        size="lg"
                        renderTrigger={({ show }) => (
                            <a
                                href=""
                                onClick={(e) => {
                                    e.preventDefault();
                                    show();
                                }}
                            >
                                <span className="svg-icon svg-icon-3 text-primary ms-2">
                                    <WalletIcon />
                                </span>
                            </a>
                        )}
                        renderBody={() => <List seasonId={row.id} />}
                    />
                );
            },
        },
    ];

    return (
        <Card>
            <div className="mb-4">Income = (Payments - Fees) * 70%</div>
            <Table className="table tl-table w-auto" columns={columns} data={incomes} perPage={25} />
        </Card>
    );
};

export default Income;
