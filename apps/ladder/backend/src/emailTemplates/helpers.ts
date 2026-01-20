export const getUserMilestone = num => {
    if (num < 5) {
        return num;
    }

    if (num < 10) {
        return Math.floor(num / 5) * 5;
    }

    if (num < 50) {
        return Math.floor(num / 10) * 10;
    }

    return Math.floor(num / 50) * 50;
};
