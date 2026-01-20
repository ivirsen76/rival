import PropTypes from 'prop-types';
import FieldWrapper from './FieldWrapper';
import classnames from 'classnames';
import _omit from 'lodash/omit';
import style from './style.module.scss';

const Checkbox = props => {
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

Checkbox.propTypes = {
    form: PropTypes.object,
    field: PropTypes.object,
    label: PropTypes.node,
    description: PropTypes.node,
    className: PropTypes.string,
};

Checkbox.defaultProps = {
    className: 'form-check form-check-solid mt-2 mb-2',
};

export default Checkbox;
