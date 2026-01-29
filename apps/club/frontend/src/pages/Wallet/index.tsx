import { useSelector } from 'react-redux';
import NotFound from '@/pages/NotFound';
import Wallet from '@/components/Wallet';
import Card from '@rival/common/components/Card';
import Header from '@/components/Header';

const Payments = (props) => {
    const currentUser = useSelector((state) => state.auth.user);

    if (!currentUser) {
        return <NotFound />;
    }

    return (
        <>
            <Header title="Wallet" />
            <h2 className="text-white mt-4">Wallet</h2>
            <Card>
                <Wallet userId={currentUser.id} />
            </Card>
        </>
    );
};

export default Payments;
