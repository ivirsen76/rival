export const getEmailsFromList = str => {
    if (!str) {
        return [];
    }

    str = str.replace(/\s+/g, '');

    if (!str) {
        return [];
    }

    return str.split(';');
};
