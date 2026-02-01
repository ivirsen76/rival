import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Router, Switch, Route as OriginalRoute, Redirect } from 'react-router-dom';
import loadable from '@rival/common/utils/loadable';
import Loader from '@rival/common/components/Loader';
import notification from '@rival/common/components/notification';
import GoogleAnalytics from '@rival/common/components/GoogleAnalytics';
import AppearanceChecker from '@/components/AppearanceChecker';
import EmojiMultiplierCalculator from '@rival/common/components/EmojiMultiplierCalculator';
import history from '@rival/common/history';
import { useSelector, useDispatch } from 'react-redux';
import { loadCurrentUser, setConfig } from '@/reducers/auth';
import useSettings from '@rival/common/utils/useSettings';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import { getUnseenUpdates } from '@/selectors/auth';
import NewUpdatesImage from '@/assets/newUpdates.svg?react';
import { useQuery } from 'react-query';
import axios from '@rival/common/axios';
import style from './style.module.scss';

// Pages
import Action from '@/pages/Action';
import ShortLink from '@/pages/ShortLink';
import Home, { TopBlock as HomeTopBlock, topBlockClassname as homeTopBlockClassname } from '@/pages/Home';
import Login from '@/pages/Login';
import Logout from '@/pages/Logout';
import ForgotPassword from '@/pages/ForgotPassword';
import Settings from '@/pages/Settings';
import Contacts from '@/pages/About/Contacts';
import Founders from '@/pages/About/Founders';
import Rules from '@/pages/About/Rules';
import Ladder from '@/pages/About/Ladder';
import Scoring from '@/pages/About/Scoring';
import Rating from '@/pages/About/Rating';
import Player from '@/pages/Player';
import Register from '@/pages/Register';
import Top from '@/pages/Top';
import Tournament from '@/pages/Tournament';
import Changelog from '@/pages/About/Changelog';
import Badges from '@/pages/Badges';
import Terms from '@/pages/Terms';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import NotFound from '@/pages/NotFound';
import Avatar from '@/pages/Image/Avatar';
import MatchStat from '@/pages/Image/MatchStat';
import Match from '@/pages/Image/Match';
import Badge from '@/pages/Image/Badge';
import Rivalry from '@/pages/Image/Rivalry';
import Tlr from '@/pages/Image/Tlr';
import Bracket from '@/pages/Image/Bracket';
import Association from '@/pages/Association';

const Admin = loadable(() => import('@/pages/Admin'));
const VisualTesting = loadable(() => import('@/pages/VisualTesting'));

window.tl = window.tl || {};
window.tl.history = history;

const Route = ({ component: Component, layoutTopBlock, layoutTopBlockClassname, ...rest }) => {
    return (
        <OriginalRoute
            {...rest}
            render={(props) => (
                <Layout {...props} TopBlock={layoutTopBlock} topBlockClassname={layoutTopBlockClassname}>
                    <Component {...props} />
                </Layout>
            )}
        />
    );
};

