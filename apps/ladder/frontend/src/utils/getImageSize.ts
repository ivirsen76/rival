const getImageSize = (arr, size) => {
    const image = arr.find((item) => item.width === size);

    return image?.src || '';
};

export default getImageSize;
