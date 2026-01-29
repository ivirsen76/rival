import { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateCurrentUser } from '@/reducers/auth';
import Card from '@rival/packages/components/Card';
import Modal from '@/components/Modal';
import Tooltip from '@rival/packages/components/Tooltip';
import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerName from '@/components/PlayerName';
import TennisStyleForm, {
    dominantHandOptions,
    forehandStyleOptions,
    backhandStyleOptions,
    playerTypeOptions,
    shotOptions,
} from './TennisStyleForm';
import PasswordForm from './PasswordForm';
import EmailForm from './EmailForm';
import PhoneForm from './PhoneForm';
import TennisEquipmentForm from './TennisEquipmentForm';
import PersonalInfoForm, { genderOptions } from './PersonalInfoForm';
import SubscriptionsForm from './SubscriptionsForm';
import AvoidedPlayersForm from './AvoidedPlayersForm';
import CheckIcon from '@rival/packages/metronic/icons/duotone/Navigation/Check.svg?react';
import CloseIcon from '@rival/packages/metronic/icons/duotone/Navigation/Close.svg?react';
import WarningIcon from '@rival/packages/metronic/icons/duotone/Code/Warning-1-circle.svg?react';
import formatPhone from '@/utils/formatPhone';
import Header from '@/components/Header';
import HiddenText from '@/components/HiddenText';
import Copy from '@/components/Copy';
import { Redirect } from 'react-router-dom';
import loadable from '@/utils/loadable';
import classnames from 'classnames';
import lightImage from './light.png';
import darkImage from './dark.png';
import calendar1 from './calendar01.png';
import calendar2 from './calendar02.png';
import calendar3 from './calendar03.png';
import calendar4 from './calendar04.png';
import useBreakpoints from '@/utils/useBreakpoints';
import Photos from './Photos';
import log from '@/utils/log';
import compareFields from '@rival/ladder.backend/src/utils/compareFields';
import dayjs from '@/utils/dayjs';
import style from './style.module.scss';

const AvatarBuilder = loadable(() => import('@/components/AvatarBuilder'));

const arrToObj = (arr) =>
    arr.reduce((obj, item) => {
        obj[item.value] = item.label;
        return obj;
    }, {});

const appearanceOptions = [
    { value: 'light', label: 'Light', desktopImage: lightImage },
    { value: 'dark', label: 'Dark', desktopImage: darkImage },
];

