import { useState, useEffect } from 'react';

const STORAGE_KEY = 'rival_ui';

function useUserInterface(subKey, defaultValue) {
    const [value, setValue] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const data = raw ? JSON.parse(raw) : {};
            return subKey in data ? data[subKey] : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const data = raw ? JSON.parse(raw) : {};
            data[subKey] = value;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
            // ignore errors
        }
    }, [subKey, value]);

    return [value, setValue];
}

export default useUserInterface;
