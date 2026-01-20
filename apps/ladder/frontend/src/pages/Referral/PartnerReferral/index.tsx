import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import Card from '@/components/Card';
import Copy from '@/components/Copy';
import { useQuery } from 'react-query';
import Loader from '@/components/Loader';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import PlayerName from '@/components/PlayerName';
import { formatDate } from '@/utils/dayjs';
import Wallet from '@/components/Wallet';
import WalletIcon from '@rival/packages/metronic/icons/duotone/Shopping/Wallet.svg?react';
import formatSum from '@/utils/formatSum';
import axios from '@/utils/axios';
import useConfig from '@/utils/useConfig';
import style from './style.module.scss';

const PartnerReferral = props => {
    const { showShareLinkInstruction } = props;
    const currentUser = useSelector(state => state.auth.user);
    const config = useConfig();

    const { data, isLoading } = useQuery('getPartnerReferrals', async () => {
        const response = await axios.put('/api/users/0', { action: 'getPartnerReferrals' });
        return response.data.data;
    });

    if (!currentUser.refPercent) {
        return null;
    }

    if (isLoading) {
        return <Loader loading />;
    }

    const { referrals, payouts } = data;

    const referralLink = `${window.location.origin}/ref/${currentUser.referralCode}`;
    const earningsTotal = referrals.reduce((sum, item) => sum + (item.payments * currentUser.refPercent) / 100, 0);
    const payoutsTotal = payouts.reduce((sum, item) => sum + item.amount, 0);
    const balance = earningsTotal - payoutsTotal;

    const columns = [
        {
            name: 'name',
            label: 'Name',
            className: 'fw-semibold',
            render: (value, row) => <PlayerName player1={row} isLink />,
        },
        {
            name: 'createdAt',
            label: 'Registered',
            render: value => (
                <span data-playwright-placeholder="middle">{formatDate(value, 'MMM\xa0D, YYYY, h:mm A')}</span>
            ),
        },
        {
            name: 'payments',
            label: 'Payments',
            className: 'text-center',
            render: (value, row) => {
                return (
                    <div>
                        {formatSum(value)}
                        <Modal
                            title={
                                <div>
                                    {row.firstName} {row.lastName}&apos;s Wallet
                                </div>
                            }
                            size="lg"
                            renderTrigger={({ show }) => (
                                <a
                                    href=""
                                    onClick={e => {
                                        e.preventDefault();
                                        show();
                                    }}
                                    data-wallet-id={row.id}
                                >
                                    <span className="svg-icon svg-icon-3 text-primary ms-2">
                                        <WalletIcon />
                                    </span>
                                </a>
                            )}
                            renderBody={() => <Wallet userId={row.id} isFullWidth />}
                        />
                    </div>
                );
            },
        },
        {
            name: 'earnings',
            label: 'Earnings',
            className: 'text-center',
            render: (value, row) => {
                return formatSum((row.payments * currentUser.refPercent) / 100);
            },
        },
    ];

    const paymentColumns = [
        {
            name: 'createdAt',
            label: 'Date',
            className: 'text-nowrap',
            render: value => (
                <span data-playwright-placeholder="middle">{formatDate(value, 'MMM\xa0D, YYYY, h:mm A')}</span>
            ),
        },
        {
            name: 'description',
            label: 'Description',
        },
        {
            name: 'amount',
            label: 'Sum',
            className: 'text-end',
            render: (value, row) => {
                return formatSum(row.amount);
            },
        },
    ];

    return (
        <Card>
            <div className={style.wrapper}>
                <div className={style.benefits}>
                    <h3>Your Benefits</h3>
                    <p>
                        You will receive <b>{currentUser.refPercent}%</b> of all payments for{' '}
                        <b>{currentUser.refYears} years</b> since registration for every player following your referral
                        link.
                    </p>

                    <h3>Your Referral Link</h3>
                    <div>Share your referral link to anyone interested in playing:</div>

                    <div>
                        <Copy
                            label={
                                <a href={referralLink} className="fw-semibold" data-playwright-placeholder="long">
                                    {referralLink}
                                </a>
                            }
                            stringToCopy={referralLink}
                        />
                    </div>

                    {showShareLinkInstruction && (
                        <>
                            <h3>How to Share Your Link</h3>
                            <p>Share it in your tennis group chat, social media, or just text a friend:</p>

                            <div className="alert alert-primary">
                                <p>
                                    Hey! I just joined this new tennis ladder in {config.city}. It&apos;s a great way to
                                    play more matches and meet more players based on your schedule. Sign up today using
                                    this link:
                                </p>
                                <div>{referralLink}</div>
                            </div>
                        </>
                    )}

                    <h3>Summary</h3>
                    <div className="d-flex">
                        <div>
                            <div className="d-flex gap-8 justify-content-between">
                                <div>Referrals:</div>
                                <b>{referrals.length}</b>
                            </div>
                            <div className="d-flex gap-8 justify-content-between">
                                <div>Earnings:</div>
                                <b>{formatSum(earningsTotal)}</b>
                            </div>
                            <div className="d-flex gap-8 justify-content-between">
                                <div>Payouts:</div>
                                <b>{formatSum(payoutsTotal)}</b>
                            </div>
                            <div className={'d-flex gap-8 justify-content-between ' + style.balance}>
                                <div>Balance:</div>
                                <b>{formatSum(balance)}</b>
                            </div>
                        </div>
                    </div>

                    <h3>Payouts</h3>
                    <Table
                        className="table tl-table tl-table-top"
                        columns={paymentColumns}
                        data={payouts}
                        noDataMessage="There are no payouts yet"
                        perPage={25}
                        showTopPaginator={false}
                    />
                </div>
                <div className={style.tableBar}>
                    <h3>Your Referrals</h3>
                    <Table
                        className="table tl-table"
                        columns={columns}
                        data={referrals}
                        noDataMessage="There are no players yet"
                        perPage={25}
                        showTopPaginator={false}
                    />
                </div>
            </div>
        </Card>
    );
};

PartnerReferral.propTypes = {
    showShareLinkInstruction: PropTypes.bool,
};

PartnerReferral.defaultProps = {
    showShareLinkInstruction: true,
};

export default PartnerReferral;
