import { useState, useEffect } from 'react';
import Loader from '@rival/common/components/Loader';
import notification from '@/components/notification';
import axios from '@/utils/axios';
import { useDispatch } from 'react-redux';
import { loadCurrentUser } from '@/reducers/auth';
import getRegisterNotificationProps from '@/utils/getRegisterNotificationProps';
import { useHistory } from 'react-router-dom';

type RegisterSuccessProps = {
    match: object;
};

const RegisterSuccess = (props: RegisterSuccessProps) => {
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

export default RegisterSuccess;
