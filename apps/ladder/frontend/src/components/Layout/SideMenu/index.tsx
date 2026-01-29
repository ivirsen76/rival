import { useState } from 'react';
import { PanelMenu } from 'primereact/panelmenu';
import LineIcon from '@rival/packages/metronic/icons/duotune/abstract/abs015.svg?react';
import ExitIcon from '@rival/packages/metronic/icons/duotune/arrows/arr043.svg?react';
import SettingsIcon from '@rival/packages/metronic/icons/duotone/Interface/Cog.svg?react';
import DollarIcon from '@rival/packages/metronic/icons/duotone/Shopping/Dollar.svg?react';
import HornIcon from '@/assets/horn.svg?react';
import BadgeIcon from '@/assets/badge.svg?react';
import UserIcon from '@rival/packages/metronic/icons/duotone/General/User.svg?react';
import EnterIcon from '@rival/packages/metronic/icons/duotune/arrows/arr042.svg?react';
import RenderInBody from '@/components/RenderInBody';
import PlayerAvatar from '@/components/PlayerAvatar';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import Caret from './caret.svg?react';
import { useHistory } from 'react-router-dom';
import _capitalize from 'lodash/capitalize';
import hasAnyRole from '@rival/packages/utils/hasAnyRole';
import style from './style.module.scss';
import './aside.scss';

type SideMenuProps = {
    years: unknown[];
};

const SideMenu = (props: SideMenuProps) => {
    const { years } = props;

    const [show, setShow] = useState(false);
    const user = useSelector((state) => state.auth.user);
    const history = useHistory();

    const isPartner = hasAnyRole(user, ['partner']);

    const goTo = (url) => {
        history.push(url);
        setShow(false);
    };

    const toggleShow = () => setShow(!show);

    const menuHeader = (item, settings) => {
        return (
            <div className={classnames('side-menu-item', style.item, settings.active && style.expanded)}>
                {item.icon && <span className="svg-icon svg-icon-2 me-3">{item.icon}</span>}
                <div className={style.label}>{item.label}</div>
                {item.items && (
                    <div className={style.caret}>
                        <Caret />
                    </div>
                )}
            </div>
        );
    };

    const menuItem = (item) => {
        return (
            <div className={classnames('side-menu-item', style.item, item.expanded && style.expanded)}>
                {item.icon && <span className="svg-icon svg-icon-2 me-3">{item.icon}</span>}
                {!item.items && !item.icon && <div className={style.dot} />}
                <div className={style.label}>{item.label}</div>
                {item.items && (
                    <div className={style.caret}>
                        <Caret />
                    </div>
                )}
            </div>
        );
    };

    const items = [
        ...(user
            ? [
                  {
                      label: (
                          <div className="d-flex align-items-center">
                              <div className="me-2 mb-1">
                                  <PlayerAvatar player1={user} />
                              </div>
                              {user.firstName} {user.lastName}
                          </div>
                      ),
                      className: 'mb-8',
                      template: menuHeader,
                      expanded: true,
                      items: [
                          {
                              label: 'Settings',
                              icon: <SettingsIcon />,
                              command: () => goTo('/user/settings'),
                              template: menuItem,
                          },
                          ...(isPartner
                              ? []
                              : [
                                    {
                                        label: 'My Profile',
                                        icon: <UserIcon />,
                                        command: () => goTo('/player/' + user.slug),
                                        template: menuItem,
                                    },
                                    {
                                        label: 'Wallet',
                                        icon: <DollarIcon />,
                                        command: () => goTo('/user/wallet'),
                                        template: menuItem,
                                    },
                                    {
                                        label: 'Referral',
                                        icon: <HornIcon />,
                                        command: () => goTo('/user/referral'),
                                        template: menuItem,
                                    },
                                    {
                                        label: 'Badges',
                                        icon: <BadgeIcon />,
                                        command: () => goTo('/user/badges'),
                                        template: menuItem,
                                    },
                                ]),
                          {
                              label: 'Sign out',
                              icon: <ExitIcon />,
                              command: () => goTo('/logout'),
                              template: menuItem,
                          },
                      ],
                  },
              ]
            : [
                  {
                      label: 'Sign in',
                      icon: <EnterIcon />,
                      template: menuHeader,
                      className: 'mb-8',
                      command: () => goTo('/login'),
                  },
              ]),
        {
            label: 'Home',
            command: () => goTo('/'),
            template: menuHeader,
        },
        {
            label: 'Top Players',
            command: () => goTo('/top'),
            template: menuHeader,
        },
        {
            label: 'Seasons',
            template: menuHeader,
            items: years.map((year) => ({
                label: year.year,
                template: menuItem,
                items: year.seasons.map((season) => ({
                    label: _capitalize(season.name),
                    template: menuItem,
                    items: season.levels.map((level) => ({
                        label: level.name,
                        template: menuItem,
                        command: () => goTo(`/season/${year.year}/${season.name}/${level.slug}`),
                    })),
                })),
            })),
        },
        {
            label: 'About',
            template: menuHeader,
            items: [
                {
                    label: 'Tennis Ladder',
                    template: menuItem,
                    command: () => goTo('/about'),
                },
                {
                    label: 'Scoring',
                    template: menuItem,
                    command: () => goTo('/scoring'),
                },
                {
                    label: 'Rules',
                    template: menuItem,
                    command: () => goTo('/rules'),
                },
                {
                    label: 'TLR',
                    template: menuItem,
                    command: () => goTo('/tlr'),
                },
                {
                    label: 'Pricing',
                    template: menuItem,
                    command: () => goTo('/pricing'),
                },
                {
                    label: 'Founders',
                    template: menuItem,
                    command: () => goTo('/founders'),
                },
                {
                    label: 'Contact Us',
                    template: menuItem,
                    command: () => goTo('/contacts'),
                },
                {
                    label: "What's New",
                    template: menuItem,
                    command: () => goTo('/changelog'),
                },
            ],
        },
        ...(hasAnyRole(user, ['admin', 'manager'])
            ? [
                  {
                      label: 'Admin',
                      template: menuHeader,
                      command: () => goTo('/admin'),
                  },
              ]
            : []),
        ...(isPartner
            ? [
                  {
                      label: 'Partner',
                      template: menuHeader,
                      command: () => goTo('/partner'),
                  },
              ]
            : []),
    ];

    return (
        <div>
            <div className="d-flex d-lg-none align-items-center ms-n3 me-1" title="Show aside menu">
                {user && (
                    <div className="me-2 mb-1 fs-4" data-logged-user={user.id}>
                        <PlayerAvatar player1={user} />
                    </div>
                )}

                <div
                    className="btn btn-icon btn-icon-white btn-active-light-primary w-30px h-30px w-md-40px h-md-40px"
                    onClick={() => toggleShow()}
                    id="side-menu-toggle"
                >
                    <span className="svg-icon svg-icon-2">
                        <LineIcon />
                    </span>
                </div>
            </div>

            <RenderInBody>
                <div className={classnames(style.panel, show && style.visible)}>
                    <PanelMenu model={items} className="w-full md:w-20rem" />
                </div>
                <div className={classnames(style.closeTrigger, show && style.visible)} onClick={() => setShow(false)} />
            </RenderInBody>
        </div>
    );
};

export default SideMenu;
