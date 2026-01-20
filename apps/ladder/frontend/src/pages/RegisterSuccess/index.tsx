import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Loader from '@/components/Loader';
import notification from '@/components/notification';
import axios from '@/utils/axios';
import { useDispatch } from 'react-redux';
import { loadCurrentUser } from '@/reducers/auth';
import getRegisterNotificationProps from '@/utils/getRegisterNotificationProps';
import { useHistory } from 'react-router-dom';

const RegisterSuccess = props => {
    const { sessionId } = props.match.params;
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();
    const history = useHistory();

    useEffect(() => {
        (async () => {
            const result = await axios.put('/api/orders/0', { action: 'processStripeSession', sessionId });
            await dispatch(loadCurrentUser());
            setLoading(false);

            const { url, title, season } = result.data;

            history.push(url);

            notification({
                inModal: true,
                ...getRegisterNotificationProps({
                    message: 'Payment successful!',
                    buttonTitle: title,
                    ladderUrl: url,
                    season,
                }),
            });
        })();
    }, []);

    return <Loader loading={loading} />;
};

RegisterSuccess.propTypes = {
    match: PropTypes.object,
};

RegisterSuccess.defaultProps = {};

export default RegisterSuccess;
