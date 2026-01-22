/* eslint-disable jsx-a11y/no-autofocus */
import { useMemo, useState, useEffect, useRef } from 'react';
import FieldWrapper from '../FieldWrapper';
import { useDebounce } from 'use-debounce';
import dayjs from '@/utils/dayjs';
import convertDate from '@/utils/convertDate';
import classnames from 'classnames';
import style from './style.module.scss';

type BirthdayProps = {
    form?: object;
    field?: object;
    autoFocus?: boolean;
};

const Birthday = (props: BirthdayProps) => {
    const { field, form } = props;
    const [mm, setMM] = useState(() => (field.value ? field.value.slice(5, 7) : ''));
    const [dd, setDD] = useState(() => (field.value ? field.value.slice(8, 10) : ''));
    const [yyyy, setYYYY] = useState(() => (field.value ? field.value.slice(0, 4) : ''));
    const showError = form.errors[field.name] && form.submitCount > 0;
    const [debouncedValue] = useDebounce(field.value, 500);
    const mmRef = useRef();
    const ddRef = useRef();
    const yyyyRef = useRef();

    const result = useMemo(() => {
        const date = dayjs(convertDate(debouncedValue), 'YYYY-MM-DD', true);
        if (!date.isValid()) {
            return null;
        }

        const age = Math.floor(dayjs().diff(date, 'year', true));
        if (age < 1 || age > 100) {
            return null;
        }

        return `${date.format('MMM D, YYYY')} - ${age} years old`;
    }, [debouncedValue]);

    useEffect(() => {
        const value = !mm && !dd && !yyyy ? '' : `${mm}/${dd}/${yyyy}`;
        form.setFieldValue(field.name, value);
    }, [mm, dd, yyyy]);

    useEffect(() => {
        // If day is set don't move
        if (dd) {
            return;
        }

        const num = Number(mm);
        if (mm.length > 1 || num > 1) {
            ddRef.current.focus();
        }
    }, [mm]);

    useEffect(() => {
        // If year is set don't move
        if (yyyy) {
            return;
        }

        const num = Number(dd);
        if (dd.length === 2 || (num > 3 && num < 10)) {
            yyyyRef.current.focus();
        }
    }, [dd]);

    const focusField = (fieldRef) => {
        const el = fieldRef.current;
        const length = el.value.length;
        // Move caret to the end
        el.setSelectionRange(length, length);
        el.focus();
    };

    return (
        <FieldWrapper {...props}>
            <div className={style.wrapper}>
                <div className={style.month}>Month</div>
                <div className={style.day}>Day</div>
                <div className={style.year}>Year</div>
                <div />
                <input
                    ref={mmRef}
                    name="mm"
                    className={classnames('form-control', 'form-control-solid', { 'is-invalid': showError })}
                    autoComplete="off"
                    value={mm}
                    onChange={(e) => setMM(e.target.value.replace(/\D/g, ''))}
                    onClick={(e) => {
                        e.preventDefault();
                        focusField(mmRef);
                    }}
                    maxLength={2}
                    inputMode="numeric"
                    autoFocus={props.autoFocus}
                />
                <input
                    ref={ddRef}
                    name="dd"
                    className={classnames('form-control', 'form-control-solid', { 'is-invalid': showError })}
                    autoComplete="off"
                    value={dd}
                    onChange={(e) => setDD(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !e.target.value) {
                            e.preventDefault();
                            focusField(mmRef);
                        }
                    }}
                    onClick={(e) => {
                        e.preventDefault();
                        focusField(ddRef);
                    }}
                    maxLength={2}
                    inputMode="numeric"
                />
                <input
                    ref={yyyyRef}
                    name="yyyy"
                    className={classnames('form-control', 'form-control-solid', { 'is-invalid': showError })}
                    autoComplete="off"
                    value={yyyy}
                    onChange={(e) => setYYYY(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !e.target.value) {
                            e.preventDefault();
                            focusField(ddRef);
                        }
                    }}
                    onClick={(e) => {
                        e.preventDefault();
                        focusField(yyyyRef);
                    }}
                    maxLength={4}
                    inputMode="numeric"
                />
                <div className={style.result}>{result}</div>
            </div>
        </FieldWrapper>
    );
};

export default Birthday;
