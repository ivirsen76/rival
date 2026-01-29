import Table from '@rival/common/components/Table';
import { useQuery } from 'react-query';
import Loader from '@rival/common/components/Loader';
import Card from '@rival/common/components/Card';
import axios from '@/utils/axios';
import { Link } from 'react-router-dom';
import { formatDate } from '@/utils/dayjs';
import reasonOptions from '@rival/ladder.backend/src/services/complaints/reasonOptions';
import style from './style.module.scss';

const reasonOptionsMatch = reasonOptions.reduce((obj, item) => {
    obj[item.value] = item.label;
    return obj;
}, []);

const Complaints = () => {
    const { data: users, isLoading } = useQuery('getAllComplaints', async () => {
        const response = await axios.put('/api/complaints/0', { action: 'getAllComplaints' });

        const userCount = {};
        const opponentCount = {};

        return response.data.data.map((row) => {
            userCount[row.userId] = userCount[row.userId] ? userCount[row.userId] + 1 : 1;
            opponentCount[row.opponentId] = opponentCount[row.opponentId] ? opponentCount[row.opponentId] + 1 : 1;

            return {
                ...row,
                userFullName: `${row.userFirstName} ${row.userLastName}`,
                userCount: userCount[row.userId],
                opponentFullName: `${row.opponentFirstName} ${row.opponentLastName}`,
                opponentCount: opponentCount[row.opponentId],
            };
        });
    });

    if (isLoading) {
        return <Loader loading />;
    }

    const columns = [
        {
            name: 'createdAt',
            label: 'Date',
            render: (value) => formatDate(value),
            className: 'text-nowrap',
        },
        {
            name: 'userFullName',
            label: 'Complainer',
            render: (value, row) => (
                <div>
                    <Link to={`/player/${row.userSlug}`}>{value}</Link>
                    <div className="text-muted">#{row.userCount}</div>
                </div>
            ),
            className: style.minWidth,
            filter: true,
        },
        {
            name: 'opponentFullName',
            label: 'Accused',
            render: (value, row) => (
                <div>
                    <Link to={`/player/${row.opponentSlug}`}>{value}</Link>
                    <div className="text-muted">#{row.opponentCount}</div>
                </div>
            ),
            className: style.minWidth,
            filter: true,
        },
        {
            name: 'description',
            label: 'Complaint',
            render: (value, row) => (
                <div>
                    <div className="fw-bold mb-1">{reasonOptionsMatch[row.reason] || row.reason}</div>
                    {value}
                </div>
            ),
            className: 'w-100',
        },
    ];

    return (
        <Card>
            <Table
                className="table tl-table tl-table-spacious tl-table-top"
                columns={columns}
                data={users}
                orderBy="createdAt"
                orderByDir="DESC"
            />
        </Card>
    );
};

export default Complaints;
