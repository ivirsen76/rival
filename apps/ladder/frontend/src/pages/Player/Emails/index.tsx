import PropTypes from 'prop-types';
import Loader from '@/components/Loader';
import Table from '@/components/Table';
import axios from '@/utils/axios';
import { useQuery } from 'react-query';
import { formatCustom } from '@/utils/dayjs';
import style from './style.module.scss';

const Emails = props => {
    const { user } = props;

    const { data: emails, isLoading } = useQuery(`/api/users/emails/${user.id}`, async () => {
        const response = await axios.put(`/api/users/${user.id}`, { action: 'getRecentEmails', email: user.email });
        return response.data.data;
    });

    if (isLoading) {
        return <Loader loading />;
    }

    const columns = [
        {
            name: 'createdAt',
            label: 'Date',
            render: value => formatCustom(value, 'MMM\xa0D, YYYY, h:mm A'),
            className: `${style.table} text-nowrap align-top`,
        },
        {
            name: 'html',
            label: 'Content',
            render: (value, row) => {
                return (
                    <div>
                        <div className="fw-bold mb-2">{row.subject}</div>
                        <div className={style.content} dangerouslySetInnerHTML={{ __html: row.html }} />
                    </div>
                );
            },
            className: style.table,
        },
    ];

    return <Table className="table tl-table" columns={columns} data={emails} showRowNumber={false} perPage={10} />;
};

Emails.propTypes = {
    user: PropTypes.object,
};

Emails.defaultProps = {};

export default Emails;
