import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import Tooltip from '@rival/common/components/Tooltip';
import Icon from '../Icon';
import _throttle from 'lodash/throttle';
import WindIcon from './wind.svg?react';
import SnowflakeIcon from './snowflake.svg?react';
import DropIcon from './drop.svg?react';
import ClearIcon from './clear.svg?react';
import style from './style.module.scss';

const courtConditions = {
    dry: 'Courts are dry.',
    warning: 'Courts might be wet.',
    wet: 'Courts are wet.',
};

type HoverProps = {
    weather: object;
    courtDryness: unknown[];
};

const Hover = (props: HoverProps) => {
    const { weather, courtDryness } = props;
    const [position, setPosition] = useState(null);
    const [ready, setReady] = useState(false);
    const wrapperRef = useRef();

    const totalDays = weather.days.length;

    const changePosition = useCallback(
        // eslint-disable-next-line react-hooks/use-memo
        _throttle((event) => {
            const wrapper = wrapperRef.current;
            if (!wrapper) {
                return;
            }
            const rect = wrapper.getBoundingClientRect();
            const pos = event.touches?.[0]?.clientX || event.clientX;
            const newPosition = ((pos - rect.left) / rect.width) * 100;
            setPosition(newPosition);
        }, 16)
    );

    const handleMousePosition = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        changePosition(event);
    });

    const drynessArray = useMemo(() => {
        return courtDryness.reduce((arr, item) => {
            arr.push(...new Array(item[1]).fill(item[0]));
            return arr;
        }, []);
    }, [courtDryness]);

    const clearPosition = useCallback(() => {
        setTimeout(() => setPosition(null), 20);
    });

    useEffect(() => {
        const timeout = setTimeout(() => setReady(true), 1000);
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        if (!ready) {
            return;
        }

        const wrapper = wrapperRef.current;
        if (!wrapper) {
            return;
        }

        wrapper.addEventListener('mousemove', handleMousePosition);
        wrapper.addEventListener('touchstart', handleMousePosition);
        wrapper.addEventListener('touchmove', handleMousePosition);
        window.addEventListener('touchstart', clearPosition);

        return () => {
            wrapper.removeEventListener('mousemove', handleMousePosition);
            wrapper.removeEventListener('touchstart', handleMousePosition);
            wrapper.removeEventListener('touchmove', handleMousePosition);
            window.removeEventListener('touchstart', clearPosition);
        };
    }, [ready]);

    const hourIndex = position > 0 ? Math.floor((totalDays * 24 * position) / 100) : null;

    const tooltipContent = useMemo(() => {
        if (hourIndex === null) {
            return null;
        }

        const hourCondition = weather.hours[hourIndex];
        const dryness = drynessArray[hourIndex];
        const time = (() => {
            let hour = hourIndex % 24;
            if (hour === 0) {
                return '12 AM';
            }
            if (hour === 12) {
                return 'Noon';
            }

            const ampm = hour > 12 ? 'PM' : 'AM';
            if (hour > 12) {
                hour -= 12;
            }

            return `${hour} ${ampm}`;
        })();

        return (
            <div className={style.conditions}>
                <div className={style.time}>{time}</div>
                <div className="d-flex justify-content-between">
                    <div className={style.icon}>
                        <Icon type={hourCondition.condition} dayPart={hourCondition.dayPart} />
                    </div>
                    <div className={style.temp}>{Math.round(hourCondition.temp)}&deg;</div>
                </div>
                <div className="d-flex justify-content-between mt-n2">
                    <div className="d-flex align-items-center">
                        <span className="svg-icon me-1">
                            {hourCondition.precipType === 'clear' ? (
                                <ClearIcon />
                            ) : hourCondition.precipType === 'snow' ? (
                                <SnowflakeIcon />
                            ) : (
                                <DropIcon />
                            )}
                        </span>
                        <div>{Math.round(hourCondition.precipChance || 0)}%</div>
                    </div>
                    <div>
                        <span className="svg-icon svg-icon-1 svg-icon-primary me-1">
                            <WindIcon />
                        </span>
                        {Math.round(hourCondition.windspeed)} mph
                    </div>
                </div>
                <div>{courtConditions[dryness]}</div>
            </div>
        );
    }, [hourIndex]);

    return (
        <div className={style.hover}>
            <div className={style.trigger} ref={wrapperRef} onMouseLeave={clearPosition}>
                {position > 0 ? (
                    <Tooltip
                        content={tooltipContent}
                        trigger="manual"
                        showOnCreate
                        hideOnClick={false}
                        placement="right"
                    >
                        <div className={style.line} style={{ left: `${position}%` }} />
                    </Tooltip>
                ) : null}
            </div>
            {weather.days.map((day, index) => (
                <div key={day.datetime} className={style.day}>
                    <div className={style.sunrise} style={{ width: `${day.sunrisePercent}%` }} />
                    <div className={style.sunset} style={{ width: `${day.sunsetPercent}%` }} />
                </div>
            ))}
        </div>
    );
};

export default Hover;
