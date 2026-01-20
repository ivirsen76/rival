export default bytes => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / k ** i).toFixed(0)) + ' ' + sizes[i];
};
