import classnames from 'classnames';
import _pick from 'lodash/pick';
import style from './style.module.scss';
import Tooltip from '@rival/packages/components/Tooltip';

type CardProps = {
    className: string;
    children: React.ReactNode;
    tooltip: React.ReactNode;
    tooltipProps: object;
};

const Card = (props: CardProps) => {
    const passingProps = _pick(props, ['id', 'style']);

    return (
        <div className={classnames('card', 'shadow-sm', style.card, props.className)} {...passingProps}>
            <div className="card-body position-relative">
                {props.children}
                {props.tooltip && (
                    <Tooltip
                        content={<div className="text-center">{props.tooltip}</div>}
                        trigger="click"
                        {...props.tooltipProps}
                    >
                        <div
                            data-card-tooltip-trigger
                            className={'btn btn-bg-light btn-color-muted btn-active-light-primary ' + style.tooltip}
                        >
                            <div className={style.letter}>?</div>
                        </div>
                    </Tooltip>
                )}
            </div>
        </div>
    );
};

export default Card;