export default function App() {
    const currentUser = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();
    const [showUpdatesModal, setShowUpdatesModal] = useState(false);
    const { settings, isSettingsLoading } = useSettings();
    const unseenUpdates = useSelector((state) => getUnseenUpdates(state));

    const { isLoading } = useQuery('getCurrentUser', async () => {
        // load current user in useQuery instead of useEffect just to reload it automatically every 10 minutes (default stale time)
        await dispatch(loadCurrentUser());
    });

    useEffect(() => {
        if (settings) {
            document.title = `Rival Tennis Ladder - ${settings.config.city}, ${settings.config.state}`;
            dispatch(setConfig(settings.config));
        }
    }, [settings]);

    // Set up sentry
    useEffect(() => {
        const isSentryInitialized = Boolean(window.__SENTRY__.globalEventProcessors);
        if (settings && settings.config.isProduction && settings.config.sentryDsn && !isSentryInitialized) {
            try {
                Sentry.init({
                    dsn: settings.config.sentryDsn,
                    integrations: [new Integrations.BrowserTracing()],

                    // Set tracesSampleRate to 1.0 to capture 100%
                    // of transactions for performance monitoring.
                    // We recommend adjusting this value in production
                    tracesSampleRate: 0.1,
                });
            } catch {
                // do nothing
            }
        }
    }, [settings]);

    // Show new features modal
    useEffect(() => {
        if (currentUser?.loginAs) {
            return;
        }

        if (unseenUpdates.length === 0 || showUpdatesModal) {
            return;
        }

        if (window.location.pathname.includes('changelog')) {
            return;
        }

        if (window.location.pathname.includes('register')) {
            return;
        }

        setShowUpdatesModal(true);
        notification({
            inModal: true,
            title: "What's New on Rival",
            modalProps: {
                dialogClassName: style.modalWidth,
            },
            onHide: () => {
                axios.put('/api/users/0', { action: 'updateChangelogSeenAt' });
            },
            render: ({ hide }) => {
                const maxCount = 3;
                const moreCount = Math.max(unseenUpdates.length - maxCount, 0);

                return (
                    <div className={style.newUpdates}>
                        <div>
                            <NewUpdatesImage />
                            <p>Check out the latest updates to the Rival system:</p>
                            <ul className={style.list}>
                                {unseenUpdates.slice(0, maxCount).map((item) => (
                                    <li key={item.date} className="m-0">
                                        {item.title}
                                    </li>
                                ))}
                            </ul>
                            {moreCount > 0 && <div>and {moreCount} more...</div>}
                        </div>
                        <div className="mt-6">
                            <button
                                type="button"
                                className="btn btn-primary btn-sm me-2"
                                onClick={() => {
                                    hide();
                                    history.push('/changelog');
                                }}
                            >
                                Read more
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={hide}>
                                Dismiss
                            </button>
                        </div>
                    </div>
                );
            },
        });
    }, [unseenUpdates, showUpdatesModal]);

    if (isLoading || isSettingsLoading) {
        return <Loader loading />;
    }

    // we need to render it without any Layout
    {
        if (window.location.pathname === '/image/avatar') {
            return <Avatar />;
        }
        if (window.location.pathname === '/image/match/stat') {
            return <MatchStat />;
        }
        if (window.location.pathname === '/image/match') {
            return <Match />;
        }
        if (window.location.pathname === '/image/badge') {
            return <Badge />;
        }
        if (window.location.pathname === '/image/rivalry') {
            return <Rivalry />;
        }
        if (window.location.pathname === '/image/tlr') {
            return <Tlr />;
        }
        if (window.location.pathname === '/image/bracket') {
            return <Bracket />;
        }
        if (window.location.pathname === '/visual') {
            return <VisualTesting />;
        }
    }

    return (
        <Router history={history}>
            <GoogleAnalytics />
            <AppearanceChecker />
            <EmojiMultiplierCalculator />
            <Switch>
                <Route exact path="/login" component={Login} />
                <Route exact path="/forgotPassword" component={ForgotPassword} />
                <Route exact path="/logout" component={Logout} />
                <Route exact path="/register" component={Register} />
                <Route exact path="/contacts" component={Contacts} />
                <Route exact path="/founders" component={Founders} />
                <Route exact path="/scoring" component={Scoring} />
                <Route exact path="/about" component={Ladder} />
                <Route exact path="/tlr" component={Rating} />
                <Route exact path="/terms-and-conditions" component={Terms} />
                <Route exact path="/privacy-policy" component={PrivacyPolicy} />
                <Route exact path="/top/:category?" component={Top} />
                <Route exact path="/rules" component={Rules} />
                <Route exact path="/a/:name/:code" component={ShortLink} />
                <Route exact path="/action/:payload" component={Action} />
                <Route exact path="/city/:slug" component={Association} />
                <Redirect exact from="/admin" to="/admin/stats" />
                <Route path="/admin" component={Admin} />
                <Route exact path="/user/settings" component={Settings} />
                <Route exact path="/user/badges" component={Badges} />
                <Route
                    exact
                    path="/"
                    component={Home}
                    layoutTopBlock={HomeTopBlock}
                    layoutTopBlockClassname={homeTopBlockClassname}
                />
                <Route exact path="/player/:slug" component={Player} />
                <Route path="/season/:year/:season/:level" component={Tournament} />
                <Route path="/changelog" component={Changelog} />
                <Route component={NotFound} />
            </Switch>
        </Router>
    );
}
