export const getEmailsFromList = (str: string) => {
    if (!str) {
        return [];
    }

    str = str.replace(/\s+/g, '');

    if (!str) {
        return [];
    }

    return str.split(';');
};
