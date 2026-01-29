// @ts-nocheck
import _omit from 'lodash/omit';

export default (item) => {
    if (item) {
        if (Array.isArray(item)) {
            return item.map((obj) => (obj.email ? { ..._omit(obj, ['email']), address: obj.email } : obj));
        }

        return item.email ? { ..._omit(item, ['email']), address: item.email } : item;
    }

    return item;
};
