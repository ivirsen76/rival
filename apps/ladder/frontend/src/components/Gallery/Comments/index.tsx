import { useState, useMemo, useRef } from 'react';
import SendIcon from './send.svg?react';
import SmileIcon from './smile.svg?react';
import SmileNewIcon from './smileNew.svg?react';
import OtherIcon from '@rival/common/metronic/icons/duotone/General/Other2.svg?react';
import { Formik, Field, Form } from '@/components/formik';
import Textarea from '@/components/formik/Textarea';
import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerName from '@/components/PlayerName';
import EmojiString from '@/components/EmojiString';
import Loader from '@rival/common/components/Loader';
import Modal from '@/components/Modal';
import Tooltip from '@rival/common/components/Tooltip';
import Picker from '@emoji-mart/react';
import { Squircle } from 'corner-smoothing';
import timeAgo from '@/utils/timeAgo';
import dayjs, { formatCustom } from '@/utils/dayjs';
import { useSelector } from 'react-redux';
import { motion } from 'motion/react';
import EditCommentForm from '../EditCommentForm';
import ReportCommentForm from '../ReportCommentForm';
import classnames from 'classnames';
import useBreakpoints from '@rival/common/utils/useBreakpoints';
import useAppearance from '@/utils/useAppearance';
import useOutsideClick from '@rival/common/utils/useOutsideClick';
import style from './style.module.scss';

const formatDate = (date) => formatCustom(date, 'MMM\xa0D, YYYY, h:mm A');
const TIME_TO_DELETE_COMMENT = 3600;
const TENNIS_BALL_EMOJI_CODE = '1f3be';

const insertAtCursor = (input, textToInsert) => {
    input.focus();
    document.execCommand('insertText', false, textToInsert);
};

type CommentsProps = {
    slide: object;
    photo: object;
    reactions: unknown[];
    comments: unknown[];
    users: object;
    addReaction: (...args: unknown[]) => unknown;
    addComment: (...args: unknown[]) => unknown;
    deleteComment: (...args: unknown[]) => unknown;
    dragControls: object;
    emojiData: object;
};

