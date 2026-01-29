import { useEffect } from 'react';
import style from './useLazyImages.module.scss';

export default () => {
    useEffect(() => {
        const lazyloadImages = document.querySelectorAll(`.${style.lazy}`);
        const imageObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const image = entry.target;
                        image.classList.remove(style.lazy);
                        imageObserver.unobserve(image);
                    }
                });
            },
            { rootMargin: '2000px 0px 2000px 0px' }
        );

        lazyloadImages.forEach((image) => {
            imageObserver.observe(image);
        });

        return () => {
            lazyloadImages.forEach((image) => {
                imageObserver.unobserve(image);
            });
        };
    }, []);

    return [style.lazy];
};
