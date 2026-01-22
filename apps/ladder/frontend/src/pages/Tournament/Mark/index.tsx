import classnames from 'classnames';
import style from './style.module.scss';

type MarkProps = {
    isEmpty: boolean;
};

const Mark = (props: MarkProps) => {
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

export default Mark;
