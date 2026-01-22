import Loader from '@/components/Loader';
import Table from '@/components/Table';
import axios from '@/utils/axios';
import formatDuration from '@/utils/formatDuration';
import { useQuery } from 'react-query';
import dayjs, { formatCustom } from '@/utils/dayjs';

type TrackingProps = {
    user?: object;
};

const Tracking = (props: TrackingProps) => {
    const { user } = props;

    const { data: list, isLoading } = useQuery(`/api/users/tracking/${user.id}`, async () => {
        const response = await axios.put(`/api/users/${user.id}`, { action: 'getRegisterHistory' });

        return response.data.data.map((item, index, arr) => ({
            ...item,
            duration: index === arr.length - 1 ? -1 : dayjs(arr[index + 1].time).diff(dayjs(item.time), 'second'),
        }));
    });

    if (isLoading) {
        return <Loader loading />;
    }

    const columns = [
        {
            name: 'duration',
            label: 'Duration',
            render: (value, row) =>
                value >= 0 ? formatDuration(value) : formatCustom(row.date, 'MMM\xa0D, YYYY, h:mm A'),
            className: 'text-nowrap',
        },
        {
            name: 'type',
            label: 'Type',
        },
        {
            name: 'value',
            label: 'Value',
        },
    ];

    return <Table className="table tl-table" columns={columns} data={list} perPage={50} />;
};

export default Tracking;
