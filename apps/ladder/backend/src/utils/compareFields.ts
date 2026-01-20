import _get from 'lodash/get';

export default (...fields) =>
    (a, b) => {
        for (let field of fields) {
            let order = 'asc';
            if (/-desc$/.test(field)) {
                order = 'desc';
                field = field.replace(/-desc$/, '');
            }

            const aValue = _get(a, field);
            const bValue = _get(b, field);

            if (typeof aValue === 'undefined' || typeof bValue === 'undefined') {
                continue;
            }

            if (aValue === bValue) {
                continue;
            }

            if (typeof aValue === 'string') {
                return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }
            return order === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
    };
