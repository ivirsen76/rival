import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { useSelector } from 'react-redux';

const Authentication = () => {
    const currentUser = useSelector((state) => state.auth.user);
    const [tab, setTab] = useState('register');

    if (currentUser) {
        return null;
    }

    if (tab === 'register') {
        return <Register goToLogin={() => setTab('login')} />;
    }

    return <Login goToRegister={() => setTab('register')} />;
};

export default Authentication;
