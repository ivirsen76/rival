import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addHistoryEventAndSave } from '@/reducers/auth';
import { useLocation } from 'react-router-dom';

const RouteChecker = (props) => {
    const currentUser = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();
    const location = useLocation();

    useEffect(() => {
        if (currentUser) {
            return;
        }

        dispatch(addHistoryEventAndSave({ type: 'route', value: location.pathname }));
    }, [currentUser, location]);

    return null;
};

export default RouteChecker;
