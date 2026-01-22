import FieldWrapper from './FieldWrapper';
import _xor from 'lodash/xor';
import classnames from 'classnames';

type CheckboxArrayProps = {
    form?: object;
    field?: object;
    options: unknown[];
    isBlockDescription?: boolean;
    orientation?: string;
};

const CheckboxArray = (props: CheckboxArrayProps) => {
    const { field, form, options, orientation, isBlockDescription } = props;
    const showError = form.errors[field.name] && form.submitCount > 0;

    return (
        <FieldWrapper {...props}>
            {options.map((option) => (
                <div
                    key={option.value}
                    className={classnames('form-check form-check-solid mb-2', {
                        'is-invalid': showError,
                        'form-check-inline': orientation === 'horizontal',
                    })}
                >
                    <label className={classnames('form-check-label', option.disabled && 'text-muted')}>
                        <input
                            type="checkbox"
                            name={field.name}
                            value={option.value}
                            checked={field.value.includes(option.value)}
                            className="form-check-input"
                            onChange={() => {
                                form.setFieldValue(field.name, _xor(field.value, [option.value]));
                            }}
                            disabled={option.disabled}
                        />
                        {option.label}
                        {option.description &&
                            (isBlockDescription ? (
                                <div className="text-muted" style={{ fontSize: '0.9em' }}>
                                    {option.description}
                                </div>
                            ) : (
                                <span className="ms-2">({option.description})</span>
                            ))}
                    </label>
                </div>
            ))}
        </FieldWrapper>
    );
};

CheckboxArray.defaultProps = {
    orientation: 'vertical',
};

export default CheckboxArray;
