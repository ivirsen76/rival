import { useState, useMemo, useRef } from 'react';
import { useQuery } from 'react-query';
import UpsetMatch from '@/components/UpsetMatch';
import SearchIcon from '@rival/common/metronic/icons/duotone/General/Search.svg?react';
import Loader from '@rival/common/components/Loader';
import { Virtuoso } from 'react-virtuoso';
import { useDebounce } from 'use-debounce';
import axios from '@rival/common/axios';
import dayjs from '@rival/common/dayjs';
import classnames from 'classnames';
import ArrowIcon from './arrow.svg?react';
import style from './style.module.scss';

const customDateFormat = (date) => dayjs.tz(date).format('MMM D, YYYY');

type MatchesProps = {
    user: object;
};

const Matches = (props: MatchesProps) => {
    const { user } = props;
    const [search, setSearch] = useState('');
    const [atBottom, setAtBottom] = useState(false);
    const [actualSearch] = useDebounce(search, 500);
    const virtuoso = useRef(null);

    const { data, isLoading } = useQuery(
        `/api/users/${user.id}/matches`,
        async () => {
            const response = await axios.put(`/api/users/${user.id}`, { action: 'getUserMatches' });
            return response.data.data;
        },
        {
            staleTime: 5 * 60 * 1000, // 5 minutes
        }
    );

    const filteredMatches = useMemo(() => {
        if (!data) {
            return [];
        }

        const trimmedSearch = actualSearch.trim().toLowerCase();
        if (!trimmedSearch) {
            return data.matches;
        }

        const userIds = Object.values(data.users).reduce((set, item) => {
            if (item.search.includes(trimmedSearch)) {
                set.add(item.id);
            }

            return set;
        }, new Set());
        userIds.delete(user.id);

        return data.matches.filter(
            (item) =>
                userIds.has(item.challengerUserId) ||
                userIds.has(item.challenger2UserId) ||
                userIds.has(item.acceptorUserId) ||
                userIds.has(item.acceptor2UserId)
        );
    }, [data, actualSearch, user]);

    if (isLoading) {
        return <Loader loading />;
    }

    const { users } = data;

    return (
        <div className={style.wrapper}>
            <div className="mb-6 position-relative">
                <input
                    type="text"
                    className="form-control form-control-solid pe-12"
                    placeholder="Search player..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="position-absolute translate-middle-y top-50 end-0 me-3">
                    <span className="svg-icon svg-icon-1">
                        <SearchIcon />
                    </span>
                </div>
            </div>
            <div className={style.list}>
                {filteredMatches.length > 0 && (
                    <div
                        className={classnames(style.toBottomButton, atBottom && style.hidden)}
                        onClick={() => {
                            virtuoso.current.scrollToIndex({
                                index: filteredMatches.length - 1,
                                align: 'start',
                                behavior: 'smooth',
                            });
                        }}
                    >
                        <ArrowIcon />
                    </div>
                )}

                {filteredMatches.length === 0 ? (
                    'No matches found'
                ) : (
                    <Virtuoso
                        ref={virtuoso}
                        style={{ height: '100%' }}
                        totalCount={filteredMatches.length}
                        atBottomStateChange={(value) => setAtBottom(value)}
                        itemContent={(index) => {
                            const match = filteredMatches[index];

                            return (
                                <div className={classnames('pe-6', index < filteredMatches.length - 1 && 'pb-8')}>
                                    <UpsetMatch
                                        key={match.id}
                                        match={match}
                                        challenger={users[match.challengerUserId]}
                                        acceptor={users[match.acceptorUserId]}
                                        challenger2={users[match.challenger2UserId]}
                                        acceptor2={users[match.acceptor2UserId]}
                                        customDateFormat={customDateFormat}
                                        extraData={match.levelName}
                                    />
                                </div>
                            );
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default Matches;
