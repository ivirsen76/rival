import Trophy from './Trophy';
import Stats from './Stats';
import Other from './Other';
import Photos from './Photos';
import NotFound from '@/pages/NotFound';
import { Switch, Route, NavLink, useRouteMatch } from 'react-router-dom';
import { useSelector } from 'react-redux';
import hasAnyRole from '@/utils/hasAnyRole';
import style from './style.module.scss';

const Global = props => {
    const { path, url } = useRouteMatch();
    const user = useSelector(state => state.auth.user);

    if (!hasAnyRole(user, ['admin'])) {
        return <NotFound />;
    }

    const links = [
        { url: `${url}/photos`, label: 'Photos' },
        { url: `${url}/trophy`, label: 'Trophy' },
        { url: `${url}/stats`, label: 'Stats' },
        { url: `${url}/other`, label: 'Other' },
    ];

    return (
        <div>
            <h2 className="text-white mt-4">Global</h2>
            <div className="d-flex overflow-auto">
                <ul
                    className={
                        'nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-6 fw-semibold mb-6 flex-nowrap ' +
                        style.navbar
                    }
                >
                    {links.map(link => (
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
                <Route exact path={`${path}/photos`} component={Photos} />
                <Route exact path={`${path}/trophy`} component={Trophy} />
                <Route exact path={`${path}/stats`} component={Stats} />
                <Route exact path={`${path}/other`} component={Other} />
                <Route component={NotFound} />
            </Switch>
        </div>
    );
};

export default Global;
