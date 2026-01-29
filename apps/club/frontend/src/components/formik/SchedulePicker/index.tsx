import { useRef, useState, useEffect } from 'react';
import FieldWrapper from '../FieldWrapper';
import useTooltipError from './useTooltipError';
import classnames from 'classnames';
import _cloneDeep from 'lodash/cloneDeep';
import mergeBlocks from './mergeBlocks';
import useBreakpoints from '@rival/common/utils/useBreakpoints';
import Tooltip from '@rival/common/components/Tooltip';
import CloseIcon from '@rival/common/metronic/icons/duotone/Navigation/Close.svg?react';
import style from './style.module.scss';

const MIN_HOUR = 6;
const MAX_HOUR = 21;
const HOUR_HEIGHT = 24;
const MARGIN = 4;
const MIN_DURATION = 2;
const MIN_BETWEEN = 1;
const MAX_TIME_TO_CLICK = 500; // in ms. Otherwise it treats as dragging

type BlockProps = {
    wrapperRef: object;
    onChange: (...args: unknown[]) => unknown;
    onDelete: (...args: unknown[]) => unknown;
    showError: (...args: unknown[]) => unknown;
    setSelectedBlock: (...args: unknown[]) => unknown;
    index: number;
    from: number;
    to: number;
    point: object;
    isSelected: boolean;
    field: object;
};

const Block = (props: BlockProps) => {
    const { wrapperRef, onChange, onDelete, showError, point, setSelectedBlock, isSelected, field } = props;
    const [dragging, setDragging] = useState(null);
    const [position, setPosition] = useState(null);
    const clickedPosition = useRef({ x: 0, y: 0 }); // we don't need to rerender on change
    const clickedTime = useRef(); // time between mouseDown and mouseUp
    const blockRef = useRef();
    const size = useBreakpoints();
    const isSmall = ['xs'].includes(size);
    const id = `${props.index}-${props.from}-${props.to}`;
    const blockWidth = 100 / field.value.length;

    let from = props.from;
    let to = props.to;
    let index = props.index;

    if (dragging === 'top') {
        from = Math.min(props.to - MIN_DURATION, Math.max(MIN_HOUR, Math.round(position.y / HOUR_HEIGHT) + MIN_HOUR));
    }
    if (dragging === 'body') {
        const duration = props.to - props.from;
        const shift = Math.round(position.dy / HOUR_HEIGHT);
        from = Math.min(MAX_HOUR - duration, Math.max(MIN_HOUR, shift + props.from));
        to = Math.max(MIN_HOUR + duration, Math.min(MAX_HOUR, shift + props.to));

        const blockWidthPx = position.width / field.value.length;
        index = Math.min(field.value.length - 1, Math.max(0, props.index + Math.round(position.dx / blockWidthPx)));
    }
    if (dragging === 'bottom') {
        to = Math.max(props.from + MIN_DURATION, Math.min(MAX_HOUR, Math.round(position.y / HOUR_HEIGHT) + MIN_HOUR));
    }
    if (dragging === 'new') {
        to = Math.min(MAX_HOUR, Math.round(position.y / HOUR_HEIGHT) + MIN_HOUR);

        if (from > to) {
            [from, to] = [to, from];
        }
    }

    const newId = `${index}-${from}-${to}`;
    const y1 = (from - MIN_HOUR) * HOUR_HEIGHT + (from !== to ? MARGIN : 0);
    const y2 = (to - MIN_HOUR) * HOUR_HEIGHT - (from !== to ? MARGIN : 0) + 1;

    useEffect(() => {
        if (!point) {
            return;
        }

        blockRef.current.setPointerCapture(point.pointerId);
        clickedPosition.current = point.clickedPosition;
        clickedTime.current = Date.now();
        setPosition(point.initialPosition);
        setDragging('new');
    }, [point]);

    const updatePosition = (e) => {
        const rect = wrapperRef.current.getBoundingClientRect();
        setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            dx: e.clientX - clickedPosition.current.x,
            dy: e.clientY - clickedPosition.current.y,
            width: rect.width,
        });
    };

    const onPointerDown = (part, e) => {
        e.stopPropagation();
        setSelectedBlock();
        blockRef.current.setPointerCapture(e.pointerId);
        clickedPosition.current = { x: e.clientX, y: e.clientY };
        clickedTime.current = Date.now();
        setDragging(part);
        updatePosition(e);
    };

    const onPointerMove = (e) => {
        if (!dragging) return;
        updatePosition(e);
    };

    const onPointerUp = (e) => {
        if (!dragging) {
            return;
        }

        setDragging(null);
        blockRef.current.releasePointerCapture(e.pointerId);

        if (from === to) {
            return;
        }
        if (to - from < MIN_DURATION) {
            showError(`Min ${MIN_DURATION} hours`);
        } else {
            onChange(id, newId);
        }
    };

    const isLastDay = index === field.value.length - 1;

    return (
        <>
            {dragging && isSmall && from !== to && (
                <div className={style.horizontalLine} style={{ top: `${y1 - MARGIN}px` }} />
            )}
            {dragging && isSmall && from !== to && (
                <div className={style.horizontalLine} style={{ top: `${y2 + MARGIN - 1}px` }} />
            )}
            <div
                ref={blockRef}
                className={classnames(
                    style.block,
                    dragging && style.dragging,
                    from === to && style.invisible,
                    isSelected && style.selected
                )}
                style={{
                    left: `calc(${index * blockWidth}% + ${MARGIN}px)`,
                    width: `calc(${blockWidth}% - ${MARGIN * 2 - 1}px)`,
                    top: `${y1}px`,
                    height: `${y2 - y1}px`,
                }}
                onPointerDown={(e) => onPointerDown('body', e)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onClick={(e) => {
                    e.stopPropagation();
                    const duration = Date.now() - clickedTime.current;
                    if (duration < MAX_TIME_TO_CLICK) {
                        setSelectedBlock(id);
                    }
                }}
            >
                <div className={style.topAnchor} onPointerDown={(e) => onPointerDown('top', e)} />
                <div className={style.bottomAnchor} onPointerDown={(e) => onPointerDown('bottom', e)} />
                {isSelected && (
                    <button
                        type="button"
                        className={classnames('btn btn-danger', style.deleteButton, isLastDay && style.last)}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => {
                            onDelete(newId);
                        }}
                    >
                        <CloseIcon />
                    </button>
                )}
            </div>
        </>
    );
};

