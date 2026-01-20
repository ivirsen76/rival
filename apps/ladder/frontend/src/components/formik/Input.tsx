import PropTypes from 'prop-types';
import FieldWrapper from './FieldWrapper';
import _omit from 'lodash/omit';
import classnames from 'classnames';

const Input = (props) => {
    const { field, form } = props;
    const showError = form.errors[field.name] && form.submitCount > 0;
    const passingProps = _omit(props, [
        'field',
        'form',
        'children',
        'label',
        'description',
        'renderError',
        'wrapperClassName',
    ]);

    return (
        <FieldWrapper {...props}>
            <input
                className={classnames('form-control', 'form-control-solid', { 'is-invalid': showError })}
                autoComplete="off"
                {...props.field}
                {...passingProps}
                value={props.field.value || ''}
            />
        </FieldWrapper>
    );
};

Input.propTypes = {
    form: PropTypes.object,
    field: PropTypes.object,
    type: PropTypes.string,
};

Input.defaultProps = {
    type: 'text',
};

export default Input;
