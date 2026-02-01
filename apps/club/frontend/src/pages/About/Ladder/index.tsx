import useBreakpoints from '@rival/common/utils/useBreakpoints';
import ScrollToTop from '@rival/common/components/ScrollToTop';
import Header from '@/components/Header';
import { NtrpGuidelinesLink } from '@rival/common/components/NtrpGuidelines';
import { Link } from 'react-router-dom';
import useConfig from '@rival/common/utils/useConfig';
import racket from './racket.jpg?w=1200;2400&format=jpeg&quality=60&as=metadata';
import getImageSize from '@rival/common/utils/getImageSize';
import style from './style.module.scss';

const Contacts = (props) => {
    const size = useBreakpoints();
    const config = useConfig();

    const isLarge = ['xl', 'xxl', 'lg'].includes(size);

    return (
        <div className="tl-front">
            <Header
                title="About"
                description={`Learn more about the Rival Tennis Ladder in ${config.city}, including why we created it, how it works, and how to start playing on the ladder today.`}
            />
            <ScrollToTop />
            {!isLarge && <h1 className="text-white mt-4">Rival Tennis Ladder</h1>}
            <div className={style.top} data-bs-theme="light">
                <picture>
                    <source
                        media="(min-width: 800px) and (min-resolution: 2dppx), (min-width: 1600px)"
                        srcSet={getImageSize(racket, 2400)}
                    />
                    <img src={getImageSize(racket, 1200)} alt="" />
                </picture>
                {isLarge && (
                    <div>
                        <h1 className="m-0">Rival Tennis Ladder</h1>
                        <h2>The last tennis ladder you’ll ever need</h2>
                    </div>
                )}
            </div>
            <div className={style.content}>
                <h3>Competition for Anyone, Fun for Everyone</h3>
                <p>
                    The goal of Rival Tennis Ladder is to bring equivalent and comparable tennis competition to players
                    in their local cities using a shared ladder system with statistics, profiles, ratings, and an
                    equitable point structure.
                </p>

                <p>
                    One of the hardest things about playing tennis is finding people in your area who are on your level
                    and want to compete. Nobody wants to be beaten 6-0, 6-0, or vice versa. What’s the fun in that?
                </p>

                <p>
                    At Rival Tennis Ladder, we have created a system where anybody can play any day of the week against
                    similarly skilled players and have fun doing it. With Rival Tennis Ladder, tennis can be about
                    getting exercise, facing competition, and setting goals for yourself along the way, the way tennis
                    is meant to be.
                </p>

                <h3>Our Start in Raleigh, North Carolina</h3>
                <p>
                    The idea for the Rival Tennis Ladder started after both of the founders participated in the Tennis
                    Challenge Ladder through the Millbrook Exchange Tennis Center in Raleigh, North Carolina. Players
                    here were active and enticed by the ladder structure, points distribution, and final tournaments
                    that the Raleigh Parks and Recreation Department offered. However, the software associated with this
                    ladder was minimalistic and lacked the features of modern tennis ladders.
                </p>
                <p>
                    Therefore, we created Rival Tennis Ladder to enhance the points system of the original ladder and
                    create an all-encompassing tennis ladder for players interested in stats, profile customization,
                    expertise tracking, and much more. Today, Raleigh utilizes Rival Tennis Ladder to carry out their
                    multi-decade tennis ladder legacy. With hundreds of participants across multiple Men’s and Women’s
                    ladders, Raleigh’s tennis ladder is more active than ever, and it’s a testament to how tennis
                    ladders can function in cities all across the United States.
                </p>
                <p>
                    Want to learn more about the Raleigh Tennis Ladder and see how Rival Tennis Ladder functions there?
                    Visit the{' '}
                    <a href="https://raleigh.tennis-ladder.com" target="_blank" rel="noreferrer">
                        Raleigh Rival Tennis Ladder website
                    </a>{' '}
                    to see matches, proposals, and players having fun and exercising on one of the best tennis ladders
                    in the nation.
                </p>
                <div className={style.example} />

                <h3>How Does It Work?</h3>
                <p>
                    For a quick rundown of how the Rival Tennis Ladder works, let’s take a short look at this
                    walkthrough on how players can schedule a match:
                </p>

                <ol>
                    <li>
                        In the Rival Tennis Ladder software, players register for the level(s) they want to play based
                        on the <NtrpGuidelinesLink /> and pay an entry fee.
                    </li>
                    <li>
                        Once registered and added to the system, players can send out general proposals (with the date,
                        time, and location they want to play).
                    </li>
                    <li>
                        Opponents accept these proposals, all players agree upon the arrangements, and then they show up
                        on the agreed-upon day to play the match.
                    </li>
                    <li>
                        All players bring an unopened can of pressurized tennis balls, open one can, and spend a short
                        time warming up together before the match.
                    </li>
                    <li>
                        One player spins a racquet defining an up or down to the symbol on the butt cap, and the other
                        player chooses. If the player chooses correctly, they can opt to serve or receive in the first
                        game, and the other player selects their preferred side.
                    </li>
                    <li>
                        The players play a best 2-out-of-3 set match with a 7-point tiebreak at 6-6. Players may
                        collectively choose to forgo the third set in lieu of a 10-point tiebreak.
                    </li>
                    <li>
                        The winning player or team keeps the can of unopened balls and reports the score into the system
                        before the end of the week. All players earn points for the season based on participation, as
                        well as receive adjustments to their personal <Link to="/tlr">Tennis Ladder Rating (TLR)</Link>.
                    </li>
                </ol>

                <p>
                    It’s that simple! Through Rival Tennis Ladder, players can stay active and play as many matches as
                    they want. At the end of the season, there is a single-elimination tournament that crowns one person
                    from each Single ladder as the champion (which comes with a sweet prize). For Doubles, there is a
                    three-round matchup between the Top 4 players, with the winner being the person to win the most
                    games out of 24 when paired with each player.
                </p>

                <h3>How Do I Get Started?</h3>

                <p>
                    All right, now you should be pretty pumped about participating through Rival Tennis Ladder for your
                    city’s ladder. We know we are! Get started in your local Rival Tennis Ladder by following these
                    steps:
                </p>

                <ol>
                    <li>
                        Register for your ladder(s) of choice by using the <NtrpGuidelinesLink />.
                    </li>
                    <li>Pay any associated dues to access the Rival Tennis Ladder for one season.</li>
                    <li>
                        Read the <Link to="/rules">Rival Tennis Ladder Rules</Link> and{' '}
                        <Link to="/scoring">Scoring</Link> documents before proceeding. We also recommend reading about
                        the <Link to="/tlr">TLR system</Link>.
                    </li>
                    <li>
                        Create your profile on the Rival Tennis Ladder to showcase your avatar, playing style, and
                        preferred equipment. It’s optional, but we recommend it!
                    </li>
                    <li>Start making proposals or accepting them yourself.</li>
                    <li>Get out, play matches, and report your wins in the system.</li>
                    <li>
                        Participate in the final tournament for the season if you make the top eight. Otherwise, prepare
                        yourself for the next season to get a brand-new start.
                    </li>
                </ol>

                <h3>Other Rival Tennis Ladder Resources</h3>
                <p>
                    While it may seem like a lot at first, getting started with Rival Tennis Ladder is as easy as
                    swinging a racquet. For reference, here are some popular pages and guides to find everything you
                    need to know about playing on the ladder, following the rules, and even contacting us if you need
                    any help:
                </p>

                <ul className="mb-0">
                    <li className="mb-0">
                        <Link to="/register">Registration Page for New Users</Link>
                    </li>
                    <li className="mb-0">
                        <Link to="/login">User Sign In Page</Link>
                    </li>
                    <li className="mb-0">
                        <Link to="/rules">What Are the Rules?</Link>
                    </li>
                    <li className="mb-0">
                        <Link to="/scoring">How Scoring Works</Link>
                    </li>
                    {/* <li  className="mb-0"> */}
                    {/*     <Link to="">Video Guide to Getting Started</Link> */}
                    {/* </li> */}
                    <li className="mb-0">
                        <Link to="/tlr">Learning About the TLR System</Link>
                    </li>
                    <li className="mb-0">
                        <Link to="/founders">The Founders of Rival Tennis Ladder</Link>
                    </li>
                    <li className="mb-0">
                        <Link to="/contacts">Our Contact Us Page</Link>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Contacts;
