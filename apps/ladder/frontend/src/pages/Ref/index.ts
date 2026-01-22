import { useEffect } from 'react';

type ReferralProps = {
    history?: object;
    match?: object;
};

const Referral = (props: ReferralProps) => {
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

export default Referral;