const Comments = (props: CommentsProps) => {
    const {
        slide,
        photo,
        reactions,
        comments,
        users,
        addReaction,
        addComment,
        deleteComment,
        dragControls,
        emojiData,
    } = props;
    const tooltipRef = useRef();
    const currentUser = useSelector((state) => state.auth.user);
    const size = useBreakpoints();
    const appearance = useAppearance();
    const [showReactionEmoji, setShowReactionEmoji] = useState(false);
    const [showCommentEmoji, setShowCommentEmoji] = useState(false);
    const reactionEmojiRef = useOutsideClick(() => {
        setShowReactionEmoji(false);
    });
    const commentEmojiRef = useOutsideClick(() => {
        setShowCommentEmoji(false);
    });

    const isDarkTheme = appearance === 'dark';

    const noDeleteCommentTime = dayjs.tz().subtract(TIME_TO_DELETE_COMMENT, 'second').format('YYYY-MM-DD HH:mm:ss');
    const isSmall = ['xs', 'sm'].includes(size);

    const combinedReactions = useMemo(() => {
        const arr = [];
        const obj = {};
        reactions.forEach((item) => {
            if (!obj[item.code]) {
                obj[item.code] = {
                    code: item.code,
                    emoji:
                        item.code === TENNIS_BALL_EMOJI_CODE ? (
                            <div className={style.tennisBall} />
                        ) : (
                            <div className={style.emoji}>{String.fromCodePoint(parseInt(item.code, 16))}</div>
                        ),
                    users: [],
                    userIds: new Set(),
                };

                // put tennis ball first
                if (item.code === TENNIS_BALL_EMOJI_CODE) {
                    arr.unshift(obj[item.code]);
                } else {
                    arr.push(obj[item.code]);
                }
            }

            const user = users[item.userId];
            obj[item.code].users.push(`${user.firstName} ${user.lastName}`);
            obj[item.code].userIds.add(item.userId);
        });

        return arr;
    }, [reactions, users]);

    const isDisabled = !slide.meta.allowComments;

    const toggleShowReactionEmoji = (e) => {
        e.stopPropagation();
        setShowReactionEmoji((prev) => !prev);
        setShowCommentEmoji(false);
    };

    const toggleShowCommentEmoji = (e) => {
        e.stopPropagation();
        setShowCommentEmoji((prev) => !prev);
        setShowReactionEmoji(false);
    };

    if (!emojiData) {
        return <Loader loading />;
    }

    return (
        <div className={style.wrapper} data-photo-comments={slide.meta.id}>
            <div className={style.comments}>
                <div className={style.authorSection} onPointerDown={(e) => dragControls.start(e)}>
                    <div className={style.mobileHandle} />
                    <div className="d-flex gap-3">
                        <div className={style.avatar}>
                            <PlayerAvatar player1={slide.meta.author} />
                        </div>
                        <div className="flex-grow-1">
                            <div className="d-flex align-items-center justify-content-between">
                                <PlayerName player1={slide.meta.author} isLink />
                                <div className={style.date} title={formatDate(slide.meta.createdAt)}>
                                    {timeAgo(slide.meta.createdAt)}
                                </div>
                            </div>
                            <div className="mt-1">{photo.title || <>&nbsp;</>}</div>
                        </div>
                    </div>
                </div>
                <div className={style.reactions}>
                    {combinedReactions.map((item) => (
                        <Squircle
                            key={item.code}
                            className={classnames(
                                style.smile,
                                currentUser && style.clickable,
                                currentUser && item.userIds.has(currentUser.id) && style.clicked
                            )}
                            cornerRadius={12}
                            onClick={() => addReaction(item.code, true)}
                            data-reaction={item.code}
                        >
                            {item.emoji}
                            <div>{item.users.length}</div>
                        </Squircle>
                    ))}
                    {currentUser ? (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{
                                height: showReactionEmoji ? 'auto' : 0,
                                opacity: showReactionEmoji ? 1 : 0,
                            }}
                            className={style.emojiWrapper}
                            onFocus={(e) => e.stopPropagation()}
                            ref={reactionEmojiRef}
                        >
                            <Picker
                                data={emojiData}
                                previewPosition="none"
                                maxFrequentRows={1}
                                onEmojiSelect={(emoji) => {
                                    addReaction(emoji.unified);
                                    setShowReactionEmoji(false);
                                }}
                                theme={isDarkTheme ? 'dark' : 'light'}
                                perLine={8}
                            />
                        </motion.div>
                    ) : null}
                    <div className={style.addEmoji} onClick={toggleShowReactionEmoji}>
                        <SmileNewIcon />
                    </div>
                    <div className={style.heightHolder} />
                </div>
                <div className={style.list}>
                    {isDisabled && <div className="text-muted">Comments are disabled.</div>}
                    {!isDisabled && comments.length === 0 && <div className="text-muted">No comments here yet...</div>}
                    {!isDisabled &&
                        comments.map((item) => {
                            const user = users[item.userId];

                            const actions = [];
                            if (currentUser && currentUser.id === item.userId && item.createdAt > noDeleteCommentTime) {
                                actions.push(
                                    <Modal
                                        key="editComment"
                                        title="Edit Comment"
                                        renderTrigger={({ show }) => (
                                            <button className="btn btn-primary btn-sm" type="button" onClick={show}>
                                                Edit comment
                                            </button>
                                        )}
                                        renderBody={({ hide }) => (
                                            <EditCommentForm
                                                commentId={item.id}
                                                slide={slide}
                                                initialValues={{ message: item.message }}
                                                onSubmit={hide}
                                            />
                                        )}
                                    />
                                );
                                actions.push(
                                    <button
                                        key="deleteComment"
                                        className="btn btn-danger btn-sm"
                                        type="button"
                                        onClick={() => deleteComment(item.id)}
                                    >
                                        Delete comment
                                    </button>
                                );
                            }
                            if (currentUser && currentUser.id !== item.userId) {
                                actions.push(
                                    <Modal
                                        key="reportComment"
                                        title="Report Comment"
                                        renderTrigger={({ show }) => (
                                            <button className="btn btn-primary btn-sm" type="button" onClick={show}>
                                                Report
                                            </button>
                                        )}
                                        renderBody={({ hide }) => (
                                            <ReportCommentForm commentId={item.id} slide={slide} onSubmit={hide} />
                                        )}
                                    />
                                );
                            }

                            return (
                                <div key={item.id} className="d-flex gap-3">
                                    <div className={style.avatar}>
                                        <PlayerAvatar player1={user} />
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <PlayerName player1={user} isLink />
                                            <div className={style.date} title={formatDate(item.createdAt)}>
                                                {timeAgo(item.createdAt)}
                                            </div>
                                        </div>
                                        <div className="mt-1 d-flex align-items-start gap-3">
                                            <div className="flex-grow-1">
                                                <EmojiString str={item.message} />
                                            </div>
                                            {actions.length > 0 && (
                                                <Tooltip
                                                    interactive
                                                    placement="bottom-start"
                                                    trigger="click"
                                                    arrow={false}
                                                    offset={[0, 2]}
                                                    theme="light"
                                                    content={
                                                        <div
                                                            className="d-grid m-2"
                                                            style={{
                                                                gridGap: '0.5rem',
                                                                whiteSpace: 'normal',
                                                                maxWidth: '16rem',
                                                            }}
                                                            data-photo-comment-actions-content
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
                                                    <button
                                                        type="button"
                                                        className="btn btn-link btn-color-muted btn-active-color-primary p-0"
                                                        data-comment-actions={item.id}
                                                    >
                                                        <span className="svg-icon svg-icon-2">
                                                            <OtherIcon />
                                                        </span>
                                                    </button>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
                {!isDisabled && currentUser ? (
                    <div className={style.form}>
                        <Formik initialValues={{ message: '' }} onSubmit={addComment}>
                            {({ values, handleSubmit }) => (
                                <Form noValidate>
                                    <div className="d-flex align-items-end gap-4">
                                        {!isSmall && (
                                            <>
                                                <motion.div
                                                    className={style.emojiWrapper}
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{
                                                        height: showCommentEmoji ? 'auto' : 0,
                                                        opacity: showCommentEmoji ? 1 : 0,
                                                    }}
                                                    onFocus={(e) => e.stopPropagation()}
                                                    ref={commentEmojiRef}
                                                >
                                                    <Picker
                                                        data={emojiData}
                                                        previewPosition="none"
                                                        maxFrequentRows={1}
                                                        onEmojiSelect={(emoji) => {
                                                            const field = document.getElementById('messageWithEmoji');
                                                            if (field) {
                                                                insertAtCursor(field, emoji.native);
                                                            }
                                                            setShowCommentEmoji(false);
                                                        }}
                                                        theme={isDarkTheme ? 'dark' : 'light'}
                                                        perLine={8}
                                                    />
                                                </motion.div>
                                                <span className={style.smileIcon} onClick={toggleShowCommentEmoji}>
                                                    <SmileIcon />
                                                </span>
                                            </>
                                        )}
                                        <div className="flex-grow-1">
                                            <Field
                                                name="message"
                                                label=""
                                                component={Textarea}
                                                placeholder="Add a comment..."
                                                wrapperClassName=""
                                                rows="1"
                                                id="messageWithEmoji"
                                                onFocus={(e) => e.stopPropagation()}
                                                onKeyDown={(e) => {
                                                    if (e.which === 13) {
                                                        e.preventDefault();
                                                        handleSubmit();
                                                    } else {
                                                        e.stopPropagation();
                                                    }
                                                }}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className={classnames(style.sendIcon, values.message && style.active)}
                                            data-send-comment-button
                                        >
                                            <SendIcon />
                                        </button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Comments;
