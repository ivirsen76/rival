import { useState, useEffect } from 'react';

type RenderDelayProps = {
    children?: React.ReactNode;
    delay?: number;
};

const RenderDelay = (props: RenderDelayProps) => {
    const { delay, children } = props;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setMounted(true), delay);
        return () => clearTimeout(timeout);
    }, []);

    return mounted ? children : null;
};

RenderDelay.defaultProps = {
    delay: 500,
};

export default RenderDelay;
