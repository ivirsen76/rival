import PropTypes from 'prop-types';
import classnames from 'classnames';
import style from './style.module.scss';

const Input = (props) => {
    const { name, value, onChange, showErrors, maxSetPoints } = props;
    const gamePoints = new Array(maxSetPoints + 1).fill(0).map((_, index) => index);

    return (
        <div className={classnames('w-100 d-flex', { [style.shake]: showErrors })} data-field={name}>
            {gamePoints.map((point) => (
                <button
                    key={point}
                    type="button"
                    className={classnames(style.number, showErrors && style.danger, point === value && style.active)}
                    onClick={() => onChange(point)}
                >
                    {point}
                </button>
            ))}
        </div>
    );
};

Input.propTypes = {
    name: PropTypes.string,
    value: PropTypes.number,
    onChange: PropTypes.func,
    showErrors: PropTypes.bool,
    maxSetPoints: PropTypes.number,
};

export default Input;
