import axios from '@/utils/axios';
import { useQuery } from 'react-query';

export default () => {
    const { data: settings, isLoading: isSettingsLoading } = useQuery(
        'globalSettings',
        async () => {
            const decode = (str) => JSON.parse(atob(str.split('').reverse().join('')));

            const response = await axios.post('/api/settings', {});
            return {
                ...response.data,
                config: decode(response.data.config),
            };
        },
        { staleTime: 60 * 60 * 1000 } // 1 hour
    );

    return { settings, isSettingsLoading };
};
