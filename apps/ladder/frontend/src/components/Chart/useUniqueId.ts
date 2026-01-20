import { useMemo } from 'react';

let count = 0;

export default () => {
    const id = useMemo(() => count++, []);
    return `ieId${id}`;
};
