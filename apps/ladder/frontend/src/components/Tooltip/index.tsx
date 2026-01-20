import Tippy from '@tippyjs/react';
import './tippy.scss';
import './light.scss';
import './danger.scss';
import './none.scss';

const Tooltip = props => {
    return <Tippy animation="shift-away-subtle" {...props} />;
};

export default Tooltip;
