import PropTypes from 'prop-types';
import style from './style.module.scss';

const Html = props => {
    return <div className={style.html} dangerouslySetInnerHTML={{ __html: props.content }} />;
};

Html.propTypes = {
    content: PropTypes.string,
};

export default Html;
