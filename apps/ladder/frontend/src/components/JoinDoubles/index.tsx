import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import notification from '@/components/notification';
import Card from '@rival/common/components/Card';
import Loader from '@rival/common/components/Loader';
import Error from '@rival/common/components/Error';
import axios from '@/utils/axios';
import Authentication from '@/components/Authentication';
import getRegisterNotificationProps from '@/utils/getRegisterNotificationProps';
import { useHistory } from 'react-router-dom';
import { loadCurrentUser } from '@/reducers/auth';

type JoinDoublesProps = {
    payload: string;
};

const JoinDoubles = (props: JoinDoublesProps) => {
    const [data, setData] = useState();
    const [error, setError] = useState();
    const currentUser = useSelector((state) => state.auth.user);
    const history = useHistory();
    const dispatch = useDispatch();

    useEffect(() => {
        (async () => {
            const response = await axios.put('/api/tournaments/0', {
                action: 'getDoublesInfo',
                payload: props.payload,
            });
            const { status, message } = response.data;

            if (status !== 'success') {
                setError(message);
            } else {
                setData(response.data);
            }
        })();
    }, []);

    useEffect(() => {
        if (!currentUser || !data || error) {
            return;
        }

        (async () => {
            try {
                await axios.put('/api/players/0', { action: 'joinDoublesTeam', payload: props.payload });
                await dispatch(loadCurrentUser());

                history.push(data.ladderUrl);

                notification({
                    inModal: true,
                    ...getRegisterNotificationProps({
                        message: "You've successfuly joined the Doubles.",
                        ladderUrl: data.ladderUrl,
                        season: data.season,
                    }),
                });
            } catch (errors) {
                setError(errors.link);
            }
        })();
    }, [currentUser?.id, data, error]);

    if (error) {
        return <Error message={error} />;
    }

    if (!data || currentUser) {
        return <Loader loading />;
    }

    const { partnerName, levelName } = data;

    return (
        <Card className="tl-panel">
            <div className="alert alert-success mb-8">
                <b>{partnerName}</b> invited you to join Doubles in <b>{levelName}</b>.
            </div>
            <div data-register-area>
                <Authentication />
            </div>
        </Card>
    );
};

export default JoinDoubles;
