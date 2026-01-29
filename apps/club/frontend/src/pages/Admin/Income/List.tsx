import { useQuery } from 'react-query';
import axios from '@/utils/axios';
import Loader from '@rival/common/components/Loader';
import Table from '@rival/common/components/Table';
import PlayerName from '@/components/PlayerName';
import formatSum from '@rival/common/utils/formatSum';
import { formatLong } from '@/utils/dayjs';

type ListProps = {
    seasonId: number;
};

const List = (props: ListProps) => {
    const { seasonId } = props;

    const { data: payments, isLoading } = useQuery(`getSeasonPayments-${seasonId}`, async () => {
        const response = await axios.put(`/api/seasons/${seasonId}`, { action: 'getSeasonPayments' });
        return response.data.data;
    });

    if (isLoading) {
        return <Loader loading />;
    }

    const columns = [
        {
            name: 'player',
            label: 'Player',
            render: (value, row) => <PlayerName player1={row} isLink />,
        },
        {
            name: 'createdAt',
            label: 'Date',
            render: (value) => formatLong(value),
        },
        {
            name: 'amount',
            label: 'Sum',
            className: 'text-end',
            render: (value) => {
                return formatSum(value);
            },
        },
        {
            name: 'fee',
            label: 'Fee',
            className: 'text-end',
            render: (value) => {
                return formatSum(value);
            },
        },
    ];

    const totalSum = payments.reduce((sum, item) => sum + item.amount, 0);
    const totalFees = payments.reduce((sum, item) => sum + item.fee, 0);

    return (
        <div>
            <div className="mb-6">
                Total sum: <b>{formatSum(totalSum)}</b>
                <br />
                Total fees: <b>{formatSum(totalFees)}</b>
            </div>
            <Table className="table tl-table" columns={columns} data={payments} perPage={25} showTopPaginator={false} />
        </div>
    );
};

export default List;
