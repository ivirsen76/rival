import PropTypes from 'prop-types';
import FieldWrapper from './FieldWrapper';
import _omit from 'lodash/omit';
import classnames from 'classnames';

const Select = props => {
    const { field, form, options, onChange } = props;
    const showError = form.errors[field.name] && form.submitCount > 0;
    const passingProps = _omit(props, [
        'field',
        'form',
        'children',
        'label',
        'description',
        'options',
        'wrapperClassName',
    ]);

    const isNumberValue = typeof options[0].value === 'number';

    return (
        <FieldWrapper {...props}>
            <select
                className={classnames('form-select form-select-solid', { 'is-invalid': showError })}
                {...field}
                {...passingProps}
                value={field.value || ''}
                onChange={e => {
                    const value = isNumberValue ? Number(e.target.value) : e.target.value;
                    if (onChange) {
                        onChange(value);
                    } else {
                        form.setFieldValue(field.name, value);
                    }
                }}
            >
                {options.map(option => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                    </option>
                ))}
            </select>
        </FieldWrapper>
    );
};

Select.propTypes = {
    form: PropTypes.object,
    field: PropTypes.object,
    options: PropTypes.array.isRequired,
    onChange: PropTypes.func,
};

export default Select;
