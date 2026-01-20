export default str => {
    if (!str) {
        return [];
    }

    return str.split(' ').map(set => set.split('-').map(Number));
};
