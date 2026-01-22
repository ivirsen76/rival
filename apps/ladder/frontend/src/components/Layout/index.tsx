import { Link } from 'react-router-dom';
import TopMenu from './TopMenu';
import SideMenu from './SideMenu';
import useSettings from '@/utils/useSettings';
import ChatIcon from '@/styles/metronic/icons/duotone/Communication/Chat6.svg?react';
import { useSelector } from 'react-redux';
import testImage from './clay.jpg';
import useBreakpoints from '@/utils/useBreakpoints';
import Modal from '@/components/Modal';
import FormFeedback from '@/components/FormFeedback';
import RegisterButton from '@/components/RegisterButton';
import RivalLogo from '@/assets/logo.svg?react';
import Facebook from './Facebook';
import Twitter from './Twitter';
import Instagram from './Instagram';
import PullToRefresh from 'react-simple-pull-to-refresh';
import dayjs from '@/utils/dayjs';
import bg from './bg.jpg?w=1200';
import useAppearance from '@/utils/useAppearance';
import classnames from 'classnames';
import style from './style.module.scss';

type LayoutProps = {
    children: React.ReactNode;
    TopBlock: (...args: unknown[]) => unknown;
    topBlockClassname: string;
};

const Layout = (props: LayoutProps) => {
    const { TopBlock, topBlockClassname } = props;
    const { settings } = useSettings();
    const { seasons, config } = settings;
    const user = useSelector((state) => state.auth.user);
    const size = useBreakpoints();
    const currentDateStr = dayjs.tz().format('YYYY-MM-DD HH:mm:ss');
    const appearance = useAppearance();

    const isSmall = ['xs', 'sm', 'md'].includes(size);
    const isPullToRefresh = ['xs', 'sm'].includes(size);

    const years = [];
    seasons
        .filter((season) => season.startDate < currentDateStr)
        .forEach((season) => {
            if (years.length === 0 || years[years.length - 1].year !== season.year) {
                years.push({ year: season.year, seasons: [] });
            }

            years[years.length - 1].seasons.unshift({
                name: season.season,
                levels: season.levels.map((level) => ({
                    id: level.id,
                    name: level.name,
                    slug: level.slug,
                })),
            });
        });

    const citiesNearby = (settings.settings.global?.citiesNearby || []).slice(0, 5);
    const otherCities = (config.otherCities || '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);

    const reloadPage = async () => {
        // small delay just to see the spinner
        await new Promise((resolve) => setTimeout(resolve, 500));

        window.location.reload();

        // long delay to still see the spinner until refresh
        await new Promise((resolve) => setTimeout(resolve, 5000));
    };

    const spinner = (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '67px' }}>
            <span className="spinner-border text-secondary" role="status">
                <span className="visually-hidden">Loading...</span>
            </span>
        </div>
    );

    const topMenu = (
        <div className="header border-bottom-0" style={{ position: 'relative', zIndex: 10 }}>
            <div className={'container-fluid d-flex align-items-center ' + style.container}>
                <Link to="/" className="d-flex align-items-center" data-logo>
                    <div className={style.logo} />
                    <div>
                        <div className={style.title}>Rival Tennis Ladder</div>
                        <div className={style.city}>
                            {config.city}, {config.state}
                            {!config.isProduction && (
                                <span className={classnames('badge bg-warning text-black', style.demo)}>DEMO</span>
                            )}
                        </div>
                    </div>
                </Link>
                <div className="ms-4 flex-grow-1 d-flex justify-content-end" data-top-menu>
                    {!isSmall && <TopMenu years={years} />}
                </div>

                {isSmall && !user && (
                    <div className="header-menu" style={{ display: 'block' }}>
                        <div className="menu menu-rounded menu-row menu-title-white menu-state-icon-primary menu-state-bullet-primary menu-arrow-gray-400 fw-semibold me-2">
                            <div className="menu-item me-lg-1">
                                <Link to="/login" className="menu-link py-2">
                                    <span className="menu-title">Sign&nbsp;in</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {isSmall && <SideMenu years={years} />}
            </div>
        </div>
    );

    const footer = (
        <div className={style.footer}>
            <div className={style.dividerWrapper}>
                <svg
                    data-name="Layer 1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                    className={style.divider}
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
            <div className={'container-fluid ' + style.container}>
                <div className={style.blocks}>
                    {user && (
                        <Modal
                            title="Support"
                            hasForm={false}
                            renderTrigger={({ show }) => (
                                <button
                                    type="button"
                                    className={classnames(
                                        'btn btn-sm',
                                        appearance === 'light' && 'btn-light',
                                        appearance === 'dark' && 'btn-dark',
                                        style.feedbackButton
                                    )}
                                    data-feedback-button
                                    onClick={show}
                                >
                                    <span className="svg-icon svg-icon-2 me-2">
                                        <ChatIcon />
                                    </span>
                                    Support
                                </button>
                            )}
                            renderBody={({ hide }) => <FormFeedback onSubmit={hide} />}
                        />
                    )}
                    <div className={style.utl}>
                        <RivalLogo />
                        <div className="mt-3 d-none d-md-block">
                            <div className="fw-bold fs-3 text-nowrap">
                                {config.city}, {config.state}
                            </div>
                            <div className={style.otherCities}>{otherCities.join(', ')}</div>
                        </div>
                    </div>
                    <div className={style.links}>
                        <div className="fw-bold mb-2 fs-3">Ladder</div>
                        <div>
                            <Link to="/about">About</Link>
                        </div>
                        <div>
                            <Link to="/scoring">Scoring</Link>
                        </div>
                        <div>
                            <Link to="/rules">Rules</Link>
                        </div>
                        <div>
                            <Link to="/tlr">TLR</Link>
                        </div>
                        <div>
                            <Link to="/pricing">Pricing</Link>
                        </div>
                        <div>
                            <Link to="/founders">Founders</Link>
                        </div>
                        <div>
                            <Link to="/contacts">Contact Us</Link>
                        </div>
                        <div>
                            <Link to="/changelog">What&apos;s New</Link>
                        </div>
                    </div>
                    {citiesNearby.length > 0 && (
                        <div className={style.cities}>
                            <div className="fw-bold mb-2 fs-3">Cities Nearby</div>
                            {citiesNearby.map((city) => (
                                <div key={city.slug}>
                                    <a href={`https://${city.slug}.tennis-ladder.com`} target="_blank" rel="noreferrer">
                                        {city.name}, {city.state}
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                    <div>
                        <div className="d-block d-md-none">
                            {config.city}, {config.state}
                        </div>
                        <div className={'d-none d-md-block ' + style.icons}>
                            <a href="https://www.facebook.com/rivaltennisladder" target="_blank" rel="noreferrer">
                                <Facebook />
                            </a>
                            <a href="https://twitter.com/Rival_Tennis" target="_blank" rel="noreferrer">
                                <Twitter />
                            </a>
                            <a href="https://www.instagram.com/rivaltennisladder" target="_blank" rel="noreferrer">
                                <Instagram />
                            </a>
                        </div>
                        <div>
                            2021-{new Date().getFullYear()}
                            <span className="ms-1 me-1">©</span>
                            <a href="https://tennis-ladder.com" target="_blank" rel="noreferrer">
                                Rival Tennis Ladder
                            </a>
                        </div>
                        <div className="d-none d-md-block">
                            <Link to="/terms-and-conditions">Terms & Conditions</Link>
                            <br />
                            <Link to="/privacy-policy">Privacy Policy</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const body = (
        <div className={'position-relative ' + style.body} data-test-image={testImage}>
            <div className={TopBlock ? topBlockClassname : style.topBgWrapper}>
                {topMenu}
                {TopBlock ? (
                    <TopBlock />
                ) : (
                    <div className={style.topBg}>
                        <div className={style.image} style={{ backgroundImage: `url(${bg})` }} />
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
                )}
            </div>

            <div className={'container-fluid flex-grow-1 mb-6 ' + style.container}>
                <div id="tl-page-body">{props.children}</div>
            </div>

            {footer}
        </div>
    );

    return (
        <div className="position-relative">
            <RegisterButton />
            <PullToRefresh
                onRefresh={reloadPage}
                className={style.pullDownArea}
                pullingContent={null}
                refreshingContent={spinner}
                resistance={2}
                maxPullDownDistance={150}
                isPullable={isPullToRefresh}
            >
                {body}
            </PullToRefresh>
        </div>
    );
};

export default Layout;
