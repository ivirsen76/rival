import Seasons from './Seasons';
import Levels from './Levels';
import Managers from './Managers';
import Email from './Email';
import Ban from './Ban';
import Settings from './Settings';
import Players from './Players';
import Stats from './Stats';
import Merge from './Merge';
import Actions from './Actions';
import Complaints from './Complaints';
import Income from './Income';
import Tracking from './Tracking';
import NotFound from '@/pages/NotFound';
import { Switch, Route, NavLink, useRouteMatch } from 'react-router-dom';
import { useSelector } from 'react-redux';
import hasAnyRole from '@/utils/hasAnyRole';
import useConfig from '@/utils/useConfig';
import style from './style.module.scss';

type TournamentProps = {};

const Tournament = (props: TournamentProps) => {
    const { path, url } = useRouteMatch();
    const user = useSelector((state) => state.auth.user);
    const config = useConfig();

    if (!hasAnyRole(user, ['admin', 'manager'])) {
        return <NotFound />;
    }

    const links = [
        { url: `${url}/levels`, label: 'Levels', roles: ['admin', 'manager'] },
        { url: `${url}/seasons`, label: 'Seasons', roles: ['admin', 'manager'] },
        { url: `${url}/managers`, label: 'Managers', roles: ['admin'] },
        { url: `${url}/email`, label: 'Messages', roles: ['admin', 'manager'] },
        { url: `${url}/ban`, label: 'Ban', roles: ['admin'] },
        { url: `${url}/texts`, label: 'Settings', roles: ['admin', 'manager'] },
        { url: `${url}/players`, label: 'Players', roles: ['admin', 'manager'] },
        { url: `${url}/complaints`, label: 'Complaints', roles: ['admin', 'manager'] },
        ...(config.isRaleigh
            ? [{ url: `${url}/income`, label: 'Income', roles: ['admin', 'manager'] }]
            : [{ url: `${url}/tracking`, label: 'Tracking', roles: ['superadmin'] }]),
        { url: `${url}/merge`, label: 'Merge', roles: ['superadmin'] },
        { url: `${url}/actions`, label: 'Actions', roles: ['superadmin'] },
        { url: `${url}/stats`, label: 'Stats', roles: ['admin', 'manager'] },
    ];

    return (
        <div>
            <h2 className="text-white mt-4">Admin</h2>

            <div className="d-flex overflow-auto">
                <ul
                    className={
                        'nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-6 fw-semibold mb-6 flex-nowrap ' +
                        style.navbar
                    }
                >
                    {links
                        .filter((link) => hasAnyRole(user, link.roles))
                        .map((link) => (
                            <li key={link.url} className="nav-item">
                                <NavLink
                                    exact
                                    className="nav-link text-white-50 text-active-white text-nowrap pb-2"
                                    to={link.url}
                                >
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                </ul>
            </div>
            <Switch>
                <Route exact path={`${path}/seasons`} component={Seasons} />
                <Route exact path={`${path}/levels`} component={Levels} />
                <Route exact path={`${path}/managers`} component={Managers} />
                <Route exact path={`${path}/email`} component={Email} />
                <Route exact path={`${path}/ban`} component={Ban} />
                <Route exact path={`${path}/texts`} component={Settings} />
                <Route exact path={`${path}/players`} component={Players} />
                <Route exact path={`${path}/complaints`} component={Complaints} />
                <Route exact path={`${path}/income`} component={Income} />
                <Route exact path={`${path}/tracking`} component={Tracking} />
                <Route exact path={`${path}/merge`} component={Merge} />
                <Route exact path={`${path}/actions`} component={Actions} />
                <Route exact path={`${path}/stats`} component={Stats} />
                <Route component={NotFound} />
            </Switch>
        </div>
    );
};

export default Tournament;
