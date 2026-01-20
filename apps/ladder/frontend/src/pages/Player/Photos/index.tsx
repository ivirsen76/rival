import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Gallery from '@/components/Gallery';

const Photos = (props) => {
    const { photos, user } = props;
    const photosWithAuthor = useMemo(() => photos.map((item) => ({ ...item, author: user })), [photos, user]);

    return <Gallery photos={photosWithAuthor} />;
};

Photos.propTypes = {
    photos: PropTypes.array,
    user: PropTypes.object,
};

Photos.defaultProps = {};

export default Photos;
