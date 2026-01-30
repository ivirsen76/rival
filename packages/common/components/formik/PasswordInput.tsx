import { useState } from 'react';
import FieldWrapper from './FieldWrapper';
import _omit from 'lodash/omit';
import classnames from 'classnames';

type PasswordInputProps = {
    form: object;
    field: object;
};

const PasswordInput = (props: PasswordInputProps) => {
    const { field, form } = props;
    const [show, setShow] = useState(false);

    const toggleShow = (e) => {
        e && e.preventDefault();
        setShow(!show);
    };

    const showError = form.errors[field.name] && form.submitCount > 0;
    const passingProps = _omit(props, ['field', 'form', 'children', 'label', 'description', 'renderError']);

    return (
        <FieldWrapper {...props}>
            <div className="position-relative">
                <input
                    className={classnames('form-control', 'form-control-solid', 'pe-16', { 'is-invalid': showError })}
                    style={showError ? { backgroundImage: 'none' } : {}}
                    autoComplete="off"
                    {...props.field}
                    {...passingProps}
                    type={show ? 'text' : 'password'}
                    value={props.field.value || ''}
                />
                <div className="position-absolute translate-middle-y top-50 end-0 me-3">
                    <a href="" className="text-gray-600" onClick={toggleShow} tabIndex="-1">
                        {show ? 'Hide' : 'Show'}
                    </a>
                </div>
            </div>
        </FieldWrapper>
    );
};

export default PasswordInput;
