import { useState, useEffect } from 'react';
import _debounce from 'lodash/debounce';
import sizes from './useBreakpoints.module.scss';

Object.keys(sizes).forEach(key => {
    sizes[key] = parseInt(sizes[key], 10);
});

export const SIZE_XS = 'xs';
export const SIZE_SM = 'sm';
export const SIZE_MD = 'md';
export const SIZE_LG = 'lg';
export const SIZE_XL = 'xl';
export const SIZE_XXL = 'xxl';

const resolveBreakpoint = width => {
    if (width < sizes.sm) {
        return SIZE_XS;
    }
    if (width < sizes.md) {
        return SIZE_SM;
    }
    if (width < sizes.lg) {
        return SIZE_MD;
    }
    if (width < sizes.xl) {
        return SIZE_LG;
    }
    if (width < sizes.xxl) {
        return SIZE_XL;
    }

    return SIZE_XXL;
};

export default () => {
    const [size, setSize] = useState(() => resolveBreakpoint(window.innerWidth));

    useEffect(() => {
        const calcInnerWidth = _debounce(() => {
            setSize(resolveBreakpoint(window.innerWidth));
        }, 200);
        window.addEventListener('resize', calcInnerWidth);
        return () => window.removeEventListener('resize', calcInnerWidth);
    }, []);

    return size;
};
