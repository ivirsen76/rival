import { useState, useEffect, useRef } from 'react';
import FieldWrapper from '../FieldWrapper';
import _omit from 'lodash/omit';
import axios from 'axios';
import classnames from 'classnames';
import useConfig from '../../../utils/useConfig';
import style from './style.module.scss';

let lastUpdatedAt = '';

type AddressAutocompleteProps = {
    form: object;
    field: object;
    onAutocomplete: (...args: unknown[]) => unknown;
};

const AddressAutocomplete = (props: AddressAutocompleteProps) => {
    const { field, form, onAutocomplete } = props;
    const showError = form.errors[field.name] && form.submitCount > 0;
    const passingProps = _omit(props, ['field', 'form', 'label', 'description', 'onAutocomplete']);

    const suggestionsWrapperRef = useRef();
    const [suggestions, setSuggestions] = useState([]);
    const [selected, setSelected] = useState(0);
    const [result, setResult] = useState(null);
    const config = useConfig();

    const reset = () => {
        setSelected(0);
        setSuggestions([]);
        lastUpdatedAt = Date.now();
    };

    // get list of suggestions based on typed string
    useEffect(() => {
        const value = field.value?.trim();
        if (!value || value === result) {
            reset();
            return;
        }

        const date = Date.now();
        (async () => {
            try {
                const response = await axios.get('https://api.addresszen.com/v1/autocomplete/addresses', {
                    params: {
                        query: value,
                        api_key: config.addressZenKey,
                        bias_lonlat: `${config.longitude},${config.latitude},25000`,
                        context: 'USA',
                    },
                });

                if (date > lastUpdatedAt) {
                    lastUpdatedAt = date;
                    const newSuggestions = response.data?.result?.hits
                        ? response.data.result.hits.map((item) => ({ id: item.id, value: item.suggestion }))
                        : [];
                    setSelected(0);
                    setSuggestions(newSuggestions);
                }
            } catch {
                reset();
            }
        })();
    }, [field.value]);

    // scroll to the selected suggestion if it's out of container
    useEffect(() => {
        if (suggestions.length === 0) {
            return;
        }

        const child = suggestionsWrapperRef.current.childNodes[selected];
        if (!child) {
            return;
        }

        if (child.scrollIntoViewIfNeeded) {
            child.scrollIntoViewIfNeeded(false);
        } else {
            child.scrollIntoView();
        }
    }, [suggestions, selected]);

    const pickSuggestion = (id) => {
        if (!id) {
            return;
        }

        axios
            .get(`https://api.addresszen.com/v1/autocomplete/addresses/${id}/usa`, {
                params: { api_key: config.addressZenKey },
            })
            .then((response) => {
                const address = response.data.result;

                setResult(address.line_1);
                onAutocomplete(address);
                reset();
            });
    };

    const onKeyDown = (e) => {
        if (!['Enter', 'ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
            return;
        }
        if (suggestions.length === 0) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        if (e.key === 'Enter') {
            pickSuggestion(suggestions[selected].id);
        }
        if (e.key === 'Escape') {
            reset();
        }
        if (e.key === 'ArrowUp') {
            setSelected((prev) => (prev + suggestions.length - 1) % suggestions.length);
        }
        if (e.key === 'ArrowDown') {
            setSelected((prev) => (prev + 1) % suggestions.length);
        }
    };

    return (
        <FieldWrapper {...props}>
            <div className={style.wrapper}>
                <input
                    className={classnames('form-control form-control-solid', { 'is-invalid': showError })}
                    autoComplete="off"
                    spellCheck={false}
                    {...props.field}
                    {...passingProps}
                    type="text"
                    value={props.field.value || ''}
                    onBlur={reset}
                    onKeyDown={onKeyDown}
                />
                {suggestions.length > 0 && (
                    <div className={style.suggestions} ref={suggestionsWrapperRef}>
                        {suggestions.map((item, index) => (
                            <div
                                key={item.id}
                                className={classnames(style.suggestion, selected === index && style.selected)}
                                onMouseDown={(e) => {
                                    // we need this to prevent onBlur event for the <input> field
                                    e.preventDefault();
                                }}
                                onClick={() => {
                                    pickSuggestion(item.id);
                                }}
                                data-address-autocomplete-option={item.id}
                            >
                                {item.value}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </FieldWrapper>
    );
};

export default AddressAutocomplete;
