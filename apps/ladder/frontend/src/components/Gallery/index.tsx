/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { Squircle } from 'corner-smoothing';
import RenderInBody from '@/components/RenderInBody';
import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerName from '@/components/PlayerName';
import { RowsPhotoAlbum } from 'react-photo-album';
import CloseIcon from './close.svg?react';
import LeftIcon from './leftArrow.svg?react';
import RightIcon from './rightArrow.svg?react';
import CommentIcon from './comment.svg?react';
import OtherIcon from '@/styles/metronic/icons/duotone/General/Other2.svg?react';
import { useQuery, useQueryClient } from 'react-query';
import Comments from './Comments';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentUser } from '@/reducers/auth';
import classnames from 'classnames';
import timeAgo from '@/utils/timeAgo';
import { formatCustom } from '@/utils/dayjs';
import EditPhotoForm from './EditPhotoForm';
import Modal from '@/components/Modal';
import Tooltip from '@/components/Tooltip';
import Paginator from '@/components/Paginator';
import axios from '@/utils/axios';
import useBreakpoints from '@/utils/useBreakpoints';
import { motion, useDragControls } from 'motion/react';
import confirmation from '@/utils/confirmation';
import useBodyLock from '@/utils/useBodyLock';
import useHideRegisterButton from '@/utils/useHideRegisterButton';
import showLoader from '@/utils/showLoader';
import { Gallery as PhotoswipeGallery, Item } from 'react-photoswipe-gallery';
import 'react-photo-album/rows.css';
import 'photoswipe/style.css';
import useEmojiData from './useEmojiData';
import useConfig from '@/utils/useConfig';
import notification from '@/components/notification';
import style from './style.module.scss';

const formatDate = (date) => formatCustom(date, 'MMM\xa0D, YYYY, h:mm A');

let commentIdCounter = 90000;
let reactionIdCounter = 90000;
const TENNIS_BALL_EMOJI_CODE = '1f3be';
const REM_SIZE = 14;

type GalleryProps = {
    photos: unknown[];
    albumProps: object;
    onPhotoDelete: (...args: unknown[]) => unknown;
};

