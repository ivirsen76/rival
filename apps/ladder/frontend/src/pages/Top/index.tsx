/* eslint-disable react/no-unstable-nested-components */
import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Card from '@/components/Card';
import Header from '@/components/Header';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';
import PlayerName from '@/components/PlayerName';
import PlayerAvatar from '@/components/PlayerAvatar';
import Loader from '@/components/Loader';
import Table from '@/components/Table';
import HiddenText from '@/components/HiddenText';
import Tabs from '@/components/Tabs';
import axios from '@/utils/axios';
import { useSelector } from 'react-redux';
import { getPercentile } from './helpers';
import formatElo from '@rival/ladder.backend/src/utils/formatElo';
import { formatCustom } from '@/utils/dayjs';
import useConfig from '@/utils/useConfig';
import useBreakpoints from '@/utils/useBreakpoints';
import formatNumber from '@rival/ladder.backend/src/utils/formatNumber';
import style from './style.module.scss';

const genderOptions = [
    { value: 'all', label: 'All genders' },
    { value: 'male', label: 'Men' },
    { value: 'female', label: 'Women' },
];
const groupOptions = [
    { value: 'all', label: 'All players' },
    { value: 'current', label: 'Current players' },
];

const Top = (props) => {
    const category = props.match.params.category;
    const history = useHistory();
    const [currentGender, setCurrentGender] = useState('all');
    const [currentGroup, setCurrentGroup] = useState('all');
    const [loadedCategory, setLoadedCategory] = useState();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUser = useSelector((state) => state.auth.user);
    const config = useConfig();
    const size = useBreakpoints();

    const isSmall = ['xs', 'sm', 'md'].includes(size);

    const categories = [
        {
            code: 'mostMatches',
            label: 'Matches',
            title: 'Most Matches Played',
            rules: [
                <>
                    Minimum <b>50 matches</b> to make the list
                </>,
            ],
            getSpecificColumns: () => [
                {
                    name: 'matches',
                    label: 'Matches',
                    className: 'text-center',
                    render: (value) => formatNumber(value),
                },
                ...(isSmall
                    ? []
                    : [
                          {
                              name: 'winLoss',
                              label: 'Win - Loss',
                              render: (value, row) => `${row.won} - ${row.lost}`,
                              className: 'text-center',
                          },
                      ]),
            ],
            getUserInfo: (userRow) => (
                <>
                    You played <b>{userRow.matches}</b> matches
                </>
            ),
        },
        {
            code: 'mostSeasons',
            label: 'Seasons',
            title: 'Most Seasons Played',
            rules: [
                <>
                    Minimum <b>5 seasons</b> to make the list
                </>,
            ],
            getSpecificColumns: () => [
                {
                    name: 'seasons',
                    label: 'Seasons',
                    className: 'text-center',
                },
                ...(isSmall
                    ? []
                    : [
                          {
                              name: 'range',
                              label: 'First - Last',
                              render: (value, row) => `${row.firstSeason} - ${row.lastSeason}`,
                              className: 'text-center text-nowrap',
                          },
                      ]),
            ],
            getUserInfo: (userRow) => (
                <>
                    You played <b>{userRow.seasons}</b> seasons
                </>
            ),
        },
        {
            code: 'highestTlr',
            label: 'TLR',
            title: 'Highest TLR',
            rules: [
                <>
                    Minimum <b>3.50 TLR</b> to make the list
                </>,
            ],
            getSpecificColumns: () => [
                {
                    name: 'elo',
                    label: <span className="text-nowrap">Max TLR</span>,
                    render: (value) => (
                        <span className={`badge badge-square badge-dark ${style.elo}`}>{formatElo(value)}</span>
                    ),
                    className: 'text-center',
                },
                ...(isSmall
                    ? []
                    : [
                          {
                              name: 'date',
                              label: 'Achieved At',
                              render: (value) => formatCustom(value, 'MMM D, YYYY'),
                          },
                      ]),
            ],
            getUserInfo: (userRow) => (
                <>
                    You max TLR is <b>{formatElo(userRow.elo)}</b>
                </>
            ),
        },
        {
            code: 'mostProgress',
            label: 'Progress',
            title: 'Most Progress',
            rules: [
                <>
                    Minimum <b>0.50 TLR gain</b> to make the list
                </>,
            ],
            getSpecificColumns: () => [
                {
                    name: 'diffElo',
                    label: 'TLR Gain',
                    render: (value) => `+${formatElo(value)}`,
                    className: 'text-center',
                },
                ...(isSmall
                    ? []
                    : [
                          {
                              name: 'range',
                              label: 'TLR Range',
                              render: (value, row) => (
                                  <div>
                                      <span className={`badge badge-square badge-dark ${style.elo}`}>
                                          {formatElo(row.initialElo)}
                                      </span>
                                      <span className="ms-1 me-1">-</span>
                                      <span className={`badge badge-square badge-dark ${style.elo}`}>
                                          {formatElo(row.maxElo)}
                                      </span>
                                  </div>
                              ),
                              className: 'text-center',
                          },
                      ]),
            ],
            getUserInfo: (userRow) => (
                <>
                    You gained <b>{formatElo(userRow.diffElo)}</b> TLR points
                </>
            ),
        },
        {
            code: 'mostComebacks',
            label: 'Comebacks',
            title: 'Most Comebacks',
            rules: [
                'Comeback is a win after losing the first set.',
                <>
                    Minimum <b>5 comebacks</b> to make the list
                </>,
            ],
            getSpecificColumns: () => [
                {
                    name: 'comebacks',
                    label: 'Comebacks',
                    className: 'text-center',
                },
            ],
            getUserInfo: (userRow) => (
                <>
                    You have <b>{userRow.comebacks}</b> comebacks
                </>
            ),
        },
        {
            code: 'mostRivalries',
            label: 'Most Rivalries',
            title: 'Most Rivalries',
            rules: [
                <>
                    Minimum <b>5 rivalries</b> to make the list
                </>,
            ],
            getSpecificColumns: () => [
                {
                    name: 'rivalries',
                    label: 'Rivalries',
                    className: 'text-center',
                },
            ],
            getUserInfo: (userRow) => (
                <>
                    You have <b>{userRow.rivalries}</b> rivalries
                </>
            ),
        },
        {
            code: 'longestRivalries',
            label: 'Longest Rivalries',
            title: 'Longest Rivalries',
            rules: [
                <>
                    Minimum <b>10 matches</b> in a rivalry to make the list
                </>,
            ],
            getSpecificColumns: () => [
                {
                    name: 'rivalry',
                    label: 'Rivalry',
                    render: (value, row) => {
                        const firstUser = row.won >= row.lost ? row.firstUser : row.secondUser;
                        const secondUser = row.won < row.lost ? row.firstUser : row.secondUser;

                        return (
                            <div className={style.rivalry}>
                                <div className="d-flex align-items-center">
                                    <PlayerAvatar player1={firstUser} className="me-2" />
                                    <PlayerName player1={firstUser} isLink />
                                </div>
                                <div className={style.vs}>vs</div>
                                <div className="d-flex align-items-center">
                                    <PlayerAvatar player1={secondUser} className="me-2" />
                                    <PlayerName player1={secondUser} isLink />
                                </div>
                            </div>
                        );
                    },
                },
                {
                    name: 'matches',
                    label: 'Matches',
                    className: 'text-center',
                    render: (value, row) => (
                        <>
                            {value}
                            <div className="d-block d-sm-none text-muted">
                                ({row.won > row.lost ? row.won : row.lost} - {row.won > row.lost ? row.lost : row.won})
                            </div>
                        </>
                    ),
                },
                {
                    name: 'winLoss',
                    label: 'Win - Loss',
                    className: 'd-none d-sm-table-cell text-center text-nowrap',
                    render: (value, row) => (
                        <>
                            {row.won > row.lost ? row.won : row.lost} - {row.won > row.lost ? row.lost : row.won}
                        </>
                    ),
                },
            ],
            getUserInfo: (userRow) => {
                const opponent = userRow.userIds[0] === currentUser.id ? userRow.secondUser : userRow.firstUser;

                return (
                    <>
                        Your longest rivalry is <b>{userRow.matches}</b> matches against {opponent.firstName}{' '}
                        {opponent.lastName}
                    </>
                );
            },
        },
        {
            code: 'mostBadges',
            label: 'Badges',
            title: 'Most Badges Earned',
            rules: [
                <>
                    Minimum <b>25 badges</b> to make the list
                </>,
            ],
            getSpecificColumns: () => [
                {
                    name: 'badges',
                    label: 'Badges',
                    className: 'text-center',
                },
            ],
            getUserInfo: (userRow) => (
                <>
                    You have earned <b>{userRow.badges}</b> badges
                </>
            ),
        },
    ];

    useEffect(() => {
        if (!categories.find((item) => item.code === category)) {
            history.push(`/top/${categories[0].code}`);
            return;
        }

        (async () => {
            setLoading(true);
            const response = await axios.put('/api/stats/0', { action: category });
            ReactDOM.unstable_batchedUpdates(() => {
                setLoadedCategory(category);
                setData(response.data.data);
            });
            setLoading(false);
        })();
    }, [category]);

    const currentCategory = categories.find((item) => item.code === loadedCategory);

    const filteredData = data.filter((row) => {
        if (currentGroup === 'current' && !row.isCurrent) {
            return false;
        }
        if (currentGender !== 'all' && row.gender !== currentGender) {
            return false;
        }

        return true;
    });

    const renderFilter = () => (
        <div>
            <div className={style.buttons}>
                {groupOptions.map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        className={classnames('btn btn-sm', currentGroup === item.value ? 'btn-primary' : 'btn-light')}
                        onClick={() => setCurrentGroup(item.value)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            <div className={style.buttons + ' mt-2'}>
                {genderOptions.map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        className={classnames('btn btn-sm', currentGender === item.value ? 'btn-primary' : 'btn-light')}
                        onClick={() => setCurrentGender(item.value)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderUserInsight = () => {
        if (!currentUser || !currentCategory) {
            return null;
        }

        const index = filteredData.findIndex(
            (item) => item.id === currentUser.id || (item.userIds && item.userIds.includes(currentUser.id))
        );
        let verdict;
        if (index === -1) {
            verdict = 'You are not in this list.';
        } else {
            const userRow = filteredData[index];
            const percentile = getPercentile(index + 1, filteredData.length);
            verdict = (
                <>
                    {currentCategory.getUserInfo(userRow)} (Top {percentile}%).
                </>
            );
        }

        return (
            <>
                <h3>Your Result</h3>
                <div>{verdict}</div>
            </>
        );
    };

    const getRowClassName = (row) => (row.isCurrent ? 'table-primary tl-tr-all-round' : '');
    const filterKey = `key-${loadedCategory}-${currentGroup}-${currentGender}`;

    const getRules = () => (
        <ul className="ps-4 m-0" key={currentCategory.code}>
            {currentCategory.rules.map((rule, index) => (
                <li key={index} className="m-0">
                    {rule}
                </li>
            ))}
            <li className="m-0">Highlighted players are currently playing.</li>
        </ul>
    );

    const tabs = categories.map((item) => ({
        code: item.code,
        label: item.label,
        title: item.title,
        url: `/top/${item.code}`,
        isActive: item.code === category,
    }));

    return (
        <div>
            <Loader loading={loading} />
            <Header
                title="Top Players"
                description={`This is a collection of the top players in ${config.city} Rival Tennis Ladder.`}
            />
            <h2 className="text-white mt-4">Top Players</h2>
            <Card>
                <div className="mb-6">
                    {isSmall ? (
                        <select
                            className="form-select form-select-solid"
                            value={category}
                            onChange={(e) => {
                                history.push(`/top/${e.target.value}`);
                            }}
                        >
                            {tabs.map((option) => (
                                <option key={option.code} value={option.code}>
                                    {option.title}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <Tabs list={tabs} />
                    )}
                </div>
                {currentCategory && (
                    <div className={style.tableWrapper}>
                        <div className={style.explanation}>
                            {isSmall && (
                                <HiddenText title="Statistic explanation" className="mb-4">
                                    {getRules()}
                                    {renderUserInsight()}
                                </HiddenText>
                            )}

                            {!isSmall && <h1>{currentCategory.title}</h1>}
                            {!isSmall && getRules()}
                            <div className="mt-6">{renderFilter()}</div>
                            {!isSmall && renderUserInsight()}
                        </div>
                        <div className={style.table}>
                            {filteredData.length === 0 ? (
                                'No players yet'
                            ) : (
                                <Table
                                    key={filterKey}
                                    className="table tl-table tl-table-spacious"
                                    columns={[
                                        ...(filteredData[0].firstName
                                            ? [
                                                  {
                                                      name: 'name',
                                                      label: 'Player',
                                                      render: (value, row) => (
                                                          <div className="d-flex align-items-center">
                                                              <PlayerAvatar player1={row} className="me-2" />
                                                              <PlayerName player1={row} isLink />
                                                          </div>
                                                      ),
                                                  },
                                              ]
                                            : []),
                                        ...currentCategory.getSpecificColumns(),
                                    ]}
                                    data={filteredData}
                                    getRowClassName={getRowClassName}
                                    showTopPaginator={false}
                                />
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

Top.propTypes = {
    match: PropTypes.object,
};

export default Top;
