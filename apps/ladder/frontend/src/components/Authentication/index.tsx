import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { useSelector, useDispatch } from 'react-redux';
import axios from '@/utils/axios';
import notification from '@/components/notification';
import VerifyEmail from '@/components/VerifyEmail';
import EmailIcon from '@rival/packages/metronic/icons/duotone/Communication/Mail-at.svg?react';
import { authenticate } from '@/reducers/auth';

const Authentication = props => {
    const currentUser = useSelector(state => state.auth.user);
    const [tab, setTab] = useState('register');
    const dispatch = useDispatch();

    if (currentUser) {
        return null;
    }

    if (tab === 'register') {
        return (
            <Register
                goToLogin={() => setTab('login')}
                showComeFrom={false}
                onSubmit={async values => {
                    await axios.post('/api/users', values);

                    notification({
                        inModal: true,
                        render: ({ hide }) => (
                            <>
                                <span className="svg-icon svg-icon-primary svg-icon-5x">
                                    <EmailIcon />
                                </span>
                                <div className="mt-6">
                                    <VerifyEmail
                                        email={values.email}
                                        password={values.password}
                                        onSuccess={async () => {
                                            hide();
                                            await dispatch(authenticate(values.email, values.password));
                                        }}
                                    />
                                </div>
                            </>
                        ),
                    });
                }}
            />
        );
    }

    return <Login goToRegister={() => setTab('register')} />;
};

Authentication.propTypes = {};

Authentication.defaultProps = {};

export default Authentication;
