import Card from '@/components/Card';
import _omit from 'lodash/omit';
import { useQuery } from 'react-query';
import Loader from '@/components/Loader';
import notification from '@/components/notification';
import axios from '@/utils/axios';
import Form from '@/pages/Settings/SubscriptionsForm/Form';

type UnsubscribeProps = {
    payload?: string;
};

const Unsubscribe = (props: UnsubscribeProps) => {
    const { data, isLoading } = useQuery('getUserSubscriptions', async () => {
        const response = await axios.put('/api/users/0', { action: 'getUserSubscriptions', payload: props.payload });
        return response.data.data;
    });

    if (isLoading || !data) {
        return <Loader loading />;
    }

    const initialValues = {
        ..._omit(data, 'email'),
        payload: props.payload,
    };

    const onSubmit = async (values) => {
        await axios.put('/api/users/0', { action: 'updateUserSubscriptions', ...values });

        notification({
            inModal: true,
            message: 'You subscriptions successfully updated.',
        });
    };

    return (
        <Card>
            <h3 className="mb-8">
                My subscriptions <span className="text-muted">({data.email})</span>
            </h3>
            <div style={{ maxWidth: '30rem' }}>
                <Form initialValues={initialValues} buttonTitle="Update" onSubmit={onSubmit} />
            </div>
        </Card>
    );
};

export default Unsubscribe;
