import { useRef } from 'react';
import FieldWrapper from '../FieldWrapper';
import Tooltip from '@rival/common/components/Tooltip';
import classnames from 'classnames';
import style from './style.module.scss';

type HtmlSelectProps = {
    form: object;
    field: object;
    options: unknown[];
    onChange: (...args: unknown[]) => unknown;
};

const HtmlSelect = (props: HtmlSelectProps) => {
    const { field, form, options } = props;
    const tooltipRef = useRef();

    const selectedOption = options.find((option) => option.value === field.value) || options[0];

    const onChange = (value) => {
        if (props.onChange) {
            props.onChange(value);
        } else {
            form.setFieldValue(field.name, value);
        }
    };

    return (
        <FieldWrapper {...props}>
            <Tooltip
                content={
                    <div
                        onClick={() => {
                            tooltipRef?.current.hide();
                        }}
                        data-html-select={field.value}
                    >
                        {options.map((option) => (
                            <div
                                key={option.value}
                                data-option={option.value}
                                className={classnames(style.option, option.value === field.value && style.selected)}
                                onClick={() => onChange(option.value)}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                }
                interactive
                placement="bottom-start"
                trigger="click"
                arrow={false}
                offset={[0, 8]}
                theme="light"
                onShow={(instance) => {
                    tooltipRef.current = instance;
                }}
            >
                <div className={classnames('form-select form-select-solid', style.input)} data-html-select={field.name}>
                    {selectedOption.label}
                </div>
            </Tooltip>
        </FieldWrapper>
    );
};

export default HtmlSelect;
