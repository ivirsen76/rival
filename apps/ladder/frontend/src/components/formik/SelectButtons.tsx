import PropTypes from 'prop-types';
import FieldWrapper from './FieldWrapper';
import classnames from 'classnames';
import style from './style.module.scss';

const SelectButtons = (props) => {
    const { field, form, options, allowUnset } = props;

    const selectOption = (value) => {
        if (allowUnset) {
            form.setFieldValue(field.name, field.value === value ? '' : value);
        } else {
            form.setFieldValue(field.name, value);
        }
    };

    return (
        <FieldWrapper {...props}>
            <div>
                <div className="btn-group">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={classnames(style.buttonOption, field.value === option.value && style.active)}
                            onClick={() => selectOption(option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </FieldWrapper>
    );
};

SelectButtons.propTypes = {
    form: PropTypes.object,
    field: PropTypes.object,
    options: PropTypes.array.isRequired,
    allowUnset: PropTypes.bool,
};

SelectButtons.defaultProps = {
    allowUnset: false,
};

export default SelectButtons;
