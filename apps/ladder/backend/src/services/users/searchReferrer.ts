import { getPlayerName } from './helpers';

export default (list, search) => {
    let result = [];

    if (search.includes('@')) {
        const sanitizedSearch = search.trim().toLowerCase();
        result = list.filter(user => user.email.toLowerCase() === sanitizedSearch);
    } else if (/^[\d\w]{5}$/.test(search.trim())) {
        const sanitizedSearch = search.trim().toLowerCase();
        result = list.filter(user => user.referralCode === sanitizedSearch);
    } else if (/^[\d\s\-()]+$/.test(search)) {
        const sanitizedSearch = search.replace(/[^\d]+/g, '');
        result = list.filter(user => user.phone === sanitizedSearch);
    } else {
        const sanitizedSearch = search.trim().replace(/\s+/g, ' ').toLowerCase();
        result = list.filter(user => getPlayerName(user).toLowerCase() === sanitizedSearch);
    }

    return result;
};
