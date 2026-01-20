import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import FieldWrapper from './FieldWrapper';
import _omit from 'lodash/omit';
import classnames from 'classnames';
import style from './style.module.scss';

const Textarea = props => {
    const { field, form } = props;
    const textareaRef = useRef();
    const showError = form.errors[field.name] && form.submitCount > 0;
    const passingProps = _omit(props, ['field', 'form', 'children', 'label', 'description', 'wrapperClassName']);

    useEffect(() => {
        if (props.autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    // just to not have empty line at the end
    const helperValue = field.value + '1';

    return (
        <FieldWrapper {...props}>
            <div className={classnames(style.growWrapper, { 'is-invalid': showError })}>
                <div
                    className={classnames(
                        'form-control',
                        'form-control-solid',
                        { 'is-invalid': showError },
                        style.helper
                    )}
                >
                    {helperValue}
                </div>
                <textarea
                    ref={textareaRef}
                    className={classnames('form-control', 'form-control-solid', { 'is-invalid': showError })}
                    autoComplete="off"
                    {...props.field}
                    {...passingProps}
                    value={props.field.value || ''}
                />
            </div>
        </FieldWrapper>
    );
};

Textarea.propTypes = {
    form: PropTypes.object,
    field: PropTypes.object,
    autoFocus: PropTypes.bool,
};

export default Textarea;
