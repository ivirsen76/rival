import { useRef } from 'react';
import { uniqueId } from 'lodash';

export default (str = 'id') => {
    const id = useRef(uniqueId(str));
    return id.current;
};
