import PropTypes from 'prop-types';
import classnames from 'classnames';
import style from './style.module.scss';

const Mark = props => {
    return (
        <div
            className={classnames(style.wrapper, {
                [style.empty]: props.isEmpty,
            })}
        >
            <div className={style.line} />
            <div className={style.circle} />
        </div>
    );
};

Mark.propTypes = {
    isEmpty: PropTypes.bool,
};

export default Mark;
