import { useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useQueryClient } from 'react-query';
import Loader from '@/components/Loader';
import Error from '@/components/Error';
import Header from '@/components/Header';
import Overview from './Overview';
import Matches from './Matches';
import Proposals from './Proposals';
import Admin from './Admin';
import { Switch, Route, Link, NavLink, useRouteMatch } from 'react-router-dom';
import BackIcon from '@rival/packages/metronic/icons/duotone/Navigation/Left-2.svg?react';
import ForwardIcon from '@rival/packages/metronic/icons/duotone/Navigation/Right-2.svg?react';
import classnames from 'classnames';
import _get from 'lodash/get';
import _pick from 'lodash/pick';
import NotFound from '@/pages/NotFound';
import hasAnyRole from '@/utils/hasAnyRole';
import { useSelector } from 'react-redux';
import dayjs from '@/utils/dayjs';
import Tooltip from '@/components/Tooltip';
import useConfig from '@/utils/useConfig';
import style from './style.module.scss';

const Tournament = props => {
    const { level, season, year } = props.match.params;
    const tournamentUrl = `/api/tournaments/1?year=${year}&season=${season}&level=${level}`;

    const levelTooltipRef = useRef();
    const { path, url } = useRouteMatch();
    const queryClient = useQueryClient();
    const currentUser = useSelector(state => state.auth.user);
    const config = useConfig();

    const { data, isPreviousData, isLoading, status, error } = useQuery(tournamentUrl, {
        keepPreviousData: true,
        staleTime: 0,
    });

    const tournament = useMemo(() => {
        if (!data || !data.players) {
            return data;
        }

        for (const player of Object.values(data.players)) {
            if (player.partnerIds) {
                player.partners = player.partnerIds.map(id => ({
                    ..._pick(data.players[id], [
                        'id',
                        'firstName',
                        'lastName',
                        'avatar',
                        'avatarObject',
                        'gender',
                        'userSlug',
                        'userId',
                        'teamName',
                        'stats',
                        'address',
                        'elo',
                    ]),
                }));
            }
        }

        return { ...data };
    }, [data]);

    const reloadTournament = async () => {
        await queryClient.invalidateQueries(tournamentUrl);
    };

    if (isLoading) {
        return <Loader loading />;
    }

    if (status === 'error') {
        return _get(error, 'response.status') === 404 ? <NotFound /> : <Error message="Unexpected error" />;
    }

    const links = [
        { url, label: 'Overview', show: true },
        { url: `${url}/matches`, label: 'Matches', show: true },
        { url: `${url}/proposals`, label: 'Proposals', show: true },
        {
            url: `${url}/admin`,
            label: 'Manage players',
            show: hasAnyRole(currentUser, ['admin', 'manager']) && dayjs.tz().isBefore(dayjs.tz(tournament.endDate)),
        },
    ];

    const removeSinglesWord = str => str.replace(/\s+Singles$/, '');

    return (
        <div>
            <Loader loading={isPreviousData} />
            <Header
                title={`${tournament.seo.title} Ladder`}
                description={`Explore the ${tournament.seo.title} ladder in ${config.city}, including players, proposals, matches, records, ranks, and points.`}
            />
            <h2 className="text-white mt-2">
                <div className={style.seasonNav}>
                    <div className={style.pair}>
                        <div className="text-nowrap">{tournament.season}</div>
                        <div className="ms-2 me-2">-</div>
                        <Tooltip
                            content={
                                <div
                                    className={style.levelDropdown}
                                    onClick={() => {
                                        levelTooltipRef.current && levelTooltipRef.current.hide();
                                    }}
                                >
                                    {tournament.allLevels.map(item => (
                                        <Link
                                            key={item.slug}
                                            className={style.levelLink}
                                            to={`/season/${tournament.seasonYear}/${tournament.seasonSeason}/${item.slug}`}
                                        >
                                            {removeSinglesWord(item.name)}
                                        </Link>
                                    ))}
                                </div>
                            }
                            interactive
                            placement="bottom-start"
                            trigger="click"
                            arrow={false}
                            offset={[0, 8]}
                            theme="light"
                            onShow={instance => {
                                levelTooltipRef.current = instance;
                            }}
                        >
                            <div className={style.levelLinkTrigger}>{removeSinglesWord(tournament.level)}</div>
                        </Tooltip>
                    </div>
                    {tournament.prevTournament || tournament.nextTournament ? (
                        <div>
                            <Link
                                to={_get(tournament, 'prevTournament.link', '')}
                                className={classnames('btn btn-sm btn-icon btn-secondary me-1', {
                                    disabled: !tournament.prevTournament,
                                })}
                                title={_get(tournament, 'prevTournament.name')}
                            >
                                <span className="svg-icon svg-icon-2">
                                    <BackIcon />
                                </span>
                            </Link>
                            <Link
                                to={_get(tournament, 'nextTournament.link', '')}
                                className={classnames('btn btn-sm btn-icon btn-secondary', {
                                    disabled: !tournament.nextTournament,
                                })}
                                title={_get(tournament, 'nextTournament.name')}
                            >
                                <span className="svg-icon svg-icon-2">
                                    <ForwardIcon />
                                </span>
                            </Link>
                        </div>
                    ) : null}
                </div>
            </h2>
            <div className="d-flex overflow-auto">
                <ul
                    className={
                        'nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-6 fw-semibold mb-6 flex-nowrap ' +
                        style.navbar
                    }
                    data-tournament-navbar
                >
                    {links
                        .filter(link => link.show)
                        .map(link => (
                            <li key={link.url} className="nav-item">
                                <NavLink
                                    exact
                                    className={classnames(
                                        'nav-link text-white-50 text-active-white text-nowrap pb-2 position-relative',
                                        link.isNew && 'me-10'
                                    )}
                                    to={link.url}
                                >
                                    {link.label}
                                    {link.isNew && <span className={style.new}>NEW</span>}
                                </NavLink>
                            </li>
                        ))}
                </ul>
            </div>
            <Switch>
                <Route exact path={path}>
                    <Overview tournament={tournament} reloadTournament={reloadTournament} />
                </Route>
                <Route exact path={`${path}/matches`}>
                    <Matches tournament={tournament} reloadTournament={reloadTournament} />
                </Route>
                <Route exact path={`${path}/proposals`}>
                    <Proposals tournament={tournament} reloadTournament={reloadTournament} />
                </Route>
                <Route exact path={`${path}/admin`}>
                    <Admin tournament={tournament} reloadTournament={reloadTournament} />
                </Route>
                <Route component={NotFound} />
            </Switch>
        </div>
    );
};

Tournament.propTypes = {
    match: PropTypes.object,
};

Tournament.defaultProps = {};

export default Tournament;
