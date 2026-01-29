import Card from '@rival/common/components/Card';
import TermsAndConditions from '@/components/TermsAndConditions';
import ScrollToTop from '@rival/common/components/ScrollToTop';

const Terms = (props) => {
    return (
        <div className="tl-front">
            <h2 className="text-white mt-4">Terms & Conditions</h2>
            <ScrollToTop />
            <Card>
                <TermsAndConditions />
            </Card>
        </div>
    );
};

export default Terms;
