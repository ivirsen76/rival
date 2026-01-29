import { useRef } from 'react';
import Tooltip from '@rival/packages/components/Tooltip';
import classnames from 'classnames';
import style from './style.module.scss';

type NumberPickerProps = {
    value: number;
    onChange: (...args: unknown[]) => unknown;
};

const NumberPicker = (props: NumberPickerProps) => {
    const { value, onChange } = props;
    const tooltipRef = useRef();

    return (
        <Tooltip
            interactive
            placement="bottom"
            trigger="click"
            arrow={false}
            offset={[0, 2]}
            theme="light"
            content={
                <div className={style.pickerWrapper} data-number-picker-dropdown>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <div key={num}>
                            <button
                                className={classnames('btn', style.num, {
                                    'btn-secondary': num !== value,
                                    'btn-primary': num === value,
                                })}
                                type="button"
                                onClick={() => {
                                    tooltipRef.current && tooltipRef.current.hide();
                                    onChange(num);
                                }}
                            >
                                {num}
                            </button>
                        </div>
                    ))}
                </div>
            }
            onShow={(instance) => {
                tooltipRef.current = instance;
            }}
        >
            {typeof value === 'number' ? (
                <div className={'badge badge-square badge-dark ' + style.points}>{value}</div>
            ) : (
                <button className={'btn btn-primary btn-xs ' + style.xsButton} type="button">
                    Set
                </button>
            )}
        </Tooltip>
    );
};

export default NumberPicker;
