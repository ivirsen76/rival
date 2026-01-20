/* eslint-disable react/prop-types */
import { Fragment } from 'react';
import style from './style.module.scss';
import InlineMatch from '@/components/InlineMatch';
import PlayerAvatar from '@/components/PlayerAvatar';
import Modal from '@/components/Modal';
import { Title } from '@/components/Statbox';
import dayjs, { formatDate } from '@/utils/dayjs';
import ChartIcon from '@rival/packages/metronic/icons/duotone/Shopping/Chart-bar1.svg?react';
import classnames from 'classnames';
import { Link } from 'react-router-dom';
import PieChart from './PieChart';
import Stats from '@/components/Match/Stats';
import _capitalize from 'lodash/capitalize';
import formatElo from '@rival/ladder.backend/src/utils/formatElo';

const colors = {
    spring: '#adcc42',
    summer: '#f8902e',
    fall: '#d83a23',
    winter: '#6fbce9',
};

const getPeriodByWeekNumber = num => {
    const year = Math.floor(num / 10000);
    const month = Math.floor((num % 10000) / 100);
    const day = Math.floor(num % 100);

    const mon = dayjs(`${year}-${month}-${day} 12:00:00`).isoWeekday(1).format('MMM\xa0D, YYYY');

    return `Week of ${mon}`;
};

const showMatches =
    () =>
    ({ state, opponents }) => {
        if (state.payload.matches.length === 0) {
            return null;
        }

        const getList = list =>
            list.map(match => (
                <InlineMatch
                    key={match.id}
                    match={match}
                    challenger={opponents[match.challengerUserId]}
                    acceptor={opponents[match.acceptorUserId]}
                    challenger2={opponents[match.challenger2UserId]}
                    acceptor2={opponents[match.acceptor2UserId]}
                    customDateFormat={formatDate}
                    extraColumn={match.extraColumn}
                />
            ));

        const hasExtraColumn = state.payload.matches.some(match => match.extraColumn);

        return (
            <div className={classnames(style.inlineMatches, hasExtraColumn && style.extraColumn)}>
                {getList(state.payload.matches)}
            </div>
        );
    };

