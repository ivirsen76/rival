import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '@/reducers/auth';

const Logout = (props) => {
    const history = useHistory();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(logout());
        history.push('/');
    }, []);

    return null;
};

export default Logout;
