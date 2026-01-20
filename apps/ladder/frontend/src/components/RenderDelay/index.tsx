import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const RenderDelay = props => {
    const { delay, children } = props;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setMounted(true), delay);
        return () => clearTimeout(timeout);
    }, []);

    return mounted ? children : null;
};

RenderDelay.propTypes = {
    children: PropTypes.node,
    delay: PropTypes.number,
};

RenderDelay.defaultProps = {
    delay: 500,
};

export default RenderDelay;
