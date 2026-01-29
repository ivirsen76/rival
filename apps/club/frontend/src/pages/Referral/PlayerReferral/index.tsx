import Card from '@rival/common/components/Card';
import Loader from '@rival/common/components/Loader';
import axios from '@/utils/axios';
import Table from '@rival/common/components/Table';
import Copy from '@rival/common/components/Copy';
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import { formatCustom } from '@/utils/dayjs';
import FacebookIcon from '@rival/common/metronic/icons/duotune/social/soc004.svg?react';
import TwitterIcon from '@/assets/x.svg?react';
import EmailIcon from '@rival/common/metronic/icons/duotone/Communication/Mail-at.svg?react';
import { Link } from 'react-router-dom';
import useConfig from '@/utils/useConfig';
import { getFacebookLink, getTwitterLink, getEmailLink } from '@rival/club.backend/src/social';
import Header from '@/components/Header';
import useBreakpoints from '@rival/common/utils/useBreakpoints';
import classnames from 'classnames';
import style from './style.module.scss';

const PlayerReferral = (props) => {
    const currentUser = useSelector((state) => state.auth.user);
    const config = useConfig();
    const size = useBreakpoints();

    const { data: referrals, isLoading } = useQuery('getReferrals', async () => {
        const response = await axios.put('/api/users/0', { action: 'getReferrals' });
        return response.data.data;
    });

    if (isLoading) {
        return <Loader loading />;
    }

    const isSmall = ['xs', 'sm', 'md'].includes(size);
    const isMobile = size === 'xs';

    const columns = [
        ...(isSmall
            ? [
                  {
                      name: 'namedate',
                      label: 'Name',
                      render: (value, row) => (
                          <div>
                              <div className="mt-2">
                                  <Link to={`/player/${row.slug}`} className="fw-semibold">
                                      {row.firstName + ' ' + row.lastName}
                                  </Link>
                              </div>
                              <div data-playwright-placeholder="middle">
                                  {formatCustom(row.createdAt, 'MMM\xa0D, YYYY, h:mm A')}
                              </div>
                          </div>
                      ),
                  },
                  {
                      name: 'yesno',
                      label: (
                          <div className="text-center">
                              Match/
                              <br />
                              Payment
                          </div>
                      ),
                      className: 'text-center',
                      render: (value, row) => {
                          const playedMatch = row.playedMatch ? (
                              <span className="text-success fw-semibold">Yes</span>
                          ) : (
                              <span className="text-danger fw-semibold">No</span>
                          );
                          const madePayment = row.madePayment ? (
                              <span className="text-success fw-semibold">Yes</span>
                          ) : (
                              <span className="text-danger fw-semibold">No</span>
                          );

                          return (
                              <div className="text-nowrap">
                                  {playedMatch} / {madePayment}
                              </div>
                          );
                      },
                  },
              ]
            : [
                  {
                      name: 'name',
                      label: 'Name',
                      className: 'fw-semibold',
                      render: (value, row) => (
                          <Link to={`/player/${row.slug}`}>{row.firstName + ' ' + row.lastName}</Link>
                      ),
                  },
                  {
                      name: 'createdAt',
                      label: 'Registered',
                      render: (value) => (
                          <span data-playwright-placeholder="middle">
                              {formatCustom(value, 'MMM\xa0D, YYYY, h:mm A')}
                          </span>
                      ),
                  },
                  {
                      name: 'playedMatch',
                      label: 'Played a Match',
                      className: 'text-center',
                      render: (value) =>
                          value ? (
                              <span className="text-success fw-semibold">Yes</span>
                          ) : (
                              <span className="text-danger fw-semibold">No</span>
                          ),
                  },
                  {
                      name: 'madePayment',
                      label: 'Made a Payment',
                      className: 'text-center',
                      render: (value) =>
                          value ? (
                              <span className="text-success fw-semibold">Yes</span>
                          ) : (
                              <span className="text-danger fw-semibold">No</span>
                          ),
                  },
              ]),
        {
            name: 'total',
            label: 'Credit',
            className: 'text-center',
            render: (value, row) => {
                const credit =
                    (row.playedMatch ? config.referralFirstMatchCredit / 100 : 0) +
                    (row.madePayment ? config.referralFirstPaymentCredit / 100 : 0);
                return credit > 0 ? `$${credit}` : '-';
            },
        },
    ];

    const totalCredit = referrals.reduce((sum, row) => {
        if (row.playedMatch) {
            sum += config.referralFirstMatchCredit;
        }
        if (row.madePayment) {
            sum += config.referralFirstPaymentCredit;
        }

        return sum;
    }, 0);

    const referralLink = `${window.location.origin}/ref/${currentUser.referralCode}`;

    return (
        <div>
            <Header title="Referral Program" />
            <Card>
                <div className={style.wrapper}>
                    <div className={style.content}>
                        <h3>How to Earn Referral Credit</h3>
                        <p>
                            Get <b>${(config.referralFirstMatchCredit + config.referralFirstPaymentCredit) / 100}</b>{' '}
                            for every player following your referral link:
                        </p>
                        <ul>
                            <li className="m-0">
                                <b>${config.referralFirstMatchCredit / 100}</b> when the player finishes their first
                                match
                            </li>
                            <li className="m-0">
                                <b>${config.referralFirstPaymentCredit / 100}</b> when the player makes their first
                                payment
                            </li>
                        </ul>

                        <h3>Your Referral Link</h3>
                        <div>Share your referral link to anyone interested in playing:</div>

                        <div className="mb-4">
                            <Copy
                                label={
                                    <a href={referralLink} className="fw-semibold" data-playwright-placeholder="long">
                                        {referralLink}
                                    </a>
                                }
                                stringToCopy={referralLink}
                            />
                        </div>

                        <div className={style.buttonArea}>
                            <a
                                className={'btn btn-sm ' + style.facebook}
                                href={getFacebookLink(window.location.origin, currentUser.referralCode)}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <i className="svg-icon svg-icon-2">
                                    <FacebookIcon />
                                </i>
                                Share on Facebook
                            </a>

                            <a
                                className={'btn btn-sm ' + style.twitter}
                                href={getTwitterLink(window.location.origin, currentUser.referralCode)}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <i className="svg-icon svg-icon-2">
                                    <TwitterIcon />
                                </i>
                                Share on X
                            </a>

                            <a
                                className={'btn btn-sm ' + style.email}
                                href={getEmailLink(window.location.origin, currentUser.referralCode)}
                            >
                                <i className="svg-icon svg-icon-2">
                                    <EmailIcon />
                                </i>
                                Share via Email
                            </a>
                        </div>
                    </div>
                    <div className={style.cardExample}>
                        <h3>How the Post Will Appear When You Share!</h3>
                        <div className={style.card}>
                            <div className={style.image} />
                            <div className="p-4">
                                <div className={style.url} data-playwright-placeholder="middle">
                                    {window.location.host}
                                </div>
                                <div className={style.title}>Rival Tennis Ladder</div>
                                <div className={style.description}>
                                    Play tennis any day, any time, at any court with local players on your level.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <h3>Your Referrals</h3>
                {referrals.length === 0 ? (
                    <div>No players yet</div>
                ) : (
                    <>
                        <div className="mb-4">
                            Total credit earned: <span className="fw-semibold">${totalCredit / 100}</span>
                        </div>
                        <Table
                            className={classnames('table tl-table', !isMobile && 'w-auto')}
                            columns={columns}
                            data={referrals}
                        />
                    </>
                )}
            </Card>
        </div>
    );
};

export default PlayerReferral;
