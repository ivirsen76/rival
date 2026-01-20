import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import axios from '@/utils/axios';

export default () => {
    const currentUser = useSelector((state) => state.auth.user);

    const { data: result } = useQuery(
        'getVisibleStats',
        async () => {
            const response = await axios.put('/api/proposals/0', { action: 'getVisibleStats' });
            return response.data;
        },
        {
            enabled: Boolean(currentUser),
            staleTime: 0,
        }
    );

    return result;
};
