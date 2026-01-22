import { useDebounce } from 'use-debounce';
import style from './style.module.scss';

type FieldWrapperProps = {
    field: object;
    form: object;
    renderError: (...args: unknown[]) => unknown;
    label: React.ReactNode;
    description: React.ReactNode;
    wrapperClassName: string;
    children: React.ReactNode;
};

const FieldWrapper = (props: FieldWrapperProps) => {
    const { field, form, label, description, renderError, wrapperClassName } = props;
    const error = form.errors[field.name];
    const [debouncedError] = useDebounce(error, 100);

    const showError = debouncedError && form.submitCount > 0;

    return (
        <div className={typeof wrapperClassName === 'string' ? wrapperClassName : 'mb-6'}>
            {label && (
                <div>
                    <label className="form-label" htmlFor={field.name}>
                        {label}
                    </label>
                </div>
            )}
            {description && <div className={style.description}>{description}</div>}
            {props.children}
            {showError && (
                <div className="invalid-feedback d-block">
                    {renderError ? renderError(debouncedError) : debouncedError}
                </div>
            )}
        </div>
    );
};

export default FieldWrapper;
