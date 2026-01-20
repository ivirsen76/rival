/* eslint-disable react/no-array-index-key */

import PropTypes from 'prop-types';
import style from './style.module.scss';
import formatSum from '@/utils/formatSum';
import { formatCustom } from '@/utils/dayjs';

const Check = props => {
    const { payload, sessionId, amount, processedAt } = props;
    const orderId = sessionId.slice(10, 30);
    const { transactions } = payload;

    return (
        <div>
            <div className="alert alert-primary">
                <div>
                    <b>Paid on:</b> {formatCustom(processedAt, 'MMM\xa0D, YYYY, h:mm A')}
                </div>
                <div>
                    <b>Order ID:</b> {orderId}
                </div>
            </div>

            <div className={style.order}>
                {transactions.map((item, index) => (
                    <div key={index} className={style.row}>
                        <div>{item.description}:</div>
                        <div className="text-end">{formatSum(-item.cost)}</div>
                    </div>
                ))}
                <div className={style.row + ' ' + style.total}>
                    <div>Total:</div>
                    <div className="text-end" data-total-sum>
                        {formatSum(amount)}
                    </div>
                </div>
            </div>
        </div>
    );
};

Check.propTypes = {
    payload: PropTypes.object,
    sessionId: PropTypes.string,
    amount: PropTypes.number,
    processedAt: PropTypes.string,
};

export default Check;
