import { useMemo } from 'react';
import Gallery from '@rival/common/components/Gallery';
import { useDispatch } from 'react-redux';
import { setCurrentUser } from '@/reducers/auth';

type PhotosProps = {
    photos: unknown[];
    user: object;
};

const Photos = (props: PhotosProps) => {
    const { photos, user } = props;
    const dispatch = useDispatch();
    const photosWithAuthor = useMemo(() => photos.map((item) => ({ ...item, author: user })), [photos, user]);

    return <Gallery photos={photosWithAuthor} setCurrentUser={(values) => dispatch(setCurrentUser(values))} />;
};

export default Photos;
