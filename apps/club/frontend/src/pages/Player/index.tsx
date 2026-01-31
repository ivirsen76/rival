import { Fragment } from 'react';
import { useQuery } from 'react-query';
import Loader from '@rival/common/components/Loader';
import Card from '@rival/common/components/Card';
import Modal from '@rival/common/components/Modal';
import Tooltip from '@rival/common/components/Tooltip';
import Header from '@/components/Header';
import Rivalry from './Rivalry';
import Photos from './Photos';
import LevelStat from './LevelStat';
import RecentBadges from './RecentBadges';
import ComplaintForm from './ComplaintForm';
import MessageForm from './MessageForm';
import Matches from './Matches';
import { Link } from 'react-router-dom';
import PhoneIcon from '@rival/common/metronic/icons/duotone/Interface/Phone.svg?react';
import EmailIcon from '@rival/common/metronic/icons/duotone/Communication/Mail-at.svg?react';
import AngryIcon from './angry.svg?react';
import EnvelopeIcon from '@rival/common/metronic/icons/duotone/Interface/Envelope.svg?react';
import MarkerIcon from '@rival/common/metronic/icons/duotune/general/gen018.svg?react';
import formatPhone from '@rival/common/utils/formatPhone';
import NotFound from '@/pages/NotFound';
import axios from '@rival/common/axios';
import {
    dominantHandOptions,
    forehandStyleOptions,
    backhandStyleOptions,
    playerTypeOptions,
    shotOptions,
} from '../Settings/TennisStyleForm';
import { useDispatch, useSelector } from 'react-redux';
import hasAnyRole from '@rival/common/utils/hasAnyRole';
import { formatCustom } from '@rival/common/dayjs';
import Emails from './Emails';
import PersonalNoteForm from './PersonalNoteForm';
import PlayerAvatar from '@rival/common/components/PlayerAvatar';
import PlayerName from '@rival/common/components/PlayerName';
import notification from '@rival/common/components/notification';
import { loadCurrentUser, incrementUserMessages } from '@/reducers/auth';
import Statbox from '@rival/common/components/Statbox';
import formatElo from '@rival/club.backend/src/utils/formatElo';
import Tlr from './Tlr';
import LastMatchesElo from './LastMatchesElo';
import useConfig from '@rival/common/utils/useConfig';
import formatNumber from '@rival/club.backend/src/utils/formatNumber';
import { Squircle } from 'corner-smoothing';
import useBreakpoints from '@rival/common/utils/useBreakpoints';
import style from './style.module.scss';

type PlayerProps = {
    match: object;
};

