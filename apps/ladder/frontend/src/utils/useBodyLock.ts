import { useEffect } from 'react';
import style from './useBodyLock.module.scss';

export default (enabled = true) => {
    const lock = () => {
        const body = document.body;
        const scrollbarWidth = window.innerWidth - body.scrollWidth;
        body.style.paddingRight = `${scrollbarWidth}px`;
        body.classList.add(style.locked);
    };

    const unlock = () => {
        const body = document.body;
        body.style.paddingRight = '';
        body.classList.remove(style.locked);
    };

    useEffect(() => {
        if (enabled) {
            lock();
        } else {
            unlock();
        }
    }, [enabled]);

    useEffect(() => {
        return unlock;
    }, []);
};