const Gallery = (props: GalleryProps) => {
    const { photos, albumProps, onPhotoDelete } = props;
    const lightboxInstance = useRef();
    const settings = useRef({ showComments: false });
    const [isOpen, setIsOpen] = useState(false);
    const [isToolbarOpen, setIsToolbarOpen] = useState(false);
    const tooltipRef = useRef();
    const queryClient = useQueryClient();
    const [showComments, setShowComments] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [currentPage, setCurrentPage] = useState(1);
    const currentUser = useSelector((state) => state.auth.user);
    const size = useBreakpoints();
    const commentsDragControls = useDragControls();
    const emojiData = useEmojiData();
    const config = useConfig();
    const dispatch = useDispatch();
    useBodyLock(isOpen);
    useHideRegisterButton(isOpen);

    const isSmall = ['xs', 'sm'].includes(size);

    const { approvedPhotos, underReviewPhotos, totalPages } = useMemo(() => {
        if (!photos) {
            return [[], []];
        }

        const getAttributes = (item) => ({
            key: item.id,
            src: item.url400,
            srcSet: [400, 800, 1200].map((width) => ({
                src: item[`url${width}`],
                width,
                height: Math.round((width / item.width) * item.height),
            })),
            width: 400,
            height: Math.round((400 / item.width) * item.height),
            alt: item.title || '',
            lightbox: {
                id: item.id,
                original: item.url2400,
                originalSrcset: item.srcset,
                thumbnail: item.url400,
                width: item.width,
                height: item.height,
            },
            meta: {
                id: item.id,
                author: item.author,
                createdAt: item.createdAt,
                userId: item.userId,
                allowComments: item.allowComments,
            },
        });

        const approved = photos.filter((item) => item.isApproved);

        return {
            approvedPhotos: approved
                .slice((currentPage - 1) * config.photosPerPage, currentPage * config.photosPerPage)
                .map(getAttributes),
            underReviewPhotos: photos.filter((item) => !item.isApproved).map(getAttributes),
            totalPages: Math.ceil(approved.length / config.photosPerPage),
        };
    }, [photos, currentPage, config]);

    const onBeforeOpen = useCallback((instance) => {
        lightboxInstance.current = instance;
        setIsOpen(true);

        instance.on('close', () => {
            lightboxInstance.current = null;
            setIsToolbarOpen(false);
            setIsOpen(false);

            if (isSmall) {
                setShowComments(false);
            }
        });
        instance.on('openingAnimationEnd', () => {
            setIsToolbarOpen(true);
        });
        instance.on('change', () => {
            if (lightboxInstance.current) {
                setCurrentIndex(lightboxInstance.current.currIndex);
            }
        });
    }, []);

    const galleryOptions = {
        imageClickAction: 'close',
        tapAction: 'close',
        doubleTapAction: false,
        bgOpacity: 1,
        loop: false,
        paddingFn: (viewportSize) => {
            const scrollbarSize = window.innerWidth - viewportSize.x;

            return {
                top: REM_SIZE * 5,
                bottom: isSmall ? REM_SIZE * 3.4 : REM_SIZE,
                left: isSmall ? 0 : REM_SIZE,
                right: isSmall
                    ? 0
                    : settings.current.showComments
                      ? REM_SIZE * 27 - scrollbarSize
                      : REM_SIZE - scrollbarSize,
            };
        },
    };

    const currentSlide = approvedPhotos[currentIndex];

    useEffect(() => {
        if (!currentSlide) {
            return;
        }
        if (!currentSlide.meta.userId) {
            return;
        }
        if (!currentUser) {
            return;
        }
        if (currentUser && currentSlide.meta.userId === currentUser.id) {
            return;
        }
        if (!isOpen) {
            return;
        }

        const timeout = setTimeout(() => {
            axios.put(`/api/photos/${currentSlide.meta.id}`, { action: 'addView' });
        }, config.timeToViewPhoto);

        return () => {
            clearTimeout(timeout);
        };
    }, [currentUser, currentSlide, isOpen]);

    const { data } = useQuery({
        queryKey: `getReactionsAndComments${currentSlide ? currentSlide.meta.id : ''}`,
        queryFn: async () => {
            const response = await axios.put(`/api/photos/${currentSlide.meta.id}`, {
                action: 'getReactionsAndComments',
            });

            return {
                photo: response.data.data.photo,
                reactions: response.data.data.reactions,
                comments: response.data.data.comments,
                users: response.data.data.users,
            };
        },
        enabled: Boolean(currentSlide),
        initialData: {
            photo: {},
            reactions: [],
            comments: [],
            users: {},
        },
        staleTime: 0,
        keepPreviousData: true,
    });

    const { photo, reactions, comments, users } = data;

    const addComment = async (values, { resetForm }) => {
        if (!values.message.trim()) {
            return;
        }

        if (currentUser.totalCommentsToday >= config.maxCommentsPerDay) {
            notification({
                type: 'danger',
                header: 'Error',
                message: `You have reached the max ${config.maxCommentsPerDay} comments today.`,
            });
            return;
        }

        resetForm();

        const queryKey = `getReactionsAndComments${currentSlide.meta.id}`;

        // optimistic update
        queryClient.setQueryData(queryKey, (prev) => {
            return {
                ...prev,
                comments: [
                    ...prev.comments,
                    {
                        id: commentIdCounter++,
                        userId: currentUser.id,
                        message: values.message,
                        createdAt: 0,
                    },
                ],
                users: {
                    ...prev.users,
                    [currentUser.id]: currentUser,
                },
            };
        });

        // increase total comments today
        await dispatch(setCurrentUser({ user: { totalCommentsToday: currentUser.totalCommentsToday + 1 } }));

        // allow react to render new item in the list
        await new Promise((resolve) => setTimeout(resolve, 0));

        // TODO: scroll to the last comment

        await axios.post('/api/comments', { ...values, photoId: currentSlide.meta.id });
        await queryClient.invalidateQueries(queryKey);
    };

    const deleteComment = async (id) => {
        const queryKey = `getReactionsAndComments${currentSlide.meta.id}`;

        // optimistic update
        queryClient.setQueryData(queryKey, (prev) => {
            return {
                ...prev,
                comments: prev.comments.filter((item) => item.id !== id),
            };
        });

        await axios.delete(`/api/comments/${id}`);
        await queryClient.invalidateQueries(queryKey);
    };

    const addReaction = async (code, isToggle = false) => {
        if (!currentUser) {
            return;
        }

        const queryKey = `getReactionsAndComments${currentSlide.meta.id}`;

        const sameReaction = reactions.find((item) => item.userId === currentUser.id && item.code === code);
        if (!isToggle && sameReaction) {
            return;
        }

        // optimistic update
        queryClient.setQueryData(queryKey, (prev) => {
            return {
                ...prev,
                reactions: sameReaction
                    ? prev.reactions.filter((item) => item.id !== sameReaction.id)
                    : [...prev.reactions, { id: reactionIdCounter++, code, userId: currentUser.id }],
                users: {
                    ...prev.users,
                    [currentUser.id]: currentUser,
                },
            };
        });

        await axios.post('/api/reactions', { code, photoId: currentSlide.meta.id });
        await queryClient.invalidateQueries(queryKey);
    };

    const toggleComments = (e) => {
        e?.preventDefault();
        const newValue = !showComments;
        settings.current.showComments = newValue;
        setShowComments(newValue);

        const { currIndex } = lightboxInstance.current;

        lightboxInstance.current.currSlide.resize();
        lightboxInstance.current.refreshSlideContent(currIndex - 1);
        lightboxInstance.current.refreshSlideContent(currIndex + 1);
    };

    const toggleLike = (e) => {
        e.preventDefault();
        addReaction(TENNIS_BALL_EMOJI_CODE, true);
    };

    const closeLightbox = (e) => {
        e?.preventDefault();

        if (lightboxInstance.current) {
            lightboxInstance.current.close();
        }
    };

    const goNext = (e) => {
        e.preventDefault();

        if (lightboxInstance.current) {
            lightboxInstance.current.next();
        }
    };

    const goPrev = (e) => {
        e.preventDefault();

        if (lightboxInstance.current) {
            lightboxInstance.current.prev();
        }
    };

    const deletePhoto = async (photoId) => {
        const confirm = await confirmation({
            message: (
                <div>
                    You are about to delete the photo.
                    <br />
                    Are you sure?
                </div>
            ),
        });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.delete(`/api/photos/${photoId}`);
            closeLightbox();
            await onPhotoDelete();
        });
    };

    const isClicked =
        currentUser && reactions.some((item) => item.code === TENNIS_BALL_EMOJI_CODE && item.userId === currentUser.id);
    const isAuthor = currentUser && currentUser.id === currentSlide?.meta?.author?.id;

    const actions = [];
    if (isAuthor) {
        if (onPhotoDelete) {
            actions.push(
                <button
                    key="deletePhoto"
                    className="btn btn-danger btn-sm"
                    type="button"
                    onClick={() => deletePhoto(currentSlide.meta.id)}
                >
                    Delete photo
                </button>
            );
        }
    }

    return (
        <>
            {isToolbarOpen && currentSlide && (
                <RenderInBody>
                    <div data-photo-info={currentSlide.meta.id}>
                        <div className={style.header}>
                            <div className={style.author}>
                                <div className={style.avatar}>
                                    <PlayerAvatar player1={currentSlide.meta.author} />
                                </div>
                                <div className="text-nowrap">
                                    <div>
                                        <PlayerName player1={currentSlide.meta.author} isLink />
                                    </div>
                                    <div
                                        className={'text-muted ' + style.date}
                                        title={formatDate(currentSlide.meta.createdAt)}
                                    >
                                        {timeAgo(currentSlide.meta.createdAt)}
                                    </div>
                                </div>
                                <LeftIcon />
                            </div>
                            <div className={style.title}>
                                {isAuthor ? (
                                    <Modal
                                        key={currentSlide.meta.id}
                                        title="Update Description"
                                        renderTrigger={({ show }) =>
                                            photo.title ? (
                                                <span onClick={show}>{photo.title}</span>
                                            ) : (
                                                <a
                                                    href=""
                                                    className="ms-2 me-2 pt-2 pb-2"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        show();
                                                    }}
                                                >
                                                    Add description
                                                </a>
                                            )
                                        }
                                        renderBody={({ hide }) => (
                                            <EditPhotoForm
                                                slide={currentSlide}
                                                initialValues={{ title: photo.title || '' }}
                                                onSubmit={hide}
                                            />
                                        )}
                                    />
                                ) : (
                                    photo.title
                                )}
                            </div>
                            <div className={style.toolbar}>
                                {actions.length > 0 && (
                                    <Tooltip
                                        interactive
                                        placement="bottom-start"
                                        trigger="click"
                                        arrow={false}
                                        offset={[0, 5]}
                                        theme="light"
                                        content={
                                            <div
                                                className="d-grid m-2"
                                                style={{
                                                    gridGap: '0.5rem',
                                                    whiteSpace: 'normal',
                                                    maxWidth: '16rem',
                                                }}
                                                data-photo-actions-content
                                                onClick={() => {
                                                    tooltipRef.current && tooltipRef.current.hide();
                                                }}
                                            >
                                                {actions}
                                            </div>
                                        }
                                        onShow={(instance) => {
                                            tooltipRef.current = instance;
                                        }}
                                    >
                                        <div className={classnames(style.action)} data-action-other>
                                            <span className={style.more}>
                                                <OtherIcon />
                                            </span>
                                        </div>
                                    </Tooltip>
                                )}

                                <div
                                    className={classnames(style.action, style.like, isClicked && style.clicked)}
                                    onClick={toggleLike}
                                    data-action-reaction
                                >
                                    {reactions.length > 0 && <div className={style.badge}>{reactions.length}</div>}
                                    <span className={style.tennisBall} />
                                </div>
                                <div
                                    className={classnames(style.action, style.comments, showComments && style.clicked)}
                                    onClick={toggleComments}
                                    data-action-comments
                                >
                                    {comments.length > 0 && <div className={style.badge}>{comments.length}</div>}
                                    <CommentIcon />
                                </div>
                                <div className={style.action} onClick={closeLightbox} data-action-close>
                                    <CloseIcon />
                                </div>
                            </div>
                        </div>

                        <div className={classnames(style.action, style.prev)} onClick={goPrev} data-action-prev>
                            <LeftIcon />
                        </div>
                        <div
                            className={classnames(style.action, style.next, showComments && style.withComments)}
                            onClick={goNext}
                            data-action-next
                        >
                            <RightIcon />
                        </div>
                        <motion.div
                            drag={isSmall ? 'y' : null}
                            dragListener={false}
                            dragConstraints={{ top: 0, bottom: 0 }}
                            onDragEnd={(event, info) => {
                                if (info.offset.y > 100) {
                                    toggleComments();
                                }
                            }}
                            dragControls={commentsDragControls}
                            dragElastic={{ top: 0, bottom: 0.5 }}
                            className={classnames(style.sidebar, !showComments && style.hidden)}
                        >
                            {currentSlide ? (
                                <Comments
                                    slide={currentSlide}
                                    photo={photo}
                                    reactions={reactions}
                                    comments={comments}
                                    users={users}
                                    addReaction={addReaction}
                                    addComment={addComment}
                                    deleteComment={deleteComment}
                                    dragControls={commentsDragControls}
                                    emojiData={emojiData}
                                />
                            ) : null}
                        </motion.div>
                    </div>
                </RenderInBody>
            )}
            {approvedPhotos.length > 0 && (
                <PhotoswipeGallery options={galleryOptions} onBeforeOpen={onBeforeOpen}>
                    <RowsPhotoAlbum
                        photos={approvedPhotos}
                        render={{
                            image: (imageProps, context) => (
                                <Item {...context.photo.lightbox}>
                                    {({ ref, open }) => (
                                        <Squircle cornerRadius={15}>
                                            <img
                                                alt={context.photo.alt || ''}
                                                {...imageProps}
                                                ref={ref}
                                                onClick={open}
                                                draggable="false"
                                                data-photo-id={context.photo.key}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </Squircle>
                                    )}
                                </Item>
                            ),
                        }}
                        rowConstraints={{ singleRowMaxHeight: 450 }}
                        {...albumProps}
                    />
                </PhotoswipeGallery>
            )}
            {totalPages > 1 && (
                <div className="d-flex mt-4">
                    <Paginator total={totalPages} currentPage={currentPage} onPageChange={setCurrentPage} />
                </div>
            )}
            {underReviewPhotos.length > 0 && (
                <div className="mt-8 mb-8">
                    <h2 className="mb-2">Photos Under Review</h2>
                    <p className="text-muted">
                        We are reviewing these photos. They will be visible in a few hours if they pass review.
                    </p>
                    <RowsPhotoAlbum
                        photos={underReviewPhotos}
                        render={{
                            image: (imageProps, context) => (
                                <Squircle cornerRadius={15}>
                                    <img
                                        alt={context.photo.alt || ''}
                                        {...imageProps}
                                        draggable="false"
                                        data-photo-id={context.photo.key}
                                    />
                                </Squircle>
                            ),
                        }}
                        rowConstraints={{ singleRowMaxHeight: 450 }}
                        {...albumProps}
                    />
                </div>
            )}
        </>
    );
};

export default Gallery;
