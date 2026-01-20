export default number => {
    if (number < 1000) {
        return Math.floor(number / 50) * 50;
    }

    if (number < 5000) {
        return Math.floor(number / 100) * 100;
    }

    if (number < 10000) {
        return Math.floor(number / 500) * 500;
    }

    if (number < 50000) {
        return Math.floor(number / 1000) * 1000;
    }

    return Math.floor(number / 5000) * 5000;
};
