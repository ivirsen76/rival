import { useQuery } from 'react-query';
import Loader from '@/components/Loader';
import Header from '@/components/Header';
import axios from '@/utils/axios';
import Stat from './Stat';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

const Badges = props => {
    const { data, isLoading } = useQuery(
        '/api/users/0',
        async () => {
            const response = await axios.put('/api/users/0', { action: 'getMyBadgesStats' });
            return response.data.data;
        },
        { staleTime: 0 }
    );

    if (isLoading) {
        return <Loader loading />;
    }

    return (
        <div>
            <h2 className="text-white mt-4">My Badges</h2>
            <Header title="My Badges" />
            <Stat data={data} isMyself isLight />
        </div>
    );
};

const Wrapper = props => {
    const currentUser = useSelector(state => state.auth.user);

    if (!currentUser) {
        return <Redirect to={{ pathname: '/login', search: '?redirectAfterLogin=/user/badges' }} />;
    }

    return <Badges {...props} />;
};

export default Wrapper;
