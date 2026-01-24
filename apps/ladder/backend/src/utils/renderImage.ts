import invokeLambda from './invokeLambda';

const renderImage = async (url: string, options = {}) => {
    if (process.env.NODE_ENV === 'test' && !process.env.TL_EMAILS_AND_IMAGES) {
        return {
            src: `https://nyc3.digitaloceanspaces.com/utl/production/ada3148b518bd4da04671e36231f9c5c763adebd0fc7069e63ed16402949aa8e.png`,
            width: 360,
            height: 143,
        };
    }

    const response = await invokeLambda('generateUrlImage:1', {
        url,
        ...options,
    });

    if (response?.status !== 200) {
        throw new Error('Image was not generated');
    }

    return response.data;
};

export default renderImage;
