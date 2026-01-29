import { useState, useMemo } from 'react';
import Card from '@rival/packages/components/Card';
import Loader from '@rival/packages/components/Loader';
import axios from '@/utils/axios';
import { useQuery } from 'react-query';
import { RowsPhotoAlbum } from 'react-photo-album';
import { Squircle } from 'corner-smoothing';
import Paginator from '@rival/packages/components/Paginator';

const PHOTOS_PER_PAGE = 25;

const Photos = (props) => {
    const [currentPage, setCurrentPage] = useState(1);

    const { data: photos, isLoading } = useQuery(
        `globalPhotos`,
        async () => {
            const response = await axios.put('/api/utils/0', { action: 'getGlobalPhotos' });
            return response.data.data.map((item) => ({
                key: item.id,
                src: item.url,
                width: 400,
                height: Math.round((400 / item.width) * item.height),
                alt: item.title || '',
                citySlug: item.citySlug,
                userSlug: item.userSlug,
            }));
        },
        { keepPreviousData: true, staleTime: 0 }
    );

    const { photosOnPage, totalPages } = useMemo(() => {
        if (isLoading) {
            return {};
        }

        return {
            photosOnPage: photos.slice((currentPage - 1) * PHOTOS_PER_PAGE, currentPage * PHOTOS_PER_PAGE),
            totalPages: Math.ceil(photos.length / PHOTOS_PER_PAGE),
        };
    }, [photos, isLoading, currentPage]);

    if (isLoading) {
        return <Loader loading />;
    }

    return (
        <Card>
            {totalPages > 1 && (
                <div className="d-flex mb-4">
                    <Paginator total={totalPages} currentPage={currentPage} onPageChange={setCurrentPage} />
                </div>
            )}
            <RowsPhotoAlbum
                photos={photosOnPage}
                render={{
                    image: (imageProps, context) => (
                        <a
                            href={`https://${context.photo.citySlug}.tennis-ladder.com/player/${context.photo.userSlug}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Squircle cornerRadius={15}>
                                <img alt={context.photo.alt || ''} {...imageProps} draggable="false" />
                            </Squircle>
                        </a>
                    ),
                }}
                rowConstraints={{ singleRowMaxHeight: 350 }}
                targetRowHeight={150}
            />
        </Card>
    );
};

export default Photos;
