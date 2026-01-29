import FieldWrapper from './FieldWrapper';
import _omit from 'lodash/omit';
import classnames from 'classnames';

type InputProps = {
    form: object;
    field: object;
    type: string;
};

const Input = (props: InputProps) => {
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

Input.defaultProps = {
    type: 'text',
};

export default Input;
