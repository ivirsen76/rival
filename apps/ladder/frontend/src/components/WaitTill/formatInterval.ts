export default (seconds) => {
    const sec = seconds % 60;
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
        return `${minutes}m ${sec}s`;
    }

    return `${sec}s`;
};
