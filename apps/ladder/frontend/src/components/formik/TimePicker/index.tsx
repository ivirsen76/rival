import FieldWrapper from '../FieldWrapper';
import classnames from 'classnames';
import ClockIcon from '@/styles/metronic/icons/duotone/Home/Clock.svg?react';
import ArrowUpIcon from '@/styles/metronic/icons/duotone/Navigation/Angle-up.svg?react';
import ArrowDownIcon from '@/styles/metronic/icons/duotone/Navigation/Angle-down.svg?react';
import Tooltip from '@/components/Tooltip';
import useAppearance from '@/utils/useAppearance';
import dayjs from '@/utils/dayjs';
import style from './style.module.scss';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type TimePickerProps = {
    form?: object;
    field?: object;
    options?: object;
};

const TimePicker = (props: TimePickerProps) => {
    const { field, form, options } = props;
    const showError = form.errors[field.name] && form.submitCount > 0;
    const appearance = useAppearance();

    const valueAsDate = field.value ? dayjs.tz(field.value) : null;
    const hours = field.value ? Number(valueAsDate.format('H')) : 17;
    const minutes = field.value ? Number(valueAsDate.format('m')) : 0;
    const stringValue = field.value ? valueAsDate.format('ddd D, h:mm A') : <span>&nbsp;</span>;
    const am = hours >= 12 ? 'PM' : 'AM';

    const addHoursToValue = (h) => {
        const newHours = (((hours % 12) + h + 12) % 12) + (am === 'AM' ? 0 : 12);
        form.setFieldValue(field.name, valueAsDate.hour(newHours).format('YYYY-MM-DD HH:mm:ss'));
    };

    const addMinutesToValue = (m) => {
        const newMinutes = (minutes + m + 60) % 60;
        form.setFieldValue(field.name, valueAsDate.minute(newMinutes).format('YYYY-MM-DD HH:mm:ss'));
    };

    const toggleAM = () => {
        const newHours = (hours + 12) % 24;
        form.setFieldValue(field.name, valueAsDate.hour(newHours).format('YYYY-MM-DD HH:mm:ss'));
    };

    const buttonClassName = classnames(
        'btn btn-sm',
        appearance === 'light' && 'btn-light',
        appearance === 'dark' && 'btn-secondary'
    );

    const renderDates = () => {
        let { minDate, maxDate } = options;

        if (!minDate) {
            minDate = dayjs.tz().isoWeekday(1);
        }

        if (!maxDate) {
            maxDate = dayjs.tz();
        }

        const minVisibleDate = minDate.isoWeekday(1);
        const maxVisibleDate = maxDate.isoWeekday(7);

        let currentWeek = [];
        let currentDate = minVisibleDate;
        const weeks = [currentWeek];
        while (currentDate.isSameOrBefore(maxVisibleDate, 'day')) {
            currentWeek.push(currentDate);
            currentDate = currentDate.add(1, 'day');

            if (currentDate.isoWeekday() === 1 && currentDate.isSameOrBefore(maxDate, 'day')) {
                currentWeek = [];
                weeks.push(currentWeek);
            }
        }

        return (
            <div className={style.weeks}>
                <div className="d-grid gap-2 ms-n2">
                    {weekdays.map((weekday, index) => {
                        return (
                            <button
                                key={weekday}
                                type="button"
                                className={classnames('btn btn-sm', {
                                    'btn-color-gray-700': index < 5,
                                    'btn-color-primary': index >= 5,
                                })}
                                disabled
                            >
                                {weekday}
                            </button>
                        );
                    })}
                </div>
                {weeks.map((week, index) => (
                    <div key={week[0].format('YYYY-MM-DD')} className="d-grid gap-2">
                        {week.map((date, index1) => {
                            const isSelected = field.value && dayjs.tz(field.value).isSame(date, 'day');
                            const isOutside = !date.isBetween(minDate, maxDate, 'day', '[]');
                            const formattedDate = date.format('D');

                            return (
                                <button
                                    key={formattedDate}
                                    type="button"
                                    className={classnames('btn btn-sm', {
                                        'btn-secondary': !isSelected && !isOutside,
                                        'btn-primary': isSelected,
                                    })}
                                    data-day={`${index + 1}-${index1 + 1}`}
                                    disabled={isOutside}
                                    onClick={() => {
                                        form.setFieldValue(
                                            field.name,
                                            date.hour(hours).minute(minutes).second(0).format('YYYY-MM-DD HH:mm:ss')
                                        );
                                    }}
                                >
                                    {formattedDate}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    };

    const renderTime = () => (
        <div className={'d-flex gap-2 ' + style.buttons}>
            <div className="d-flex flex-column gap-2">
                <button
                    type="button"
                    className={buttonClassName}
                    onClick={() => addHoursToValue(1)}
                    data-hour-change="up"
                >
                    <span className="svg-icon svg-icon-primary">
                        <ArrowUpIcon />
                    </span>
                </button>
                <button type="button" className="btn btn-sm btn-bg-primary btn-color-white">
                    {hours % 12 || 12}
                </button>
                <button
                    type="button"
                    className={buttonClassName}
                    onClick={() => addHoursToValue(-1)}
                    data-hour-change="down"
                >
                    <span className="svg-icon svg-icon-primary me-0">
                        <ArrowDownIcon />
                    </span>
                </button>
            </div>
            <div className="d-flex flex-column gap-2">
                <button
                    type="button"
                    className={buttonClassName}
                    onClick={() => addMinutesToValue(15)}
                    data-minute-change="up"
                >
                    <span className="svg-icon svg-icon-primary me-0">
                        <ArrowUpIcon />
                    </span>
                </button>
                <button type="button" className="btn btn-sm btn-bg-primary btn-color-white">
                    {minutes.toString().padStart(2, '0')}
                </button>
                <button
                    type="button"
                    className={buttonClassName}
                    onClick={() => addMinutesToValue(-15)}
                    data-minute-change="down"
                >
                    <span className="svg-icon svg-icon-primary me-0">
                        <ArrowDownIcon />
                    </span>
                </button>
            </div>
            <div className="d-flex align-self-center">
                <button type="button" className={buttonClassName} onClick={toggleAM}>
                    {am}
                </button>
            </div>
        </div>
    );

    return (
        <FieldWrapper {...props}>
            <Tooltip
                interactive
                placement="bottom-start"
                trigger="click"
                arrow={false}
                offset={[0, 2]}
                theme="light"
                content={
                    <div className="d-flex gap-6 p-2">
                        <div>{renderDates()}</div>
                        {field.value ? (
                            <>
                                <div className={style.separator} />
                                <div>{renderTime()}</div>
                            </>
                        ) : null}
                    </div>
                }
            >
                <div style={{ width: '14em' }} className={classnames({ 'is-invalid': showError })}>
                    <div
                        className="position-relative d-flex align-items-center text-nowrap"
                        data-timepicker={field.name}
                    >
                        <span className="svg-icon svg-icon-1 position-absolute ms-3">
                            <ClockIcon />
                        </span>
                        <div
                            className={classnames('form-control', 'form-control-solid', 'ps-12', {
                                'is-invalid': showError,
                            })}
                            style={{ cursor: 'pointer' }}
                            data-playwright-placeholder="short"
                        >
                            {stringValue}
                        </div>
                    </div>
                </div>
            </Tooltip>
        </FieldWrapper>
    );
};

TimePicker.defaultProps = {
    options: {},
};

export default TimePicker;
