import PropTypes from 'prop-types';
import { useDebounce } from 'use-debounce';
import style from './style.module.scss';

const FieldWrapper = (props) => {
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

FieldWrapper.propTypes = {
    field: PropTypes.object.isRequired,
    form: PropTypes.object.isRequired,
    renderError: PropTypes.func,
    label: PropTypes.node,
    description: PropTypes.node,
    wrapperClassName: PropTypes.string,
    children: PropTypes.node,
};

export default FieldWrapper;
