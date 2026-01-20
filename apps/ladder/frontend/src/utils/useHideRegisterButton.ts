import { useEffect } from 'react';

export default hide => {
    useEffect(() => {
        if (!hide) {
            return;
        }

        document.body.classList.add('rival-hide-register-button');
        return () => {
            document.body.classList.remove('rival-hide-register-button');
        };
    }, [hide]);
};