export default {
    feedback: ({ state, opponents, isMyself }) => {
        if (isMyself && !state.completed) {
            return (
                <div>
                    Click the <b>Support</b> button at the bottom of any page, and send in your feedback to get this
                    badge!
                </div>
            );
        }
    },
    davidGoliath: showMatches(),
    twoTiebreaks: showMatches(),
    doubleBagel: showMatches(),
    comebackKid: showMatches(),
    matchesPlayed: showMatches(),
    matchesWon: showMatches(),
    tiebreaker: showMatches(),
    fury: showMatches(),
    takeItToLimit: ({ state, opponents }) => {
        if (state.payload.matches.length === 0 && state.payload.close.length === 0) {
            return null;
        }

        return (
            <>
                {state.payload.matches.length > 0 && (
                    <>
                        <Title>Related Matches</Title>
                        <div className={style.inlineMatches}>
                            {state.payload.matches.map(match => (
                                <InlineMatch
                                    key={match.id}
                                    match={match}
                                    challenger={opponents[match.challengerUserId]}
                                    acceptor={opponents[match.acceptorUserId]}
                                    customDateFormat={formatDate}
                                />
                            ))}
                        </div>
                    </>
                )}

                {state.payload.close.length > 0 && (
                    <>
                        <Title className={classnames(state.payload.matches.length > 0 && 'mt-8')}>So Close!</Title>
                        <div className={style.inlineMatches}>
                            {state.payload.close.map(match => (
                                <InlineMatch
                                    key={match.id}
                                    match={match}
                                    challenger={opponents[match.challengerUserId]}
                                    acceptor={opponents[match.acceptorUserId]}
                                    customDateFormat={formatDate}
                                />
                            ))}
                        </div>
                    </>
                )}
            </>
        );
    },
    rivalries: ({ state, opponents }) => {
        if (state.payload.recent.length === 0 && state.payload.candidates.length === 0) {
            return null;
        }

        return (
            <>
                {state.payload.recent.length > 0 && (
                    <>
                        <Title className="mb-2">Latest Rivalries</Title>
                        <div className={style.latestRivalries}>
                            {state.payload.recent.map(item => {
                                const opponent = opponents[item.opponentUserId];
                                return (
                                    <Fragment key={item.date}>
                                        <div>{formatDate(item.date)}</div>
                                        <div>-</div>
                                        <div className="me-n2">
                                            <PlayerAvatar player1={opponent} />
                                        </div>
                                        <div className="fw-bold">
                                            {opponent.firstName} {opponent.lastName}
                                        </div>
                                    </Fragment>
                                );
                            })}
                        </div>
                    </>
                )}

                {state.payload.candidates.length > 0 && (
                    <>
                        <Title className={classnames('mb-2', state.payload.recent.length > 0 && 'mt-8')}>
                            Candidates
                        </Title>
                        <div className="text-center">
                            Just one match away to estabslish a new rivalry with these players:
                        </div>
                        <div className={'mt-2 ' + style.rivalryCandidates}>
                            {state.payload.candidates.map(userId => {
                                const opponent = opponents[userId];
                                return (
                                    <Fragment key={userId}>
                                        <div className="me-n2">
                                            <PlayerAvatar player1={opponent} />
                                        </div>
                                        <div key={userId} className="m-0 fw-bold">
                                            {opponent.firstName} {opponent.lastName}
                                        </div>
                                    </Fragment>
                                );
                            })}
                        </div>
                    </>
                )}
            </>
        );
    },
    tlrGain: ({ state }) => {
        const { startingTlr, levels } = state.payload;

        if (!startingTlr) {
            return (
                <div className="text-center">
                    TLR isn&apos;t established.
                    <br />
                    Must play 10 singles matches to establish TLR.
                </div>
            );
        }

        return (
            <>
                <Title className="mb-2">Levels</Title>
                <div className={style.tlrLevels}>
                    <div>Initial TLR</div>
                    <div>-</div>
                    <div className="fw-bold">{formatElo(startingTlr)}</div>
                    {levels.map(level => (
                        <Fragment key={level}>
                            <div>+{formatElo(level)}</div>
                            <div>-</div>
                            <div className="fw-bold">{formatElo(startingTlr + level)}</div>
                        </Fragment>
                    ))}
                </div>
            </>
        );
    },
    revenge: ({ state, opponents }) => {
        const candidates = Object.values(state.payload.candidates).sort((a, b) => b.lostMatches - a.lostMatches);

        if (candidates.length === 0 && state.payload.players.length === 0) {
            return null;
        }

        return (
            <>
                {state.payload.players.length > 0 && (
                    <>
                        <Title className="mb-2">Revenge Matches</Title>
                        <div className={classnames(style.inlineMatches, style.extraColumn)}>
                            {state.payload.players.map(item => {
                                const { match, lostBefore } = item;

                                return (
                                    <InlineMatch
                                        key={match.id}
                                        match={match}
                                        challenger={opponents[match.challengerUserId]}
                                        acceptor={opponents[match.acceptorUserId]}
                                        customDateFormat={formatDate}
                                        extraColumn={`Lost ${lostBefore} matches before`}
                                    />
                                );
                            })}
                        </div>
                    </>
                )}

                {candidates.length > 0 && (
                    <>
                        <Title className="mt-8 mb-2">Candidates</Title>
                        <div className="text-center">A losing streak of five or more matches to these players:</div>
                        <div className={'mt-2 ' + style.revengeCandidates}>
                            {candidates.map(item => {
                                const opponent = opponents[item.opponentUserId];
                                return (
                                    <Fragment key={item.opponentUserId}>
                                        <div className="me-n2">
                                            <PlayerAvatar player1={opponent} />
                                        </div>
                                        <div className="fw-bold">
                                            {opponent.firstName} {opponent.lastName}
                                        </div>
                                        <div>-</div>
                                        <div>{item.lostMatches} matches</div>
                                    </Fragment>
                                );
                            })}
                        </div>
                    </>
                )}
            </>
        );
    },
    avatar: ({ state, opponents, isMyself }) => {
        return (
            isMyself &&
            !state.completed && (
                <div>
                    Go to your <Link to="/user/settings">Profile Settings</Link> and press <b>Create avatar</b> to build
                    your avatar to earn this badge!
                </div>
            )
        );
    },
    profile: ({ state, opponents, isMyself }) => {
        return (
            isMyself &&
            !state.completed && (
                <div>
                    Go to your <Link to="/user/settings">Profile Settings</Link> and fill out your About, Tennis Style,
                    and Tennis Equipment sections to earn this badge!
                </div>
            )
        );
    },
    statistician: ({ state, opponents, isMyself }) => {
        if (isMyself && !state.completed) {
            return (
                <div>
                    Track your match using the{' '}
                    <a href="https://swing.tennis" target="_blank" rel="noreferrer">
                        SwingVision
                    </a>{' '}
                    software. Then, report the match and upload your statistics.
                </div>
            );
        }

        if (state.payload.matches.length === 0) {
            return null;
        }

        return (
            <div className={classnames(style.inlineMatches, style.extraColumn)}>
                {state.payload.matches.map(match => {
                    const challenger = opponents[match.challengerUserId];
                    const acceptor = opponents[match.acceptorUserId];
                    const matchStat = (
                        <Modal
                            title="Match statistics"
                            size="xl"
                            hasForm={false}
                            renderTrigger={({ show }) => (
                                <a
                                    href="#"
                                    className="btn btn-link btn-active-icon-primary p-0"
                                    onClick={async e => {
                                        e.preventDefault();
                                        show();
                                    }}
                                >
                                    <span className="svg-icon svg-icon-3">
                                        <ChartIcon />
                                    </span>
                                </a>
                            )}
                            renderBody={({ hide }) => (
                                <Stats match={match} challenger={challenger} acceptor={acceptor} />
                            )}
                        />
                    );

                    return (
                        <InlineMatch
                            key={match.id}
                            match={match}
                            challenger={challenger}
                            acceptor={acceptor}
                            customDateFormat={formatDate}
                            extraColumn={matchStat}
                        />
                    );
                })}
            </div>
        );
    },
    dedication: ({ state, opponents }) => {
        const weeks = Object.values(state.payload).sort((a, b) => a.week - b.week);

        if (weeks.length === 0) {
            return null;
        }

        return (
            <div className={'mt-2 ' + style.dedicatedWeeks}>
                {weeks.map(item => (
                    <Fragment key={item.week}>
                        <div>{getPeriodByWeekNumber(item.week)}</div>
                        <div>-</div>
                        <div className="fw-bold">{item.total} matches</div>
                    </Fragment>
                ))}
            </div>
        );
    },
    allSeasonPlayer: ({ state, opponents, seasons }) => {
        if (state.payload.totalSeasons === 0) {
            return null;
        }

        const data = ['spring', 'summer', 'fall', 'winter']
            .map(item => ({
                label: _capitalize(item),
                value: Object.keys(state.payload.seasonsPlayed[item].seasons).length,
                color: colors[item],
            }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);
        return <PieChart data={data} />;
    },
    seasonsParticipated: ({ state, opponents, seasons }) => {
        if (state.value === 0) {
            return null;
        }

        const data = ['spring', 'summer', 'fall', 'winter']
            .map(item => ({
                label: _capitalize(item),
                value: state.payload[item].matches,
                color: colors[item],
            }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);

        return <PieChart data={data} />;
    },
    twoWinsOneDay: ({ state, opponents }) => {
        const matches = Object.values(state.payload)
            .filter(item => item.length > 1)
            .reduce((arr, item, index) => {
                arr.push({ ...item[0], isFirst: index > 0 });
                arr.push(...item.slice(1).map(obj => ({ ...obj, playedAt: '' })));
                return arr;
            }, []);

        if (matches.length === 0) {
            return null;
        }

        return (
            <div className={style.inlineMatches}>
                {matches.map(match => (
                    <InlineMatch
                        columnClassName={classnames(match.isFirst && 'mt-4')}
                        key={match.id}
                        match={match}
                        challenger={opponents[match.challengerUserId]}
                        acceptor={opponents[match.acceptorUserId]}
                        customDateFormat={formatDate}
                    />
                ))}
            </div>
        );
    },
    points: ({ state, opponents, seasons }) => {
        const mostPointsSeasons = Object.entries(state.payload.seasonPoints)
            .map(([key, value]) => ({
                seasonId: Number(key),
                points: value,
            }))
            .sort((a, b) => b.points - a.points)
            .slice(0, 5);

        if (mostPointsSeasons.length === 0) {
            return null;
        }

        return (
            <div className={'mt-2 ' + style.seasons}>
                {mostPointsSeasons.map(item => (
                    <Fragment key={item.seasonId}>
                        <div>{seasons[item.seasonId]}</div>
                        <div>-</div>
                        <div className="fw-bold">
                            {item.points} point{item.points > 1 ? 's' : ''}
                        </div>
                    </Fragment>
                ))}
            </div>
        );
    },
    proposalsCreated: ({ state, opponents }) => {
        if (state.payload.length === 0) {
            return null;
        }

        return (
            <div className={'mt-2 ' + style.seasons}>
                {state.payload.map(item => (
                    <Fragment key={item.id}>
                        <div>{formatDate(item.playedAt)}</div>
                        <div>-</div>
                        <div className="fw-bold" style={{ maxWidth: '20rem' }}>
                            {item.place}
                        </div>
                    </Fragment>
                ))}
            </div>
        );
    },
    proposalsAccepted: ({ state, opponents }) => {
        if (state.payload.length === 0) {
            return null;
        }

        return (
            <div className={'mt-2 ' + style.proposalsAccepted}>
                {state.payload.map(item => {
                    const opponent = opponents[item.challengerUserId];

                    return (
                        <Fragment key={item.id}>
                            <div className="d-flex align-items-center">
                                <div className="me-1">
                                    <PlayerAvatar player1={opponent} />
                                </div>
                                <div className="fw-bold">
                                    {opponent.firstName} {opponent.lastName}
                                </div>
                            </div>
                            <div>-</div>
                            <div>{formatDate(item.playedAt)}</div>
                        </Fragment>
                    );
                })}
            </div>
        );
    },
    oracle: ({ state, seasons, levels }) => {
        if (state.payload.length === 0) {
            return null;
        }

        return (
            <div className="mt-2">
                {state.payload.map(item => (
                    <div key={`${item.seasonId}-${item.levelId}`}>
                        {seasons[item.seasonId]} - {levels[item.levelId]}
                    </div>
                ))}
            </div>
        );
    },
};
