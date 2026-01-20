import { useEffect } from 'react';

export default (props) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return null;
};
