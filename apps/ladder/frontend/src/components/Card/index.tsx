import PropTypes from 'prop-types';
import classnames from 'classnames';
import _pick from 'lodash/pick';
import style from './style.module.scss';
import Tooltip from '@/components/Tooltip';

const Card = props => {
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

Card.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    tooltip: PropTypes.node,
    tooltipProps: PropTypes.object,
};

export default Card;
