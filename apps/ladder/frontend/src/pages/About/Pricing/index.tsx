import Card from '@/components/Card';
import ScrollToTop from '@/components/ScrollToTop';
import Header from '@/components/Header';
import useConfig from '@/utils/useConfig';
import { useQuery } from 'react-query';
import Loader from '@/components/Loader';
import FirstSeasonFree from './free-first-season.svg?react';
import style from './style.module.scss';

const Pricing = props => {
    const { data, isLoading } = useQuery('/api/seasons/0');
    const config = useConfig();

    if (isLoading) {
        return <Loader loading />;
    }

    const tournament = data.nextTournament || data.latestTournament;
    const isFree = tournament?.season?.isFree === 1;

    return (
        <div className="tl-front">
            <Header
                title="Pricing"
                description={`Learn about the costs associated with joining the ${config.city} Rival Tennis Ladder, as well as how to pay for your ladder selection.`}
            />
            <ScrollToTop />
            <h2 className="text-white mt-4">Pricing</h2>
            <Card>
                <p>
                    The main goal of the Rival Tennis Ladder is to encourage participation and create excitement around
                    tennis. That’s why we always aim to keep the cost associated with participating on the ladder as low
                    as possible. That said, these fees we collect help us operate Rival Tennis Ladder and pay for costs
                    associated with employees, servers, events, and prizes. Here, we will break down all you need to
                    know about pricing and prizes for Rival Tennis Ladder.
                </p>

                {isFree && (
                    <>
                        <h3>Participation in {config.city}</h3>
                        <p>
                            While we do have certain costs, we believe it is important to offer an amazing tennis ladder
                            experience for everyone before requiring people to pay. People are the most important part
                            of the tennis ladder, and we want there to be sufficient participation across the board.
                            With that in mind, the{' '}
                            <b>
                                Rival Tennis Ladder will be free in {config.city} until we have a minimum of 150 active
                                players.
                            </b>
                        </p>
                    </>
                )}

                <h3>Costs</h3>
                <div className={style.freeEntry}>
                    <FirstSeasonFree />
                </div>
                <p>
                    When it comes to paying for the Rival Tennis Ladder, pricing is based on a seasonal basis. Also, you
                    will have to pay for each ladder you choose to join. Payments are made directly through the Rival
                    Tennis Ladder website. Here are the costs for the ladder:
                </p>
                <ul>
                    <li className="mb-0">
                        <strong>${config.singlesCost / 100}</strong> per Singles ladder (
                        <strong>${(config.singlesCost - config.earlyRegistrationDiscount) / 100}</strong> for payment
                        before the season begins)
                    </li>
                    <li>
                        <strong>${config.doublesCost / 100}</strong> per Doubles ladder (
                        <strong>${(config.doublesCost - config.earlyRegistrationDiscount) / 100}</strong> for payment
                        before the season begins)
                    </li>
                </ul>
                <p>
                    We never want to see anyone avoid trying the tennis ladder due to the cost per season. That’s why we
                    always make the <strong>first season free</strong> for everyone! Now, everybody interested in
                    playing on the tennis ladder can join and try it for themselves.
                </p>

                <h3>Tournament Prizes</h3>
                <div className={style.trophyWrapper}>
                    <div className={style.trophy} />
                    <div>
                        <p>
                            Even though the Rival Tennis Ladder has an entry fee, it’s not all a one-way street! To show
                            our appreciation of players&apos; dedication to tennis and the ladder, we reward the winner
                            and runner-up of each Men’s and Women’s ladder tournament per season.
                        </p>

                        <p>Here are the prizes you can win by participating in Singles:</p>
                        <div className="d-inline-block">
                            {isFree ? (
                                <ul>
                                    <li className="mb-0">
                                        <strong>${config.singlesChampionReward / 100 / 2} gift card</strong> and an
                                        engraved <strong>Championship trophy</strong> to Champions
                                    </li>
                                    <li>
                                        An engraved <strong>Runner-up trophy</strong> to Runner-Ups
                                    </li>
                                </ul>
                            ) : (
                                <ul>
                                    <li className="mb-0">
                                        <strong>${config.singlesChampionReward / 100} gift card</strong> and an engraved{' '}
                                        <strong>Championship trophy</strong> to Champions
                                    </li>
                                    <li>
                                        <strong>${config.singlesRunnerUpReward / 100} gift card</strong> and an engraved{' '}
                                        <strong>Runner-up trophy</strong> to Runner-Ups
                                    </li>
                                </ul>
                            )}
                        </div>

                        <p>Here are the prizes you can win by participating in Doubles:</p>
                        <ul>
                            <li>
                                <strong>${config.doublesChampionReward / 100} credit</strong> and engraved{' '}
                                <strong>Championship trophies</strong> to all Champion teammates
                            </li>
                        </ul>

                        <p>
                            <b>Note:</b> Gift cards and trophies arrive in the mail in the weeks after the tournament
                            results.
                        </p>
                    </div>
                </div>

                <h3>Tournament Requirements</h3>
                <p>
                    To keep tournaments competitive and rewarding, each ladder must meet these requirements for the
                    tournament to occur:
                </p>
                <ul>
                    <li className="mb-0">
                        Minimum of <strong>{config.minMatchesToPlanTournament} ladder matches</strong> completed before
                        the last week of the regular season
                    </li>
                    <li>
                        Minimum of{' '}
                        <strong>{config.minPlayersToRunTournament} registered tournament participants</strong>
                    </li>
                </ul>
                <p>
                    In circumstances where the Final Tournament does not occur, we will give paying participants a
                    credit to their Rival Tennis Ladder Wallet to sign up again for a future season.
                </p>
            </Card>
        </div>
    );
};

export default Pricing;
