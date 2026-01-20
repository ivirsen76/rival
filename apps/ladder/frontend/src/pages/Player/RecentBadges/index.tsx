import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Badge from '@/components/Badge';
import BadgeStat from '@/pages/Badges/Stat';
import { formatDate } from '@/utils/dayjs';
import Statbox from '@/components/Statbox';
import Modal from '@/components/Modal';
import allBadges from '@rival/ladder.backend/src/utils/badges';
import style from './style.module.scss';

const SHOW_BADGES = 5;

const RecentBadges = (props) => {
    const { user } = props;
    const { stats, achievedBadges } = user.badges;

    const recentBadges = useMemo(() => {
        const badgesSet = new Set(achievedBadges.slice(0, SHOW_BADGES).map((item) => item.code));

        const result = {};

        allBadges.oneTime.forEach((item) => {
            if (!badgesSet.has(item.code)) {
                return;
            }

            const state = item.getState({ stats });

            result[item.code] = {
                title: item.title,
                props: state.props,
            };
        });

        allBadges.series.forEach((item) => {
            const state = item.getState({ stats });

            for (const value of item.levels) {
                const code = `${item.code}:${value}`;
                if (!badgesSet.has(code)) {
                    continue;
                }

                result[code] = {
                    title: item.title,
                    props: {
                        ...state.props,
                        label: item.getLabel ? item.getLabel(value) : value,
                    },
                };
            }
        });

        for (const level of Object.values(stats.levels)) {
            allBadges.levels.forEach((item) => {
                const state = item.getState({ stats: level });

                for (const value of item.levels) {
                    const code = `level${level.id}:${item.code}:${value}`;
                    if (!badgesSet.has(code)) {
                        continue;
                    }

                    result[code] = {
                        title: item.title,
                        props: {
                            ...state.props,
                            label: item.getLabel ? item.getLabel(value) : value,
                        },
                    };
                }
            });
        }

        return achievedBadges.slice(0, SHOW_BADGES).map((item) => ({
            ...item,
            ...result[item.code],
        }));
    }, [stats, achievedBadges]);

    if (recentBadges.length === 0) {
        return <div>No badges achieved yet.</div>;
    }

    return (
        <Modal
            title={`${user.firstName} ${user.lastName}'s Badges`}
            size="xl"
            hasForm={false}
            renderTrigger={({ show }) => (
                <div className={style.trigger} onClick={show} data-recent-badges>
                    <Statbox>
                        <div className={style.wrapper}>
                            {recentBadges.map((item) => (
                                <div className={style.badge} key={item.code}>
                                    <div className={style.date} data-playwright-placeholder="short">
                                        {formatDate(item.achievedAt)}
                                    </div>
                                    <Badge key={item.code} {...item.props} percent={null} completed={false} />
                                    <div className={style.title}>{item.title}</div>
                                </div>
                            ))}
                        </div>
                    </Statbox>
                </div>
            )}
            renderBody={() => <BadgeStat data={user.badges} />}
        />
    );
};

RecentBadges.propTypes = {
    user: PropTypes.object,
};

export default RecentBadges;
