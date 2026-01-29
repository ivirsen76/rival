import { StatsigClient } from '@statsig/js-client';
import Cookies from 'js-cookie';

const guestId = Cookies.get('statsigUserId');
const statsigClientKey = import.meta.env.VITE_STATSIG_CLIENT_KEY;
let client;
if (guestId && /^[a-zA-Z0-9]{32}$/.test(guestId) && statsigClientKey) {
    const user = { userID: guestId };
    client = new StatsigClient(statsigClientKey, user, {
        environment: { tier: import.meta.env.VITE_STATSIG_ENV || 'production' },
    });
    client.initializeAsync();
}

const useStatsigEvents = () => {
    const onRegister = () => client && client.logEvent('player_registered');
    const onJoiningLadder = () => client && client.logEvent('player_joined_ladder');

    return { onRegister, onJoiningLadder };
};

export default useStatsigEvents;
