import FieldWrapper from '../FieldWrapper';
import classnames from 'classnames';
import AnimateHeight from 'react-animate-height';
import style from './style.module.scss';

type RadioModernProps = {
    form?: object;
    field?: object;
    label?: React.ReactNode;
    description?: React.ReactNode;
    options?: unknown[];
    alwaysShowDescription?: boolean;
    allowUnselect?: boolean;
};

const RadioModern = (props: RadioModernProps) => {
    const { field, form, options, alwaysShowDescription, allowUnselect } = props;

    return (
        <FieldWrapper {...props}>
            <div className={classnames(style.wrapper, alwaysShowDescription && 'gap-4')}>
                {options.map((item) => {
                    const isSelected = item.value === field.value;

                    return (
                        <div key={item.value} className={style.option}>
                            <label>
                                <div className={style.label}>
                                    <div className="form-check form-check-solid">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            value=""
                                            checked={isSelected}
                                            onClick={() => {
                                                if (!item.disabled) {
                                                    if (allowUnselect || !isSelected) {
                                                        form.setFieldValue(field.name, isSelected ? '' : item.value);
                                                    }
                                                }
                                            }}
                                            onChange={() => {}}
                                            data-radio-option={item.value}
                                        />
                                    </div>
                                    <div className={classnames(isSelected && 'fw-bold', item.disabled && 'text-muted')}>
                                        {item.label}
                                    </div>
                                </div>
                                {item.description && (
                                    <AnimateHeight
                                        duration={200}
                                        height={isSelected || alwaysShowDescription ? 'auto' : 0}
                                        delay={isSelected ? 50 : 0}
                                    >
                                        <div className={style.description}>{item.description}</div>
                                    </AnimateHeight>
                                )}
                            </label>
                        </div>
                    );
                })}
            </div>
        </FieldWrapper>
    );
};

RadioModern.defaultProps = {
    allowUnselect: true,
};

export default RadioModern;
