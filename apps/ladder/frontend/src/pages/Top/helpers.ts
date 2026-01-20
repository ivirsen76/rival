export const getPercentile = (pos, total) => {
    return Math.ceil((pos / total) * 100);
};
