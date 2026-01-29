import { useState, useEffect } from 'react';

export default () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        (async () => {
            const module = await import('@emoji-mart/data');
            setData(module.default);
        })();
    }, []);

    return data;
};
