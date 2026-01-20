import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDebounce } from 'use-debounce';
import _isEqual from 'lodash/isEqual';
import _cloneDeep from 'lodash/cloneDeep';

const Autosave = props => {
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

Autosave.propTypes = {
    values: PropTypes.object,
    callback: PropTypes.func,
};

export default Autosave;
