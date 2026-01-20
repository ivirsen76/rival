import PropTypes from 'prop-types';
import FieldWrapper from '../FieldWrapper';
import classnames from 'classnames';
import _xor from 'lodash/xor';
import style from './style.module.scss';

const ButtonRow = props => {
    const { field, form, options } = props;

    return (
        <FieldWrapper {...props}>
            <div className={style.buttons}>
                {options.map(option => (
                    <div
                        key={option.value}
                        data-button-in-row={option.value}
                        className={classnames(style.button, field.value.includes(option.value) && style.active)}
                        onClick={() => form.setFieldValue(field.name, _xor(field.value, [option.value]))}
                    >
                        {option.label}
                    </div>
                ))}
            </div>
        </FieldWrapper>
    );
};

ButtonRow.propTypes = {
    form: PropTypes.object,
    field: PropTypes.object,
    options: PropTypes.array.isRequired,
};

export default ButtonRow;
