import PropTypes from 'prop-types';
import style from './style.module.scss';

const LoaderWithProgress = (props) => {
    const { loading, message, percent } = props;

    if (!loading) {
        return null;
    }

    return (
        <div className={style.loader}>
            <div className={style.wrapper}>
                <div className="d-flex justify-content-between mb-2">
                    <div>{message}</div>
                    <div>{percent}%</div>
                </div>
                <div className={style.progress}>
                    <div className={style.bar} style={{ width: `${percent}%` }} />
                </div>
            </div>
        </div>
    );
};

LoaderWithProgress.propTypes = {
    loading: PropTypes.bool,
    message: PropTypes.string,
    percent: PropTypes.number,
};

LoaderWithProgress.defaultProps = {
    loading: false,
};

export default LoaderWithProgress;
