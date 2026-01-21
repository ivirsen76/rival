import PropTypes from 'prop-types';
import FieldWrapper from './FieldWrapper';
import _omit from 'lodash/omit';
import classnames from 'classnames';
import Flatpickr from 'react-flatpickr';
import dayjs from '@/utils/dayjs';
import CalendarIcon from '@/styles/metronic/icons/duotone/Interface/Calendar.svg?react';

const DatePicker = (props) => {
    const { field, form } = props;
    const showError = form.errors[field.name] && form.submitCount > 0;
    const passingProps = _omit(props, ['field', 'form', 'children', 'label', 'description']);

    return (
        <FieldWrapper {...props}>
            <div
                style={{ maxWidth: '12rem' }}
                className={classnames({ 'is-invalid': showError })}
                data-datepicker={field.name}
            >
                <Flatpickr
                    className={classnames('form-control', 'form-control-solid', 'ps-12', { 'is-invalid': showError })}
                    value={field.value}
                    onChange={(value) => {
                        // we need to add some hours because defaultHour seems to be 0 all the time,
                        // and for timezones west from NC it picks the wrong date
                        form.setFieldValue(field.name, dayjs.tz(value[0]).add(9, 'hour').format('YYYY-MM-DD'));
                    }}
                    {...passingProps}
                    options={{
                        defaultHour: 0,
                        disableMobile: true,
                        altInput: true,
                        altFormat: 'M j, Y',
                        ...passingProps.options,
                    }}
                    render={({ ...params }, ref) => {
                        return (
                            <div className="position-relative d-flex align-items-center">
                                <span className="svg-icon svg-icon-1 position-absolute ms-3">
                                    <CalendarIcon />
                                </span>
                                <input ref={ref} onChange={() => {}} {...params} />
                            </div>
                        );
                    }}
                />
            </div>
        </FieldWrapper>
    );
};

DatePicker.propTypes = {
    form: PropTypes.object,
    field: PropTypes.object,
};

export default DatePicker;
