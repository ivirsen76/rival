import { useMemo } from 'react';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import classnames from 'classnames';
import Statbox from '@/components/Statbox';
import { formatDate } from '@/utils/dayjs';
import summaries from './summaries';
import useSettings from '@/utils/useSettings';
import _capitalize from 'lodash/capitalize';
import allBadges from '@rival/ladder.backend/src/utils/badges';
import style from './style.module.scss';

const returnFunc = (value) => value;

type BadgesStatProps = {
    data: object;
    isMyself: boolean;
    isLight: boolean;
};

const BadgesStat = (props: BadgesStatProps) => {
    const { data, isMyself, isLight } = props;

    const stats = data?.stats;
    const achievedBadges = data?.achievedBadges;
    const opponents = data?.opponents;

    const userBadges = useMemo(() => {
        if (!achievedBadges) {
            return {};
        }

        return achievedBadges.reduce((obj, item) => {
            obj[item.code] = item;
            return obj;
        }, {});
    }, [achievedBadges]);

    const levels = useMemo(() => {
        if (!stats?.levels) {
            return [];
        }

        return Object.values(stats.levels).sort((a, b) => a.position - b.position);
    }, [stats]);

    const { settings } = useSettings();

    const allLevels = useMemo(() => {
        return settings.levels.reduce((obj, item) => {
            obj[item.id] = item.name;
            return obj;
        }, {});
    }, [settings]);

    const allSeasons = useMemo(() => {
        return settings.seasons.reduce((obj, item) => {
            obj[item.id] = `${item.year} ${_capitalize(item.season)}`;
            return obj;
        }, {});
    }, [settings]);

    const completedStatbox = (
        <Statbox text="Completed" className={style.small} colorHue={128} colorLightness={30}>
            <div className={style.completedCheck}>
                <svg viewBox="0 0 1024 1024">
                    <circle stroke="0" fill="hsl(128, 73%, 37%)" cx="512" cy="512" r="512" />
                    <path
                        fill="#fff"
                        d="M 448 794.51 L 210.75 557.25 L 301.26 466.75 L 448 613.49 L 754.75 306.74 L 845.25 397.25 L 448 794.51 Z"
                    />
                </svg>
            </div>
        </Statbox>
    );

    return (
        <div className={style.wrapper}>
            <Statbox text="One-Time Badges" isLight={isLight}>
                <div className={style.badges}>
                    {allBadges.oneTime.map((item) => {
                        const badgeState = item.getState({ stats });

                        return (
                            <Modal
                                key={item.code}
                                title={`${item.title} Badge`}
                                dialogClassName={style.modalWidth}
                                backdrop="static"
                                hasForm={false}
                                renderTrigger={({ show }) => (
                                    <div
                                        className={classnames(style.badge, {
                                            [style.completed]: badgeState.completed,
                                            [style.isLight]: isLight,
                                        })}
                                        onClick={show}
                                        data-badge={item.code}
                                    >
                                        <Badge {...badgeState.props} />
                                        <div className={style.title}>{item.title}</div>
                                    </div>
                                )}
                                renderBody={({ hide }) => {
                                    const userBadge = userBadges[item.code];
                                    const summary = summaries[item.code]
                                        ? summaries[item.code]({
                                              state: badgeState,
                                              opponents,
                                              isMyself,
                                              seasons: allSeasons,
                                              levels: allLevels,
                                          })
                                        : null;

                                    return (
                                        <div className={style.modal} data-badge-info={item.code}>
                                            <Statbox className={style.fit}>
                                                <div className={style.modalBadge}>
                                                    <Badge
                                                        {...badgeState.props}
                                                        percent={null}
                                                        completed={false}
                                                        disabled={!userBadge}
                                                    />
                                                    {userBadge && (
                                                        <div className={style.date}>
                                                            {formatDate(userBadge.achievedAt)}
                                                        </div>
                                                    )}
                                                </div>
                                            </Statbox>
                                            <Statbox
                                                text={item.title}
                                                label={
                                                    <div>
                                                        {item.description}
                                                        {item.comment ? <div>{item.comment}</div> : null}
                                                    </div>
                                                }
                                                className={style.medium}
                                            />
                                            {badgeState.completed && completedStatbox}
                                            {summary && (
                                                <Statbox text={badgeState.summaryTitle} className="w-100">
                                                    {summary}
                                                </Statbox>
                                            )}
                                        </div>
                                    );
                                }}
                            />
                        );
                    })}
                </div>
            </Statbox>

            <Statbox text="Series Badges" isLight={isLight}>
                <div className={style.badges}>
                    {allBadges.series.map((item) => {
                        const badgeState = item.getState({ stats });
                        const getLabel = item.getLabel || returnFunc;

                        return (
                            <Modal
                                key={item.code}
                                title={`${item.title} Badge`}
                                dialogClassName={style.modalWidth}
                                backdrop="static"
                                hasForm={false}
                                renderTrigger={({ show }) => (
                                    <div
                                        className={classnames(style.badge, style.series, {
                                            [style.completed]: badgeState.completed,
                                            [style.isLight]: isLight,
                                        })}
                                        onClick={show}
                                        data-badge={item.code}
                                    >
                                        <Badge {...badgeState.props} />
                                        <div className={style.title}>{item.title}</div>
                                    </div>
                                )}
                                renderBody={({ hide }) => {
                                    const summary = summaries[item.code]
                                        ? summaries[item.code]({
                                              state: badgeState,
                                              opponents,
                                              isMyself,
                                              seasons: allSeasons,
                                              levels: allLevels,
                                          })
                                        : null;

                                    return (
                                        <div className={style.modal} data-badge-info={item.code}>
                                            <Statbox
                                                text={item.title}
                                                label={item.description}
                                                className={style.medium}
                                            />
                                            <Statbox
                                                text={getLabel(badgeState.value)}
                                                label={badgeState.valueExplanation}
                                                className={style.small}
                                            />
                                            {badgeState.completed ? (
                                                completedStatbox
                                            ) : (
                                                <Statbox
                                                    text={`+${getLabel(badgeState.nextDiff)}`}
                                                    label={badgeState.lastStep ? 'to complete' : 'to the next level'}
                                                    className={style.small}
                                                />
                                            )}
                                            <Statbox className="w-100">
                                                <div className={style.list}>
                                                    {item.levels.map((value, index) => {
                                                        const userBadge = userBadges[`${item.code}:${value}`];

                                                        return (
                                                            <div key={value} className={style.modalBadge}>
                                                                <Badge
                                                                    {...badgeState.props}
                                                                    label={getLabel(value)}
                                                                    percent={null}
                                                                    completed={false}
                                                                    disabled={!userBadge}
                                                                />
                                                                {userBadge && (
                                                                    <div className={style.date}>
                                                                        {formatDate(userBadge.achievedAt)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </Statbox>
                                            {summary && (
                                                <Statbox text={badgeState.summaryTitle} className="w-100">
                                                    {summary}
                                                </Statbox>
                                            )}
                                        </div>
                                    );
                                }}
                            />
                        );
                    })}
                </div>
            </Statbox>

            {levels.map((level) => (
                <Statbox key={level.slug} text={`${level.name} Badges`} isLight={isLight}>
                    <div className={style.badges}>
                        {allBadges.levels.map((item) => {
                            const badgeState = item.getState({ stats: level });

                            return (
                                <Modal
                                    key={item.code}
                                    title={`${item.title} Badge`}
                                    dialogClassName={style.modalWidth}
                                    backdrop="static"
                                    hasForm={false}
                                    renderTrigger={({ show }) => (
                                        <div
                                            className={classnames(style.badge, style.level, {
                                                [style.completed]: badgeState.completed,
                                                [style.isLight]: isLight,
                                            })}
                                            onClick={show}
                                            data-badge={`level${level.id}:${item.code}`}
                                        >
                                            <Badge {...badgeState.props} />
                                            <div className={style.title}>{item.title}</div>
                                        </div>
                                    )}
                                    renderBody={({ hide }) => {
                                        const summary = summaries[item.code]
                                            ? summaries[item.code]({
                                                  state: badgeState,
                                                  opponents,
                                                  isMyself,
                                                  seasons: allSeasons,
                                                  levels: allLevels,
                                              })
                                            : null;

                                        return (
                                            <div
                                                className={style.modal}
                                                data-badge-info={`level${level.id}:${item.code}`}
                                            >
                                                <Statbox
                                                    text={item.title}
                                                    label={item.description}
                                                    className={style.medium}
                                                />
                                                {typeof badgeState.value === 'number' && (
                                                    <Statbox
                                                        text={badgeState.value}
                                                        label={badgeState.valueExplanation}
                                                        className={style.small}
                                                    />
                                                )}
                                                {badgeState.completed ? (
                                                    completedStatbox
                                                ) : typeof badgeState.nextDiff === 'number' ? (
                                                    <Statbox
                                                        text={`+${badgeState.nextDiff}`}
                                                        label={
                                                            badgeState.lastStep ? 'to complete' : 'to the next level'
                                                        }
                                                        className={style.small}
                                                    />
                                                ) : null}
                                                <Statbox className="w-100">
                                                    <div className={style.list}>
                                                        {item.levels.map((value, index) => {
                                                            const userBadge =
                                                                userBadges[`level${level.id}:${item.code}:${value}`];

                                                            return (
                                                                <div key={value} className={style.modalBadge}>
                                                                    <Badge
                                                                        {...badgeState.props}
                                                                        completed={false}
                                                                        label={
                                                                            item.getLabel ? item.getLabel(value) : value
                                                                        }
                                                                        percent={null}
                                                                        disabled={!userBadge}
                                                                    />
                                                                    {userBadge && (
                                                                        <div className={style.date}>
                                                                            {formatDate(userBadge.achievedAt)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </Statbox>
                                                {summary && (
                                                    <Statbox text={badgeState.summaryTitle} className="w-100">
                                                        {summary}
                                                    </Statbox>
                                                )}
                                            </div>
                                        );
                                    }}
                                />
                            );
                        })}
                    </div>
                </Statbox>
            ))}
        </div>
    );
};

export default BadgesStat;
