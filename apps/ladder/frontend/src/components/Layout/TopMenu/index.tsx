import _capitalize from 'lodash/capitalize';
import { useSelector } from 'react-redux';
import ExitIcon from '@/styles/metronic/icons/duotune/arrows/arr043.svg?react';
import SettingsIcon from '@/styles/metronic/icons/duotone/Interface/Cog.svg?react';
import DollarIcon from '@/styles/metronic/icons/duotone/Shopping/Dollar.svg?react';
import HornIcon from '@/assets/horn.svg?react';
import BadgeIcon from '@/assets/badge.svg?react';
import UserIcon from '@/styles/metronic/icons/duotone/General/User.svg?react';
import ArrowLeft from '@/styles/metronic/icons/duotune/arrows/arr002.svg?react';
import PlayerAvatar from '@/components/PlayerAvatar';
import hasAnyRole from '@/utils/hasAnyRole';
import { Link } from 'react-router-dom';
import { Menubar } from 'primereact/menubar';
import classnames from 'classnames';
import './primereact.scss';

const regularLink = (item) => {
    if (!item.url || !item.label) {
        throw new Error('url and label are required');
    }

    return (
        <Link to={item.url} className="p-menuitem-link">
            <span className="p-menuitem-text">{item.label}</span>
        </Link>
    );
};

const iconLink = (item) => {
    return (
        <Link
            className="p-menuitem-link p-no-bullet d-flex align-items-center"
            style={{ paddingTop: '0.4rem', paddingBottom: '0.4rem' }}
            to={item.url || ''}
        >
            <span className="svg-icon svg-icon-2 me-3">{item.icon}</span>
            {item.label}
        </Link>
    );
};

type TopMenuProps = {
    years: unknown[];
};

function TopMenu(props: TopMenuProps) {
    const { years } = props;
    const user = useSelector((state) => state.auth.user);

    const isPartner = hasAnyRole(user, ['partner']);

    const items = [
        {
            label: 'Home',
            url: '/',
            template: regularLink,
        },
        {
            label: 'Top Players',
            url: '/top',
            template: regularLink,
        },
        {
            label: 'Seasons',
            items: years.map((year) => ({
                label: year.year,
                items: year.seasons.map((season) => ({
                    label: _capitalize(season.name),
                    items: season.levels.map((level) => ({
                        label: level.name,
                        url: `/season/${year.year}/${season.name}/${level.slug}`,
                        template: regularLink,
                    })),
                })),
            })),
        },
        {
            label: 'About',
            items: [
                {
                    label: 'Tennis Ladder',
                    url: '/about',
                    template: regularLink,
                },
                {
                    label: 'Scoring',
                    url: '/scoring',
                    template: regularLink,
                },
                {
                    label: 'Rules',
                    url: '/rules',
                    template: regularLink,
                },
                {
                    label: 'TLR',
                    url: '/tlr',
                    template: regularLink,
                },
                {
                    label: 'Pricing',
                    url: '/pricing',
                    template: regularLink,
                },
                {
                    label: 'Founders',
                    url: '/founders',
                    template: regularLink,
                },
                {
                    label: 'Contact Us',
                    url: '/contacts',
                    template: regularLink,
                },
                {
                    label: "What's New",
                    url: '/changelog',
                    template: regularLink,
                },
            ],
        },
        ...(hasAnyRole(user, ['admin', 'manager'])
            ? [
                  {
                      label: 'Admin',
                      url: '/admin',
                      template: regularLink,
                  },
              ]
            : []),
        ...(isPartner
            ? [
                  {
                      label: 'Partner',
                      url: '/partner',
                      template: regularLink,
                  },
              ]
            : []),
        ...(user
            ? [
                  {
                      label: (
                          <div
                              className={classnames('d-flex align-items-center', user.loginAs && 'text-warning')}
                              data-logged-user={user.id}
                          >
                              <div className="me-2 mb-1">
                                  <PlayerAvatar player1={user} />
                              </div>
                              {user.firstName} {user.lastName}
                          </div>
                      ),
                      items: [
                          ...(user.loginAs
                              ? [
                                    {
                                        label: `Return to ${user.loginAsOriginalUser}`,
                                        icon: <ArrowLeft />,
                                        command: () => {
                                            localStorage.removeItem('tokenLoginAs');
                                            window.location.href = '';
                                        },
                                        template: iconLink,
                                    },
                                ]
                              : []),
                          {
                              label: 'Settings',
                              icon: <SettingsIcon />,
                              url: '/user/settings',
                              template: iconLink,
                          },
                          ...(isPartner
                              ? []
                              : [
                                    {
                                        label: 'My Profile',
                                        icon: <UserIcon />,
                                        url: '/player/' + user.slug,
                                        template: iconLink,
                                    },
                                    {
                                        label: 'Wallet',
                                        icon: <DollarIcon />,
                                        url: '/user/wallet',
                                        template: iconLink,
                                    },
                                    {
                                        label: 'Referral',
                                        icon: <HornIcon />,
                                        url: '/user/referral',
                                        template: iconLink,
                                    },
                                    {
                                        label: 'Badges',
                                        icon: <BadgeIcon />,
                                        url: '/user/badges',
                                        template: iconLink,
                                    },
                                ]),
                          {
                              label: 'Sign out',
                              icon: <ExitIcon />,
                              url: '/logout',
                              template: iconLink,
                          },
                      ],
                  },
              ]
            : [
                  {
                      label: 'Sign in',
                      url: '/login',
                      template: regularLink,
                  },
              ]),
    ];

    return <Menubar model={items} />;
}

export default TopMenu;
