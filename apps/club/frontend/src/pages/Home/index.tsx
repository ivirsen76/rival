import { useMemo } from 'react';
import { useQuery } from 'react-query';
import Loader from '@rival/common/components/Loader';
import Card from '@rival/common/components/Card';
import Html from '@rival/common/components/Html';
import Header from '@/components/Header';
import WeatherForecast from '@rival/common/components/WeatherForecast';
import { Link } from 'react-router-dom';
import dayjs, { formatDate } from '@rival/common/dayjs';
import DateIcon from '@rival/common/metronic/icons/duotune/general/gen008.svg?react';
import useSettings from '@rival/common/utils/useSettings';
import style from './style.module.scss';
import classnames from 'classnames';
import useBreakpoints from '@rival/common/utils/useBreakpoints';
import UserIcon from '@rival/common/metronic/icons/duotone/General/User.svg?react';
import BattleIcon from '@/assets/battle.svg?react';
import JoinAnytime from './joinAnytime.svg?react';
import PlayerAvatar from '@rival/common/components/PlayerAvatar';
import axios from '@rival/common/axios';
import Shadow from './Shadow';
import { Title } from '@rival/common/components/Statbox';
import court from './court.jpg?w=800;1200;1600;2400&format=webp&as=srcset';
import courtSmall from './courtSmall.jpg?w=800;1200;1600;2400&format=webp&as=srcset';
import formatNumber from '@rival/club.backend/src/utils/formatNumber';
import gradualRound from '@rival/common/utils/gradualRound';
import CtaButton from './CtaButton';
import log from '@/utils/log';
import type { Banana } from '@rival/club.backend/src/types';

