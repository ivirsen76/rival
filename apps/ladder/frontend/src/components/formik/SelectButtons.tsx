import FieldWrapper from './FieldWrapper';
import classnames from 'classnames';
import style from './style.module.scss';

type SelectButtonsProps = {
    form?: object;
    field?: object;
    options: unknown[];
    allowUnset?: boolean;
};

const SelectButtons = (props: SelectButtonsProps) => {
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

SelectButtons.defaultProps = {
    allowUnset: false,
};

export default SelectButtons;
