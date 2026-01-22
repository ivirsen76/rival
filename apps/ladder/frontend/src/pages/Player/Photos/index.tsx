import { useMemo } from 'react';
import Gallery from '@/components/Gallery';

type PhotosProps = {
    photos?: unknown[];
    user?: object;
};

const Photos = (props: PhotosProps) => {
    const { photos, user } = props;
    const photosWithAuthor = useMemo(() => photos.map((item) => ({ ...item, author: user })), [photos, user]);

    return <Gallery photos={photosWithAuthor} />;
};

Photos.defaultProps = {};

export default Photos;