export const TopBlock = () => {
    const { data: stats } = useQuery(`/api/activity/motivation`, async () => {
        const response = await axios.put(`/api/utils/0`, { action: 'getMotivationStats' });
        return response.data.data;
    });

    const showMotivation = stats?.playersTotal >= 100 && stats?.recentPlayers.length >= 3;

    return (
        <>
            <div className={style.image}>
                <picture>
                    <source media="(min-width: 500px)" srcSet={court} />
                    <source media="(max-width: 500px)" srcSet={courtSmall} />
                    <img alt="" srcSet={court} />
                </picture>
                <div className={style.shapeDivider}>
                    <svg
                        data-name="Layer 1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1200 120"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
                            opacity=".25"
                            className={style.shape}
                        />
                        <path
                            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
                            opacity=".5"
                            className={style.shape}
                        />
                        <path
                            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
                            className={style.shape}
                        />
                    </svg>
                </div>
            </div>
            <div className={classnames('container', style.container)} id="rival-hero-section">
                <div className={style.content}>
                    <div className={style.glass}>
                        <h1 className="text-white mb-9">
                            <div>Tennis Ladder</div>
                            <div>for Local Clubs</div>
                        </h1>
                        <p className={style.description}>
                            Get out and play tennis any day, any time, at&nbsp;your tennis club with players on your
                            level.
                        </p>
                        <div className={style.ctaWrapper}>
                            <CtaButton />
                            {showMotivation && (
                                <div className={style.avatars}>
                                    {stats.recentPlayers.map((player, index) => (
                                        <div key={player.id} className={style.avatar} style={{ zIndex: index }}>
                                            <PlayerAvatar player1={player} />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showMotivation && (
                                <div className={style.motivation}>
                                    {formatNumber(gradualRound(stats.playersTotal))}+ players joined
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export const topBlockClassname = style.topBlock;

const Home = () => {
    const { data, isLoading } = useQuery('/api/seasons/0', {
        keepPreviousData: true,
        staleTime: 0,
    });
    const { data: news, isLoading: isNewsLoading } = useQuery(`/api/news`);
    const { data: stats, isLoading: isStatsLoading } = useQuery(`/api/activity/stats`, async () => {
        const response = await axios.put(`/api/utils/0`, { action: 'getActivityStats' });
        return response.data.data;
    });
    const { settings, isSettingsLoading } = useSettings();
    const size = useBreakpoints();

    const hasWordcloud = useMemo(() => {
        return (
            !isStatsLoading &&
            stats.players >= 150 &&
            settings?.settings.wordcloudUrl &&
            settings?.settings.wordcloudCreatedAt &&
            dayjs.tz().diff(dayjs.tz(settings.settings.wordcloudCreatedAt), 'week', true) < 4
        );
    }, [settings, stats, isStatsLoading]);

    if (isLoading || isSettingsLoading || isNewsLoading) {
        return <Loader loading />;
    }

    const format = (date) => dayjs.tz(date).format('MMM D');
    const getFinalTournamentDates = (tournament) => {
        return `Starting ${format(dayjs.tz(tournament.endDate).isoWeekday(1))}`;
    };

    const showCanJoin = Boolean(data?.latestTournament?.season?.usersCanRegister);

    const renderOverview = () => {
        const tournament = data.latestTournament.season;
        const isOver = tournament.isFinished;

        let currentWeek;
        let totalWeeks;
        if (!isOver) {
            currentWeek = Math.ceil(dayjs.tz().diff(dayjs.tz(tournament.startDate), 'week', true));
            totalWeeks = Math.ceil(
                dayjs.tz(tournament.endDate).subtract(12, 'hour').diff(dayjs.tz(tournament.startDate), 'week', true)
            );
        }

        return (
            <>
                {isOver && (
                    <div>
                        <strong>The season has ended.</strong>
                        {tournament.closeReason && <span className="ms-2">({tournament.closeReason})</span>}
                    </div>
                )}
                {!isOver && (
                    <div>
                        <strong>Ongoing season:</strong> Week {currentWeek} of {totalWeeks}
                    </div>
                )}
                <div>
                    <strong>Dates:</strong> {format(tournament.startDate)} -{' '}
                    {format(dayjs.tz(tournament.endDate).subtract(1, 'minute'))}
                </div>
                {tournament.hasFinalTournament ? (
                    <div>
                        <strong>Tournament:</strong> {getFinalTournamentDates(tournament)}
                    </div>
                ) : null}
            </>
        );
    };

    const isLarge = ['xl', 'xxl', 'lg'].includes(size);
    const hasWeather = Boolean(settings.settings?.weather?.hours);

    const getLevelGroups = (levels) => {
        const result = levels.reduce((obj, level) => {
            let key = 'men';
            if (['doubles', 'doubles-team'].includes(level.levelType)) {
                key = 'doubles';
            } else if (level.levelName.includes('Women')) {
                key = 'women';
            }

            obj[key] = obj[key] || [];
            obj[key].push(level);
            return obj;
        }, {});

        return [
            ...(result.men ? [{ name: 'Men', slug: 'men', list: result.men }] : []),
            ...(result.women ? [{ name: 'Women', slug: 'women', list: result.women }] : []),
            ...(result.doubles ? [{ name: 'Doubles', slug: 'doubles', list: result.doubles }] : []),
        ];
    };

    const addLineBreak = (text) => {
        if (!/\sDBLS/.test(text)) {
            return text;
        }

        const words = text.split(' ');
        return (
            <>
                {words[0]}
                <br />
                {words.slice(1).join(' ')}
            </>
        );
    };

    const bananas = settings.bananas.filter((item) => item.images.normal) as Banana[];

    return (
        <div>
            <Header
                description={`Play tennis any day, any time, and at any court in the tennis clubs across US using the Rival Tennis Ladder software.`}
                schema={{
                    '@type': 'SportsOrganization',
                    name: 'Rival Tennis Ladder',
                    sport: 'Tennis',
                    logo: 'https://utl.nyc3.digitaloceanspaces.com/images/logo.svg',
                    legalName: 'Rival Tennis Ladder, LLC',
                    sameAs: [
                        'https://www.facebook.com/rivaltennisladder',
                        'https://twitter.com/Rival_Tennis',
                        'https://www.instagram.com/rivaltennisladder',
                    ],
                }}
            />

            {(data.nextTournament || data.latestTournament) && (
                <>
                    <div className={style.grid}>
                        <div className={style.season}>
                            {data.nextTournament && (
                                <Card>
                                    <h1>Upcoming {data.nextTournament.season.name} Season</h1>
                                    <div>
                                        <strong>Dates:</strong> {format(data.nextTournament.season.startDate)} -{' '}
                                        {format(dayjs.tz(data.nextTournament.season.endDate).subtract(1, 'minute'))}
                                    </div>
                                    <div>
                                        <strong>Tournament:</strong>{' '}
                                        {getFinalTournamentDates(data.nextTournament.season)}
                                    </div>
                                    <div data-upcoming-season-levels className="mt-6">
                                        {(() => {
                                            const levelGroups = getLevelGroups(data.nextTournament.levels);

                                            return levelGroups.map((group) => (
                                                <div key={group.slug} className={style.levelWrapper}>
                                                    {group.list.map((level) => (
                                                        <Link
                                                            key={level.levelSlug}
                                                            to={`/season/${data.nextTournament.season.year}/${data.nextTournament.season.season}/${level.levelSlug}`}
                                                            className={classnames(style.levelWidget, style[group.slug])}
                                                            data-latest-level={level.levelSlug}
                                                        >
                                                            <h3 className="text-primary">
                                                                {addLineBreak(level.levelName)}
                                                            </h3>
                                                            <div className={style.stats}>
                                                                <span className="svg-icon svg-icon-1 svg-icon-white me-1">
                                                                    <UserIcon />
                                                                </span>
                                                                <div>{level.totalPlayers}</div>
                                                            </div>
                                                            <Shadow />
                                                        </Link>
                                                    ))}
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </Card>
                            )}
                            {data.latestTournament && (
                                <Card id="latestTournament">
                                    <div className="d-flex justify-content-between align-items-center mb-6">
                                        <div>
                                            <h1>{data.latestTournament.season.name}</h1>
                                            <div>{renderOverview()}</div>
                                        </div>
                                        {showCanJoin && (
                                            <Link to="/register" className={style.joinAnytime}>
                                                <JoinAnytime />
                                            </Link>
                                        )}
                                    </div>

                                    {(() => {
                                        const levelGroups = getLevelGroups(data.latestTournament.levels);

                                        return (
                                            <div>
                                                {levelGroups.map((group) => (
                                                    <div key={group.slug} className={style.levelWrapper}>
                                                        {group.list.map((level) => (
                                                            <Link
                                                                key={level.levelSlug}
                                                                to={`/season/${data.latestTournament.season.year}/${data.latestTournament.season.season}/${level.levelSlug}`}
                                                                className={classnames(
                                                                    style.levelWidget,
                                                                    style[group.slug]
                                                                )}
                                                                data-latest-level={level.levelSlug}
                                                            >
                                                                <h3 className="text-primary">
                                                                    {addLineBreak(level.levelName)}
                                                                </h3>
                                                                <div className={style.stats}>
                                                                    <span
                                                                        className="svg-icon svg-icon-1 svg-icon-white me-1"
                                                                        title="Players"
                                                                    >
                                                                        <UserIcon />
                                                                    </span>
                                                                    <div title="Players">{level.totalPlayers}</div>
                                                                    <span
                                                                        className="svg-icon svg-icon-1 svg-icon-white ms-4 me-1"
                                                                        title="Matches"
                                                                    >
                                                                        <BattleIcon />
                                                                    </span>
                                                                    <div title="Matches">{level.totalMatches}</div>
                                                                </div>
                                                                <Shadow />
                                                            </Link>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </Card>
                            )}
                        </div>
                        <div className={style.news}>
                            <Card className={isLarge ? style.newsCard : ''}>
                                <h1>News</h1>
                                <div className={style.newsWrapper}>
                                    {(news || []).slice(0, 10).map((item) => (
                                        <div key={item.id}>
                                            <div className="text-gray-500 fw-bold mb-1">
                                                <span className="svg-icon svg-icon-2 svg-icon-primary me-2">
                                                    <DateIcon />
                                                </span>
                                                {formatDate(item.date)}
                                            </div>
                                            <div>
                                                <Html content={item.content} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                    {hasWeather && (
                        <>
                            <h2 className={style.header}>Weather Forecast</h2>
                            <Card className={'mt-6 ' + style.weatherCard}>
                                <WeatherForecast isDelay />
                            </Card>
                        </>
                    )}

                    {hasWordcloud && (
                        <>
                            <h2 className={style.header}>Tennis Activity in the Last 12 Months</h2>
                            <div id="chart" />
                            <div className={style.cloudWrapper}>
                                <div className={style.cloud}>
                                    <img src={settings.settings.wordcloudUrl} alt="Rival Tennis Ladder activity" />
                                </div>
                                <div>
                                    <div>
                                        <Title className={style.statement} colorHue={217}>
                                            {stats.ladders} Ladders
                                        </Title>
                                    </div>
                                    <div>
                                        <Title className={style.statement} colorHue={314}>
                                            {formatNumber(stats.players)} Players
                                        </Title>
                                    </div>
                                    <div>
                                        <Title className={style.statement} colorHue={17}>
                                            {formatNumber(stats.matches)} Matches
                                        </Title>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <h2 className={style.header}>Explore the Tennis Ladder</h2>
                </>
            )}

            <Card>
                <h1>What do we do?</h1>
                <p>
                    Lorem ipsum, dolor sit amet consectetur adipisicing elit. Reprehenderit atque autem odio repellat
                    enim unde dignissimos sint debitis? Nisi saepe officiis laudantium officia nam. Exercitationem ex
                    aperiam modi itaque! Recusandae.
                </p>
                <p>
                    Lorem ipsum, dolor sit amet consectetur adipisicing elit. Reprehenderit atque autem odio repellat
                    enim unde dignissimos sint debitis? Nisi saepe officiis laudantium officia nam. Exercitationem ex
                    aperiam modi itaque! Recusandae.
                </p>
                <p className="mb-0">
                    Lorem ipsum, dolor sit amet consectetur adipisicing elit. Reprehenderit atque autem odio repellat
                    enim unde dignissimos sint debitis? Nisi saepe officiis laudantium officia nam. Exercitationem ex
                    aperiam modi itaque! Recusandae.
                </p>
            </Card>

            {bananas.length > 0 && (
                <div className={style.partner}>
                    <div className={style.label}>Our Partner{bananas.length > 1 ? 's' : ''}</div>
                    <div className="d-grid gap-8">
                        {bananas.map((banana) => (
                            <a
                                key={banana.name}
                                href={banana.link}
                                target="_blank"
                                rel="noreferrer"
                                data-banana-partner={banana.partner}
                                onClick={() => {
                                    log({ code: `click-homepage-banana-${banana.partner}` });
                                }}
                            >
                                <img
                                    className={style.image}
                                    src={banana.images.normal.src}
                                    alt={banana.name}
                                    style={{ aspectRatio: banana.images.normal.width / banana.images.normal.height }}
                                />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
