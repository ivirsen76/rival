/* eslint-disable react/no-array-index-key */
import { useState, useEffect } from 'react';
import Loader from '@/components/Loader';
import axios from '@/utils/axios';
import formatSum from '@/utils/formatSum';
import classnames from 'classnames';
import { Formik, Form } from '@/components/formik';
import Button from '@/components/Button';
import notification from '@/components/notification';
import WalletIcon from '@/styles/metronic/icons/duotone/Shopping/Wallet.svg?react';
import { loadCurrentUser } from '@/reducers/auth';
import { useDispatch } from 'react-redux';
import getRegisterNotificationProps from '@/utils/getRegisterNotificationProps';
import { useHistory } from 'react-router-dom';
import style from './style.module.scss';

type PaymentProps = {
    fullSettings?: object;
};

const Payment = (props: PaymentProps) => {
    const { fullSettings } = props;
    const [order, setOrder] = useState(null);
    const dispatch = useDispatch();
    const history = useHistory();

    useEffect(() => {
        (async () => {
            const result = await axios.post('/api/orders', {
                preview: true,
                seasonId: fullSettings.season.id,
                tournaments: fullSettings.tournaments.list,
                joinReason: fullSettings.tournaments.joinReason,
                joinForFree: fullSettings.tournaments.joinForFree,
                partners: fullSettings.tournaments.partners,
            });
            setOrder(result.data);
        })();
    }, []);

    if (!order) {
        return <Loader loading />;
    }

    return (
        <Formik
            initialValues={{}}
            onSubmit={async (values) => {
                const { data } = await axios.post('/api/orders', {
                    seasonId: fullSettings.season.id,
                    tournaments: fullSettings.tournaments.list,
                    joinReason: fullSettings.tournaments.joinReason,
                    joinForFree: fullSettings.tournaments.joinForFree,
                    partners: fullSettings.tournaments.partners,
                });
                await dispatch(loadCurrentUser());
                if (data.processed) {
                    notification({
                        inModal: true,
                        ...getRegisterNotificationProps({
                            message: 'Order processed successfully!',
                            buttonTitle: data.title,
                            ladderUrl: data.url,
                            season: data.season,
                        }),
                    });
                    history.push(data.url);
                } else {
                    window.location.href = data.paymentUrl;
                }
            }}
        >
            {({ isSubmitting }) => (
                <Form noValidate>
                    <div className="mt-8">
                        <span className="svg-icon svg-icon-1 svg-icon-gray-800 me-2">
                            <WalletIcon />
                        </span>
                        <a href="/user/wallet" target="_blank" rel="noreferrer">
                            Current balance
                        </a>
                        :<span className="fw-bold ms-2">{formatSum(order.prevBalance)}</span>
                    </div>
                    <h3>Order summary</h3>
                    <div className={style.order}>
                        {order.payload.transactions.map((item, index) => (
                            <div key={index} className={style.row}>
                                <div>{item.description}:</div>
                                <div className={classnames('text-end', { [style.positive]: item.cost > 0 })}>
                                    {formatSum(-item.cost)}
                                </div>
                            </div>
                        ))}
                        <div className={style.row + ' ' + style.total}>
                            <div>Total due:</div>
                            <div className="text-end" data-total-sum>
                                {formatSum(order.total)}
                            </div>
                        </div>
                    </div>
                    <div className={'mt-8 ' + style.buttonArea}>
                        <Button className="btn btn-primary w-100" isSubmitting={isSubmitting}>
                            {order.total === 0 ? 'Confirm order' : 'Confirm order and make a payment'}
                        </Button>
                    </div>
                    {order.total > 0 && (
                        <div className={classnames('text-muted text-center mt-4', style.disclaimer)}>
                            Once you click this button, you will be redirected to{' '}
                            <a href="https://stripe.com" target="_blank" rel="noreferrer">
                                Stripe
                            </a>{' '}
                            for payment. We do not gather any user payment information. Stripe is a secure payment
                            processor for ladder players.
                        </div>
                    )}
                </Form>
            )}
        </Formik>
    );
};

export default Payment;
