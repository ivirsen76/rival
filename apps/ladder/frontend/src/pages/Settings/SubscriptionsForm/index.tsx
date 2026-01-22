import { useSelector, useDispatch } from 'react-redux';
import { updateCurrentUser } from '@/reducers/auth';
import Form from './Form';
import _pick from 'lodash/pick';

type SubscriptionsFormProps = {
    onSubmit?: (...args: unknown[]) => unknown;
};

const SubscriptionsForm = (props: SubscriptionsFormProps) => {
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();

    const onSubmit = async (values) => {
        await dispatch(updateCurrentUser(values));
        props.onSubmit && props.onSubmit();
    };

    const initialValues = _pick(user, [
        'subscribeForProposals',
        'subscribeForReminders',
        'subscribeForNews',
        'subscribeForBadges',
        'information',
    ]);

    return <Form initialValues={initialValues} onSubmit={onSubmit} />;
};

export default SubscriptionsForm;