Block.defaultProps = {
    setSelectedBlock: () => {},
};

type SchedulePickerProps = {
    form: object;
    field: object;
    days: unknown[];
};

const SchedulePicker = (props: SchedulePickerProps) => {
    const { field, form, days } = props;
    const [placeholderProps, setPlaceholderProps] = useState(null);
    const [selectedBlock, setSelectedBlock] = useState();
    const tooltip = useTooltipError();

    const wrapperRef = useRef();
    const duration = MAX_HOUR - MIN_HOUR;
    const dayWidth = 100 / days.length;

    useEffect(() => {
        window.addEventListener('click', setSelectedBlock);

        return () => {
            window.removeEventListener('click', setSelectedBlock);
        };
    }, []);

    const hours = new Array(duration + 1).fill(0).map((_, index) => {
        const hour = MIN_HOUR + index;

        return {
            hour,
            label: hour < 12 ? `${hour} AM` : hour === 12 ? 'Noon' : `${hour - 12} PM`,
        };
    });

    const updateBlock = (prev, next) => {
        const newValue = _cloneDeep(field.value);

        // remove prev value
        {
            const [index, from, to] = prev.split('-').map(Number);
            newValue[index] = newValue[index].filter((item) => item[0] !== from || item[1] !== to);
        }

        // add next value
        {
            const [index, from, to] = next.split('-').map(Number);
            newValue[index].push([from, to]);
            newValue[index] = mergeBlocks(newValue[index], MIN_BETWEEN);
        }

        form.setFieldValue(field.name, newValue);
    };

    const addBlock = (prev, next) => {
        setPlaceholderProps(null);

        const newValue = _cloneDeep(field.value);

        const [index, from, to] = next.split('-').map(Number);
        newValue[index].push([from, to]);
        newValue[index] = mergeBlocks(newValue[index], MIN_BETWEEN);

        form.setFieldValue(field.name, newValue);
    };

    const deleteBlock = (id) => {
        const newValue = _cloneDeep(field.value);

        const [index, from, to] = id.split('-').map(Number);
        newValue[index] = newValue[index].filter((item) => item[0] !== from || item[1] !== to);

        form.setFieldValue(field.name, newValue);
    };

    const onPointerDown = (e) => {
        setSelectedBlock();

        const rect = wrapperRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const from = Math.round(y / HOUR_HEIGHT) + MIN_HOUR;
        const indexWidth = rect.width / field.value.length;
        const index = Math.floor(x / indexWidth);

        setPlaceholderProps({
            index,
            from,
            to: from,
            point: {
                pointerId: e.pointerId,
                clickedPosition: { x: e.clientX, y: e.clientY },
                initialPosition: { x, y, dx: 0, dy: 0 },
            },
        });
    };

    const availableBlocks = days
        .map((day, index) => ({
            index,
            times: field.value[index],
        }))
        .filter((item) => item.times?.length > 0)
        .reduce((arr, item) => {
            for (const [from, to] of item.times) {
                arr.push({
                    key: `${item.index}-${from}-${to}`,
                    label: `${from}-${to}`,
                    index: item.index,
                    from,
                    to,
                });
            }

            return arr;
        }, []);

    return (
        <FieldWrapper {...props}>
            <div className={style.schedule}>
                <div className={style.days}>
                    {days.map((day) => (
                        <div key={day} className={style.day}>
                            {day}
                        </div>
                    ))}
                </div>
                <Tooltip theme="danger" trigger="manual" visible={tooltip.visible} content={tooltip.content}>
                    <div className="position-relative">
                        {hours.map((item, index) => (
                            <div
                                key={item.hour}
                                className={style.hourLabel}
                                style={{ top: `${index * HOUR_HEIGHT}px` }}
                            >
                                {item.label}
                            </div>
                        ))}
                        <div
                            ref={wrapperRef}
                            className={style.hours}
                            style={{ height: `${duration * HOUR_HEIGHT}px` }}
                            onPointerDown={onPointerDown}
                            data-schedule-picker
                        >
                            {hours.map((item, index) => (
                                <div
                                    key={item.hour}
                                    className={classnames(style.line, !(item.hour % 3) && style.highlight)}
                                    style={{ top: `${index * HOUR_HEIGHT}px` }}
                                />
                            ))}
                            {days.map((day, index) => (
                                <div key={day} className={style.divider} style={{ left: `${index * dayWidth}%` }} />
                            ))}
                            <div className={style.divider} style={{ left: '100%' }} />
                            {placeholderProps ? (
                                <Block
                                    wrapperRef={wrapperRef}
                                    onChange={addBlock}
                                    showError={tooltip.show}
                                    field={field}
                                    {...placeholderProps}
                                />
                            ) : null}
                            {availableBlocks.map((block) => (
                                <Block
                                    key={block.key}
                                    wrapperRef={wrapperRef}
                                    onChange={updateBlock}
                                    showError={tooltip.show}
                                    setSelectedBlock={setSelectedBlock}
                                    onDelete={deleteBlock}
                                    index={block.index}
                                    from={block.from}
                                    to={block.to}
                                    isSelected={selectedBlock === block.key}
                                    field={field}
                                />
                            ))}
                        </div>
                    </div>
                </Tooltip>
            </div>
        </FieldWrapper>
    );
};

export default SchedulePicker;
