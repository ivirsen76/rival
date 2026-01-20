import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import PartnerReferral from './PartnerReferral';
import PlayerReferral from './PlayerReferral';

const Referral = (props) => {
    const currentUser = useSelector((state) => state.auth.user);

    if (!currentUser) {
        return <Redirect to={{ pathname: '/login', search: '?redirectAfterLogin=/user/referral' }} />;
    }

    const content = currentUser.refPercent ? <PartnerReferral /> : <PlayerReferral />;

    return (
        <div>
            <h2 className="text-white mt-4">Referral program</h2>
            {content}
        </div>
    );
};

export default Referral;
