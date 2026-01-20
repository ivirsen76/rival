import { useEffect } from 'react';
import PropTypes from 'prop-types';

const Referral = props => {
    const { history } = props;
    const { code } = props.match.params;

    useEffect(() => {
        // Do nothing if it's not the real user
        if (/twitter/i.test(window.navigator.userAgent) || /facebook/i.test(window.navigator.userAgent)) {
            return;
        }

        if (/^[a-z0-9]{5}$/.test(code)) {
            localStorage.setItem('referralCode', code);
        }

        history.push('/');
    }, []);

    return null;
};

Referral.propTypes = {
    history: PropTypes.object,
    match: PropTypes.object,
};

export default Referral;
