import FieldWrapper from './FieldWrapper';
import classnames from 'classnames';
import _omit from 'lodash/omit';
import style from './style.module.scss';

type CheckboxProps = {
    form: object;
    field: object;
    label: React.ReactNode;
    description: React.ReactNode;
    className: string;
};

const Checkbox = (props: CheckboxProps) => {
    const { field, form, label, description, className } = props;
    const showError = form.errors[field.name] && form.submitCount > 0;

    return (
        <FieldWrapper {..._omit(props, ['label', 'description'])}>
            <div className={classnames(className, { 'is-invalid': showError })}>
                <div>
                    <label className="form-check-label">
                        <input
                            type="checkbox"
                            name={field.name}
                            value="true"
                            checked={Boolean(field.value)}
                            className="form-check-input"
                            onChange={() => {
                                form.setFieldValue(field.name, !field.value);
                            }}
                        />
                        {label}
                    </label>
                </div>
                {description && <div className={style.checkboxDescription}>{description}</div>}
            </div>
        </FieldWrapper>
    );
};

Checkbox.defaultProps = {
    className: 'form-check form-check-solid mt-2 mb-2',
};

export default Checkbox;
