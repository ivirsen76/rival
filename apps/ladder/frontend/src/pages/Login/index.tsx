import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { logout } from '@/reducers/auth';
import Card from '@rival/packages/components/Card';
import Login from '@/components/Authentication/Login';

const LoginPage = (props) => {
    const [redirectAfterLogin, setRedirectAfterLogin] = useState(null);
    const dispatch = useDispatch();
    const history = useHistory();

    useEffect(() => {
        dispatch(logout());
    }, []);

    useEffect(() => {
        const url = new URL(window.location.href);
        const param = url.searchParams.get('redirectAfterLogin');
        if (param) {
            setRedirectAfterLogin(param);
            history.push('/login');
        }
    }, []);

    const onSubmit = (user) => {
        history.push(redirectAfterLogin || user.redirectAfterLogin || '/');
    };

    return (
        <Card className="tl-panel">
            <Login onSubmit={onSubmit} />
        </Card>
    );
};

export default LoginPage;
