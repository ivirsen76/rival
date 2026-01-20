import NotFound from '@/pages/NotFound';
import { useSelector } from 'react-redux';
import hasAnyRole from '@/utils/hasAnyRole';
import PartnerReferral from '../Referral/PartnerReferral';

const Partner = (props) => {
    const currentUser = useSelector((state) => state.auth.user);

    if (!hasAnyRole(currentUser, ['partner'])) {
        return <NotFound />;
    }

    return (
        <div>
            <h2 className="text-white mt-4">Partner</h2>
            <PartnerReferral showShareLinkInstruction={false} />
        </div>
    );
};

export default Partner;
