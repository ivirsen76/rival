import classnames from 'classnames';
import style from './style.module.scss';

type InputProps = {
    name?: string;
    value?: number;
    onChange?: (...args: unknown[]) => unknown;
    showErrors?: boolean;
    maxSetPoints?: number;
};

const Input = (props: InputProps) => {
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

export default Input;
