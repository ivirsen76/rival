import axios from '@rival/common/axios';
import Cookies from 'js-cookie';

export default async () => {
    const PAW_KEY = 'paw';
    const PAW_TTL_DAYS = 365;

    function generatePaw(length = 64) {
        const bytes = new Uint8Array(length / 2);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }

    function getOrCreatePaw() {
        let paw = localStorage.getItem(PAW_KEY);
        if (!paw) {
            paw = Cookies.get(PAW_KEY);
        }
        if (!paw || !/^[a-f0-9]{64}$/.test(paw)) {
            paw = generatePaw();
        }

        // persist + prolong expiration (sliding TTL)
        localStorage.setItem(PAW_KEY, paw);
        Cookies.set(PAW_KEY, paw, { expires: PAW_TTL_DAYS, sameSite: 'Lax', secure: true });

        return paw;
    }

    const code = getOrCreatePaw();

    await axios.put('/api/users/0', { action: 'saveIdentification', code });
};
