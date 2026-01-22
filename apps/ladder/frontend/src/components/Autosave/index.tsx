import { useEffect, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import _isEqual from 'lodash/isEqual';
import _cloneDeep from 'lodash/cloneDeep';

type AutosaveProps = {
    values: object;
    callback: (...args: unknown[]) => unknown;
};

const Autosave = (props: AutosaveProps) => {
    const { values, callback } = props;
    const [debouncedValues] = useDebounce(values, 3000);
    const savedRef = useRef(values);
    const valuesRef = useRef(values);

    const save = () => {
        if (_isEqual(savedRef.current, valuesRef.current)) {
            return;
        }

        savedRef.current = _cloneDeep(valuesRef.current);
        callback(savedRef.current);
    };

    useEffect(save, [debouncedValues]);

    useEffect(() => {
        return save;
    }, []);

    useEffect(() => {
        valuesRef.current = values;
    }, [values]);

    return null;
};

export default Autosave;
