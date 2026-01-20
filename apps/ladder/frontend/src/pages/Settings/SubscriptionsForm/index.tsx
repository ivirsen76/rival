import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { updateCurrentUser } from '@/reducers/auth';
import Form from './Form';
import _pick from 'lodash/pick';

const SubscriptionsForm = (props) => {
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

SubscriptionsForm.propTypes = {
    onSubmit: PropTypes.func,
};

export default SubscriptionsForm;