const Player = (props: PlayerProps) => {
    const slug = props.match.params.slug;

    const dispatch = useDispatch();
    const currentUser = useSelector((state) => state.auth.user);
    const config = useConfig();
    const isAdmin = hasAnyRole(currentUser, ['admin']);
    const size = useBreakpoints();
    const isSmall = ['xs', 'sm', 'md'].includes(size);

    const {
        data: user,
        isLoading,
        status,
        error,
    } = useQuery(
        `/api/users/${slug}`,
        async () => {
            const response = await axios.put('/api/users/0', { action: 'getUserInfo', slug });
            return response.data.data;
        },
        { staleTime: 0 }
    );

    if (isLoading) {
        return <Loader loading />;
    }

    if (status === 'error' && error.response.status === 404) {
        return <NotFound />;
    }

    const isUserDeleted = Boolean(user.deletedAt);

    const settings = [
        {
            code: 'tennisStyle',
            title: 'Tennis Style',
            list: [
                { value: 'dominantHand', label: 'Dominant hand:', options: dominantHandOptions },
                { value: 'forehandStyle', label: 'Forehand:', options: forehandStyleOptions },
                { value: 'backhandStyle', label: 'Backhand:', options: backhandStyleOptions },
                { value: 'playerType', label: 'Player style:', options: playerTypeOptions },
                { value: 'shot', label: 'Favorite shot:', options: shotOptions },
            ],
        },
        {
            code: 'tennisEquipment',
            title: 'Tennis Equipment',
            list: [
                { value: 'racquet', label: 'Racquet:' },
                { value: 'strings', label: 'Strings:' },
                { value: 'overgrip', label: 'Overgrip:' },
                { value: 'shoes', label: 'Shoes:' },
                { value: 'bag', label: 'Bag:' },
                { value: 'brand', label: 'Favorite brand:' },
                { value: 'balls', label: 'Favorite balls:' },
            ],
        },
        {
            code: 'additionalInfo',
            title: 'Additional Info',
            roles: ['superadmin'],
            list: [
                {
                    value: 'createdAt',
                    label: 'Registered at:',
                    getValue: (obj) => obj.createdAt && formatCustom(obj.createdAt, 'MM/DD/YYYY, h:mm A'),
                },
                {
                    value: 'loggedAt',
                    label: 'Last logged at:',
                    getValue: (obj) => obj.loggedAt && formatCustom(obj.loggedAt, 'MM/DD/YYYY, h:mm A'),
                },
                {
                    value: 'emails',
                    label: 'More:',
                    getValue: (obj) => (
                        <div className="d-flex flex-wrap" style={{ gap: '0.5rem' }}>
                            <Modal
                                title={
                                    <div>
                                        Recent emails for {obj.firstName} {obj.lastName}
                                    </div>
                                }
                                size="lg"
                                renderTrigger={({ show }) => (
                                    <button type="button" className="btn btn-primary btn-xs" onClick={show}>
                                        Emails
                                    </button>
                                )}
                                renderBody={() => <Emails user={obj} />}
                            />
                            {['player', 'partner'].includes(user.roles) && (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-xs"
                                    onClick={async () => {
                                        const result = await axios.put(`/api/utils/${obj.id}`, {
                                            action: 'loginAsPlayer',
                                        });
                                        localStorage.setItem('tokenLoginAs', result.data.accessToken);
                                        window.location.href = '/';
                                    }}
                                >
                                    Login as player
                                </button>
                            )}
                        </div>
                    ),
                },
            ],
        },
    ];

    const visibleSettings = settings
        .map((group) => ({
            ...group,
            list: group.list
                .map((item) => {
                    let userValue;
                    if (item.getValue) {
                        userValue = item.getValue(user);
                    } else if (item.options) {
                        const option = item.options.find((o) => o.value === user[item.value]);
                        if (option) {
                            userValue = option.label;
                        }
                    } else {
                        userValue = user[item.value];
                    }

                    return { ...item, userValue };
                })
                .filter((item) => item.userValue),
        }))
        .filter((group) => {
            if (group.list.length === 0) {
                return false;
            }
            if (group.roles && !hasAnyRole(currentUser, group.roles)) {
                return false;
            }
            return true;
        });

    const isContactsHidden = user.email.includes('*@*') || user.phone?.includes('XXX');

    const contactInformation = (
        <div className="d-grid gap-1">
            <div>
                <span className="svg-icon svg-icon-2 svg-icon-primary me-2">
                    <EmailIcon />
                </span>
                {isContactsHidden ? (
                    <span className="text-primary">{user.email}</span>
                ) : (
                    <a href={`mailto:${user.email}`}>{user.email}</a>
                )}
            </div>

            <div>
                <span className="svg-icon svg-icon-2 svg-icon-primary me-2">
                    <PhoneIcon />
                </span>
                {isContactsHidden ? (
                    <span className="text-primary">{user.phone}</span>
                ) : (
                    <a href={`sms:${user.phone}`}>{formatPhone(user.phone)}</a>
                )}
            </div>

            {isAdmin && user.zip && (
                <div>
                    <span className="svg-icon svg-icon-2 svg-icon-primary me-2">
                        <MarkerIcon />
                    </span>
                    <a href={`https://zipdatamaps.com/${user.zip}`} target="_blank" rel="noreferrer">
                        {user.zip}
                    </a>
                </div>
            )}
        </div>
    );

    if (isUserDeleted) {
        return (
            <Card className={style.deletedUser}>
                <div className={style.wrapper}>
                    <div>
                        <Squircle data-avatar className={style.avatar} cornerRadius={35}>
                            <PlayerAvatar player1={user} highQuality />
                        </Squircle>
                    </div>
                    <div>
                        <h3>
                            <PlayerName player1={user} />
                        </h3>
                        <div>The user is deleted.</div>
                    </div>
                </div>
            </Card>
        );
    }

    const renderTennisFrames = () => {
        if (user.photos.length === 0) {
            return null;
        }

        return (
            <Card>
                <h3>Tennis Frames</h3>
                <Photos photos={user.photos} user={user} />
            </Card>
        );
    };

    return (
        <div className="row">
            <Header
                title={`${user.firstName} ${user.lastName}'s Profile`}
                description={`Check out ${user.firstName} ${user.lastName}’s profile to learn more about their tennis style, equipment, match history, TLR, and rivalries.`}
            />
            <div className="col-lg-6 d-flex flex-column gap-6 mb-6">
                <Card>
                    <div className={style.wrapper}>
                        <div>
                            <Squircle data-avatar className={style.avatar} cornerRadius={35}>
                                <PlayerAvatar player1={user} highQuality />
                            </Squircle>
                        </div>
                        <div>
                            <h3>
                                {user.firstName} {user.lastName}
                            </h3>
                            {isContactsHidden ? (
                                <Tooltip
                                    content="Email and phone details are only visible for prospective and past match opponents."
                                    maxWidth={250}
                                >
                                    {contactInformation}
                                </Tooltip>
                            ) : (
                                contactInformation
                            )}
                            {user.age && (
                                <div className="mt-4">
                                    <div className="badge badge-secondary">{user.age} years old</div>
                                </div>
                            )}
                            {user.personalInfo ? (
                                <div className="mt-4" style={{ whiteSpace: 'pre-line' }}>
                                    {user.personalInfo}
                                </div>
                            ) : null}
                            {currentUser && currentUser.id === user.id && (
                                <Link to="/user/settings" className="btn btn-primary btn-sm mt-4">
                                    Edit my profile
                                </Link>
                            )}
                        </div>
                    </div>
                    {visibleSettings.map((group) => (
                        <Fragment key={group.code}>
                            <h3>{group.title}</h3>
                            <div className={style.settings}>
                                {group.list.map((item) => (
                                    <Fragment key={item.value}>
                                        <div>{item.label}</div>
                                        <div>{item.userValue}</div>
                                    </Fragment>
                                ))}
                            </div>
                        </Fragment>
                    ))}
                </Card>

                {isSmall && renderTennisFrames()}

                {currentUser && currentUser.id !== user.id && (
                    <Card>
                        <h3>My Notes About {user.firstName}</h3>
                        <PersonalNoteForm user={user} hideDescription={currentUser.enoughPersonalNotes} />

                        <h3>Actions</h3>
                        <div className={style.actions}>
                            <Modal
                                title={`Complain about ${user.firstName}`}
                                renderTrigger={({ show }) => (
                                    <button type="button" className="btn btn-secondary" onClick={show}>
                                        <i className="svg-icon svg-icon-2x">
                                            <AngryIcon />
                                        </i>
                                        Complain
                                    </button>
                                )}
                                renderBody={({ hide }) => (
                                    <ComplaintForm
                                        user={user}
                                        onSubmit={async (values) => {
                                            await axios.post('/api/complaints', values);
                                            await dispatch(loadCurrentUser());
                                            notification({
                                                header: 'Success',
                                                message: 'Your complaint was submitted successfully.',
                                            });
                                            hide();
                                        }}
                                    />
                                )}
                            />
                            <Modal
                                title={`Send Message to ${user.firstName}`}
                                renderTrigger={({ show }) => (
                                    <button type="button" className="btn btn-secondary" onClick={show}>
                                        <i className="svg-icon svg-icon-2x">
                                            <EnvelopeIcon />
                                        </i>
                                        Send message
                                    </button>
                                )}
                                renderBody={({ hide }) => (
                                    <MessageForm
                                        user={user}
                                        onSubmit={async (values) => {
                                            hide();
                                            notification({
                                                inModal: true,
                                                message: 'Your message has been sent successfully.',
                                            });
                                            dispatch(incrementUserMessages());
                                        }}
                                    />
                                )}
                            />
                        </div>
                    </Card>
                )}

                {user.stats.seasons > 0 && (
                    <Card>
                        <h3>Player Overview</h3>
                        <div className={style.achievements}>
                            <div className={style.column}>
                                <Statbox
                                    text={`${user.stats.seasons} season${user.stats.seasons === 1 ? '' : 's'}`}
                                    label={
                                        user.stats.seasons === 1
                                            ? user.stats.startSeason
                                            : `${user.stats.startSeason} - ${user.stats.endSeason}`
                                    }
                                    colorHue={202}
                                />
                                <Statbox
                                    text={
                                        user.stats.matches === 0 ? (
                                            '0 matches'
                                        ) : (
                                            <Modal
                                                title="Matches"
                                                hasForm={false}
                                                size="sm"
                                                renderTrigger={({ show }) => (
                                                    <div
                                                        onClick={show}
                                                        className={style.matchesLink}
                                                        data-all-matches-link
                                                    >
                                                        {formatNumber(user.stats.matches)} match
                                                        {user.stats.matches === 1 ? '' : 'es'}
                                                    </div>
                                                )}
                                                renderBody={() => <Matches user={user} />}
                                            />
                                        )
                                    }
                                    label={`${user.stats.won} - ${user.stats.lost}`}
                                    colorHue={0}
                                />
                            </div>
                            {user.stats.isEloEstablished ? (
                                <Statbox
                                    text={`TLR ${formatElo(user.stats.currentElo)}`}
                                    label={`Max: ${formatElo(user.stats.maxElo)}`}
                                    colorHue={295}
                                    image={
                                        user.stats.matches > config.minMatchesToEstablishTlr ? (
                                            <Tlr
                                                user={user}
                                                renderTrigger={({ show }) => (
                                                    <Squircle
                                                        className={style.graph}
                                                        onClick={show}
                                                        data-tlr-history
                                                        cornerRadius={10}
                                                    >
                                                        <div className={style.text}>
                                                            <div>TLR History</div>
                                                        </div>
                                                        <LastMatchesElo data={user.eloHistory} />
                                                    </Squircle>
                                                )}
                                            />
                                        ) : null
                                    }
                                />
                            ) : (
                                <Statbox
                                    text={<div className="mb-2 lh-sm">TLR not established</div>}
                                    label={`Must play ${config.minMatchesToEstablishTlr} Singles matches to establish TLR`}
                                    colorHue={202}
                                />
                            )}
                        </div>
                    </Card>
                )}

                {user.stat.length > 0 && (
                    <div className={style.levels}>
                        {user.stat.map((obj) => (
                            <Card key={obj.levelId}>
                                <LevelStat user={user} data={obj} />
                            </Card>
                        ))}
                    </div>
                )}
            </div>
            <div className="col-lg-6 d-flex flex-column gap-6">
                <Card>
                    <h3>Recent Badges</h3>
                    <RecentBadges user={user} />
                </Card>
                {!isSmall && renderTennisFrames()}
                <Card tooltip="To establish a rivalry you must play at least 3 matches with the same opponent.">
                    <h3>Rivalries</h3>
                    {user.rivalries.length === 0 ? (
                        <div>No rivalries yet.</div>
                    ) : (
                        <table className="table tl-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th colSpan={2}>Rival</th>
                                    <th className="text-center d-none d-lg-table-cell">Matches</th>
                                    <th className="text-center text-nowrap d-none d-lg-table-cell">Win-Loss</th>
                                    <th className="text-center d-table-cell d-lg-none">M</th>
                                    <th className="text-center text-nowrap d-table-cell d-lg-none">W - L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {user.rivalries.map((rivalry, index) => (
                                    <tr key={rivalry.opponentUserId}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <PlayerAvatar player1={rivalry.opponent} />
                                        </td>
                                        <td
                                            className="text-break ps-0"
                                            style={{
                                                width: '100%',
                                                paddingBottom: 0,
                                                ...(index > 0 ? { paddingTop: 0 } : {}),
                                            }}
                                        >
                                            <Modal
                                                title={
                                                    <div>
                                                        <span className="text-nowrap">
                                                            {user.firstName} {user.lastName}
                                                        </span>{' '}
                                                        vs{' '}
                                                        <span className="text-nowrap">
                                                            {rivalry.opponent.firstName} {rivalry.opponent.lastName}
                                                        </span>
                                                    </div>
                                                }
                                                hasForm={false}
                                                size="lg"
                                                renderTrigger={({ show }) => (
                                                    <a
                                                        href=""
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            show();
                                                        }}
                                                    >
                                                        <PlayerName player1={rivalry.opponent} />
                                                    </a>
                                                )}
                                                renderBody={({ hide }) => (
                                                    <Rivalry
                                                        user={{
                                                            firstName: user.firstName,
                                                            lastName: user.lastName,
                                                        }}
                                                        rivalry={rivalry}
                                                    />
                                                )}
                                            />
                                        </td>
                                        <td className="text-center">{rivalry.total}</td>
                                        <td className="text-center text-nowrap">
                                            {rivalry.won} - {rivalry.lost}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Player;