const Settings = (props) => {
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();
    const size = useBreakpoints();

    const avoidedUsers = useMemo(() => {
        if (!user) {
            return [];
        }

        return Object.values(user.complainedUsers)
            .filter((item) => item.avoid)
            .sort(compareFields('firstName', 'lastName'));
    }, [user]);

    if (!user) {
        return <Redirect to={{ pathname: '/login', search: '?redirectAfterLogin=/user/settings' }} />;
    }

    const isSmall = ['xs', 'sm', 'md'].includes(size);
    const isWoman =
        Object.values(user.tournaments).some((t) => t.levelName.includes('Women')) || user.gender === 'female';
    const calendarUrl = `${window.location.origin}/api/calendars/${user.referralCode}`;

    const updateAppearance = async (value) => {
        await dispatch(updateCurrentUser({ appearance: value }, { optimisticUpdate: true }));
    };

    const renderCheckmark = (label, value) => {
        return value ? (
            <div className="d-flex align-items-center gap-1">
                <div className="svg-icon svg-icon-1 svg-icon-success">
                    <CheckIcon />
                </div>
                {label}
            </div>
        ) : (
            <div className="d-flex align-items-center gap-1">
                <div className="svg-icon svg-icon-1 svg-icon-danger">
                    <CloseIcon />
                </div>
                {label}
            </div>
        );
    };

    const calendar = (
        <Card>
            <h2>Apple Calendar</h2>
            <div data-calendar-area>
                <p>See your matches in Apple Calendar.</p>
                <HiddenText title="Instructions" contentClassName="mb-4">
                    <p>
                        By synchronizing Rival with Apple Calendar, all your matches will be visible in the calendar.
                        Any match updates will be available within 15 minutes.
                    </p>
                    <div className={style.steps}>
                        <div>
                            <div className="mb-2">
                                Open Apple Calendar and tap the <b>Calendars</b> button at the bottom.
                            </div>
                            <div className={style.image} style={{ backgroundImage: `url(${calendar1})` }} />
                        </div>
                        <div>
                            <div className="mb-2">
                                Tap <b>Add Calendar</b>, then tap <b>Add Subscription Calendar</b>.
                            </div>
                            <div className={style.image} style={{ backgroundImage: `url(${calendar2})` }} />
                        </div>
                        <div>
                            <div className="mb-2">
                                Paste your calendar link in the <b>Subscription URL</b> box and tap <b>Subscribe</b>.
                            </div>
                            <div className={style.image} style={{ backgroundImage: `url(${calendar3})` }} />
                        </div>
                        <div>
                            <div className="mb-2">
                                Add any name under <b>Title</b>, then tap <b>Add</b> at the top right.
                            </div>
                            <div className={style.image} style={{ backgroundImage: `url(${calendar4})` }} />
                        </div>
                    </div>
                </HiddenText>
                <HiddenText title="Warning for other calendars" className="mb-6">
                    <div>
                        <div>
                            Google Calendar (24 hours), Outlook (3 hours), and other calendar apps could take up to 24
                            hours to synchronize, meaning your calendar might not reflect your current matches. Use
                            these applications at your own risk.
                        </div>
                    </div>
                </HiddenText>

                <Copy
                    buttonLabel="Copy calendar link"
                    buttonClassName="btn btn-secondary w-100"
                    stringToCopy={calendarUrl}
                    onClick={() => {
                        log({ code: 'copyCalendarLink' });
                    }}
                />
            </div>
        </Card>
    );

    const avatar = (
        <Card className="d-flex flex-column align-items-center text-center">
            <div data-avatar className={`${style.avatar} mb-4`}>
                <PlayerAvatar player1={user} highQuality />
            </div>
            <Modal
                title="Edit avatar"
                hasForm={false}
                size="lg"
                renderTrigger={({ show }) => (
                    <button type="button" className="btn btn-primary" onClick={show}>
                        {user.avatar ? 'Edit avatar' : 'Create avatar'}
                    </button>
                )}
                renderBody={({ hide }) => (
                    <AvatarBuilder
                        initialValues={user.avatarObject ? JSON.parse(user.avatarObject) : {}}
                        onSubmit={async (values) => {
                            await dispatch(updateCurrentUser(values));
                            hide();
                        }}
                        onCancel={hide}
                        isWoman={isWoman}
                    />
                )}
            />
        </Card>
    );

    const personalInfo = (
        <Card>
            <div className="d-flex justify-content-between">
                <h2>Personal Info</h2>
                <div>
                    <Modal
                        title="Personal Info"
                        renderTrigger={({ show }) => (
                            <a
                                href=""
                                onClick={(e) => {
                                    e.preventDefault();
                                    show();
                                }}
                                data-edit-personal-info
                            >
                                Edit
                            </a>
                        )}
                        renderBody={({ hide }) => <PersonalInfoForm onSubmit={hide} />}
                    />
                </div>
            </div>
            <div className={style.settings + ' ' + style.compact} data-personal-info-area>
                <div>Name:</div>
                <div>{user.firstName + ' ' + user.lastName}</div>

                <div>Email:</div>
                <div className="text-truncate">
                    {user.email}
                    {user.isWrongEmail === 1 && (
                        <Tooltip
                            content={
                                <div className="text-center">
                                    Something is wrong with your email! Update your email to start getting messages.
                                </div>
                            }
                        >
                            <span className="svg-icon svg-icon-2 svg-icon-danger ms-1">
                                <WarningIcon />
                            </span>
                        </Tooltip>
                    )}
                </div>

                <div>Phone:</div>
                <div>{formatPhone(user.phone)}</div>

                <div>Gender:</div>
                <div>{user.gender ? arrToObj(genderOptions)[user.gender] : '-'}</div>

                <div>About me:</div>
                <div>{user.personalInfo || '-'}</div>

                <div>Birth date:</div>
                <div>{user.birthday ? dayjs(user.birthday).format('MMM D, YYYY') : '-'}</div>

                <div style={{ gridColumn: '1 / 3' }} className="mt-4">
                    <Modal
                        title="Change email"
                        renderTrigger={({ show }) => (
                            <div className="mb-2">
                                <button className="btn btn-secondary w-100" onClick={show}>
                                    Change email
                                </button>
                            </div>
                        )}
                        renderBody={({ hide }) => <EmailForm onSubmit={hide} />}
                    />
                    <Modal
                        title="Change Your Phone Number"
                        renderTrigger={({ show }) => (
                            <div className="mb-2">
                                <button className="btn btn-secondary w-100" onClick={show}>
                                    Change phone
                                </button>
                            </div>
                        )}
                        renderBody={({ hide }) => <PhoneForm onSubmit={hide} />}
                    />
                    <Modal
                        title="Change password"
                        renderTrigger={({ show }) => (
                            <button className="btn btn-secondary w-100" onClick={show}>
                                Change password
                            </button>
                        )}
                        renderBody={({ hide }) => <PasswordForm onSubmit={hide} />}
                    />
                </div>
            </div>
        </Card>
    );

    const tennisStyle = (
        <Card>
            <div className="d-flex justify-content-between">
                <h2>Tennis Style</h2>
                <div>
                    <Modal
                        title="Tennis style"
                        renderTrigger={({ show }) => (
                            <a
                                href=""
                                onClick={(e) => {
                                    e.preventDefault();
                                    show();
                                }}
                                data-edit-tennis-style
                            >
                                Edit
                            </a>
                        )}
                        renderBody={({ hide }) => <TennisStyleForm onSubmit={hide} />}
                    />
                </div>
            </div>
            <div className={style.settings} data-tennis-style-area>
                <div>Dominant hand:</div>
                <div>{arrToObj(dominantHandOptions)[user.dominantHand] || '-'}</div>

                <div>Forehand:</div>
                <div>{arrToObj(forehandStyleOptions)[user.forehandStyle] || '-'}</div>

                <div>Backhand:</div>
                <div>{arrToObj(backhandStyleOptions)[user.backhandStyle] || '-'}</div>

                <div>Player type:</div>
                <div>{arrToObj(playerTypeOptions)[user.playerType] || '-'}</div>

                <div>Favorite shot:</div>
                <div>{arrToObj(shotOptions)[user.shot] || '-'}</div>
            </div>
        </Card>
    );

    const tennisEquipment = (
        <Card>
            <div className="d-flex justify-content-between">
                <h2>Tennis Equipment</h2>
                <div>
                    <Modal
                        title="Tennis style"
                        renderTrigger={({ show }) => (
                            <a
                                href=""
                                onClick={(e) => {
                                    e.preventDefault();
                                    show();
                                }}
                                data-edit-tennis-equipment
                            >
                                Edit
                            </a>
                        )}
                        renderBody={({ hide }) => <TennisEquipmentForm onSubmit={hide} />}
                    />
                </div>
            </div>
            <div className={style.settings} data-tennis-equipment-area>
                <div>Racquet:</div>
                <div>{user.racquet || '-'}</div>

                <div>Strings:</div>
                <div>{user.strings || '-'}</div>

                <div>Overgrip:</div>
                <div>{user.overgrip || '-'}</div>

                <div>Shoes:</div>
                <div>{user.shoes || '-'}</div>

                <div>Bag:</div>
                <div>{user.bag || '-'}</div>

                <div>Favorite brand:</div>
                <div>{user.brand || '-'}</div>

                <div>Favorite balls:</div>
                <div>{user.balls || '-'}</div>
            </div>
        </Card>
    );

    const appearance = (
        <Card>
            <h2>Appearance</h2>
            <div data-appearance-area className={style.appearance}>
                {appearanceOptions.map((item) => (
                    <div
                        key={item.value}
                        className={classnames(style.appearanceOption, item.value === user.appearance && style.selected)}
                        onClick={() => updateAppearance(item.value)}
                        data-appearance={item.value}
                    >
                        <div className={style.imageWrapper}>
                            <img src={item.desktopImage} alt={item.label} />
                        </div>
                        {item.label}
                    </div>
                ))}
            </div>
        </Card>
    );

    const subscriptions = (
        <Card>
            <div className="d-flex justify-content-between">
                <h2>Subscriptions</h2>
                <div>
                    <Modal
                        title="Subscriptions"
                        renderTrigger={({ show }) => (
                            <a
                                href=""
                                onClick={(e) => {
                                    e.preventDefault();
                                    show();
                                }}
                                data-edit-subscriptions
                            >
                                Edit
                            </a>
                        )}
                        renderBody={({ hide }) => <SubscriptionsForm onSubmit={hide} />}
                        hasForm={false}
                    />
                </div>
            </div>
            <div data-subscriptions-area>
                {renderCheckmark('New proposals', user.subscribeForProposals)}
                {renderCheckmark('Reminders', user.subscribeForReminders)}
                {renderCheckmark('Ladder announcements', user.subscribeForNews)}
                {renderCheckmark('Badges updates', user.subscribeForBadges)}
            </div>
        </Card>
    );

    const avoidedPlayers = (
        <Card>
            <div className="d-flex justify-content-between">
                <h2>Avoided Players</h2>
                <div>
                    <Modal
                        title="Avoided Players"
                        renderTrigger={({ show }) => (
                            <a
                                href=""
                                onClick={(e) => {
                                    e.preventDefault();
                                    show();
                                }}
                                data-edit-avoided-players
                            >
                                Edit
                            </a>
                        )}
                        renderBody={({ hide }) => <AvoidedPlayersForm onSubmit={hide} />}
                        hasForm={false}
                    />
                </div>
            </div>
            <div data-avoided-users-area>
                {avoidedUsers.length > 0 ? (
                    <div className="d-grid gap-1">
                        {avoidedUsers.map((item) => (
                            <div key={item.id} className="d-flex gap-2 align-items-center">
                                <PlayerAvatar player1={item} /> <PlayerName player1={item} isLink />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>You are not avoiding any players.</div>
                )}
            </div>
        </Card>
    );

    const photos = <Photos />;

    return (
        <>
            <Header title="Settings" />
            <h2 className="text-white mt-4">Settings</h2>

            <div className={style.wrapper}>
                <div className={style.column}>
                    {avatar}
                    {personalInfo}
                    {!isSmall && calendar}
                </div>
                <div className={style.column}>
                    <div className={style.equalBlocks + ' align-items-stretch'}>
                        {tennisStyle}
                        {tennisEquipment}
                    </div>
                    {photos}
                    <div className={style.equalBlocks}>
                        <div className="d-grid gap-6">
                            {appearance}
                            {subscriptions}
                        </div>
                        {avoidedPlayers}
                    </div>
                    {isSmall && calendar}
                </div>
            </div>
        </>
    );
};

export default Settings;
