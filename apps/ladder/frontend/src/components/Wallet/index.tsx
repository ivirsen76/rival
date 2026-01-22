import Loader from '@/components/Loader';
import axios from '@/utils/axios';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import Check from './Check';
import { useQuery } from 'react-query';
import { formatCustom } from '@/utils/dayjs';
import classnames from 'classnames';
import formatSum from '@/utils/formatSum';
import FileIcon from '@/styles/metronic/icons/duotone/Files/File.svg?react';
import WalletIcon from '@/styles/metronic/icons/duotone/Shopping/Wallet.svg?react';
import style from './style.module.scss';

type WalletProps = {
    userId?: number;
    isFullWidth?: boolean;
};

const Wallet = (props: WalletProps) => {
    const { userId, isFullWidth } = props;

    const { data: payments, isLoading } = useQuery(
        `getAllPayments${userId}`,
        async () => {
            const response = await axios.get(`/api/payments/${userId}`);
            return response.data.data;
        },
        { staleTime: 0 }
    );

    if (isLoading) {
        return <Loader loading />;
    }

    const currentBalance = payments.reduce((sum, item) => sum + item.amount, 0);

    const columns = [
        {
            name: 'createdAt',
            label: 'Date',
            className: 'text-nowrap',
            render: (value) => formatCustom(value, 'MMM D, YYYY'),
        },
        { name: 'description', label: 'Description', className: isFullWidth ? 'w-100' : '' },
        {
            name: 'amount',
            label: 'Amount',
            render: (value) => {
                return <span className={classnames({ [style.credit]: value > 0 })}>{formatSum(value)}</span>;
            },
            className: 'text-end fw-bold text-nowrap',
        },
        {
            name: 'check',
            className: 'p-0',
            render: (value, row) => {
                if (!row.orderId) {
                    return null;
                }

                return (
                    <Modal
                        title="Order summary"
                        hasForm={false}
                        renderTrigger={({ show }) => (
                            <a
                                href=""
                                onClick={(e) => {
                                    e.preventDefault();
                                    show();
                                }}
                                data-order-summary={row.orderId}
                            >
                                <span className="svg-icon svg-icon-1">
                                    <FileIcon />
                                </span>
                            </a>
                        )}
                        renderBody={({ hide }) => (
                            <div>
                                <Check
                                    payload={row.orderPayload}
                                    sessionId={row.orderSessionId}
                                    processedAt={row.createdAt}
                                    amount={row.amount}
                                />
                            </div>
                        )}
                    />
                );
            },
        },
    ];

    return (
        <div>
            <div className="mb-8">
                <span className="svg-icon svg-icon-1 svg-icon-gray-800 me-2">
                    <WalletIcon />
                </span>
                Current balance: <span className="fw-bold">{formatSum(currentBalance)}</span>
            </div>
            {payments.length === 0 ? (
                <div>No transactions yet</div>
            ) : (
                <Table className="table tl-table w-auto" columns={columns} data={payments} showRowNumber={false} />
            )}
        </div>
    );
};

export default Wallet;
