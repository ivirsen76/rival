import { useQuery } from 'react-query';
import Loader from '@rival/common/components/Loader';
import Header from '@/components/Header';
import useSettings from '@rival/common/utils/useSettings';
import style from './style.module.scss';
import classnames from 'classnames';
import PlayerAvatar from '@rival/common/components/PlayerAvatar';
import axios from '@rival/common/axios';
import court from './court.jpg?w=800;1200;1600;2400&format=webp&as=srcset';
import courtSmall from './courtSmall.jpg?w=800;1200;1600;2400&format=webp&as=srcset';
import formatNumber from '@rival/club.backend/src/utils/formatNumber';
import gradualRound from '@rival/common/utils/gradualRound';
import CtaButton from './CtaButton';
import log from '@/utils/log';
import type { Banana } from '@rival/club.backend/src/types';
import Card from '@rival/common/components/Card';

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
    const { settings, isSettingsLoading } = useSettings();

    if (isSettingsLoading) {
        return <Loader loading />;
    }

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
