import { useState, useEffect } from 'react';
import classnames from 'classnames';

export default ({ key, options, initial, className }) => {
    const initialState = initial || options[0].value;
    const [value, setValue] = useState(initialState);
    const currentValue = options.some((item) => item.value === value) ? value : options[0].value;

    useEffect(() => {
        if (value !== initialState) {
            setValue(initialState);
        }
    }, [key, initialState]);

    const tabs = (
        <ul
            className={classnames(
                'nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-6 fw-semibold mt-n2',
                className
            )}
        >
            {options.map((option) => (
                <li key={option.value} className="nav-item ms-n2">
                    <a
                        className={classnames('nav-link text-active-primary', {
                            active: currentValue === option.value,
                        })}
                        data-tab-link={option.value}
                        href=""
                        onClick={(e) => {
                            e.preventDefault();
                            setValue(option.value);
                        }}
                    >
                        {currentValue !== option.value && option.inactiveLabel ? option.inactiveLabel : option.label}
                    </a>
                </li>
            ))}
        </ul>
    );

    return [currentValue, tabs];
};
