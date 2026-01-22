import classnames from 'classnames';
import style from './style.module.scss';

type InjuryIconProps = {
    className: string;
};

const InjuryIcon = (props: InjuryIconProps) => {
    return <div className={classnames(style.injury, props.className)}>+</div>;
};

export default InjuryIcon;
