export default (str) => {
    if (!str) {
        return '';
    }

    return str.replace(/(\d{3})(\d{4})$/g, '-$1-$2');
};
