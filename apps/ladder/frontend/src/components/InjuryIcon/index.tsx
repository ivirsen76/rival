import PropTypes from 'prop-types';
import classnames from 'classnames';
import style from './style.module.scss';

const InjuryIcon = props => {
    return <div className={classnames(style.injury, props.className)}>+</div>;
};

InjuryIcon.propTypes = {
    className: PropTypes.string,
};

export default InjuryIcon;
