import useBreakpoints from '@/utils/useBreakpoints';
import ScrollToTop from '@/components/ScrollToTop';
import Header from '@/components/Header';
import { NtrpGuidelinesLink } from '@/components/NtrpGuidelines';
import getImageSize from '@/utils/getImageSize';
import player from './player.jpg?w=1200;2400&format=jpeg&quality=60&as=metadata';
import style from './style.module.scss';

const Contacts = props => {
    const size = useBreakpoints();

    const isLarge = ['xl', 'xxl', 'lg'].includes(size);

    return (
        <div className="tl-front">
            <Header
                title="Tennis Ladder Rating (TLR)"
                description="Tennis Ladder Rating (TLR) is a measurement of skill that players on the Rival Tennis Ladder can use to assess their ability against other people."
            />
            <ScrollToTop />
            {!isLarge && <h1 className="text-white mt-4">Tennis Ladder Rating</h1>}
            <div className={style.top}>
                <picture>
                    <source
                        media="(min-width: 800px) and (min-resolution: 2dppx), (min-width: 1600px)"
                        srcSet={getImageSize(player, 2400)}
                    />
                    <img src={getImageSize(player, 1200)} alt="" />
                </picture>
                {isLarge && <h1 className="text-white m-0">Tennis Ladder Rating</h1>}
            </div>
            <div className={style.grid}>
                <p>
                    When we created Rival, we chose to use the <NtrpGuidelinesLink /> as our main method for
                    establishing different tennis ladder levels. Not only are these skill levels well-known in the
                    tennis community, but we believe they are broad enough to encompass several types of players on
                    their journey to improvement.
                </p>
                <p>
                    However, determining where you are between these levels can be challenging. So, we found ourselves
                    looking for an additional way to measure our growth from season to season (outside of just a
                    win-loss ratio). That’s why we created the <b>Tennis Ladder Rating or TLR</b>.
                </p>

                <h3>What&apos;s TLR?</h3>
                <p>
                    In short, <b>TLR is a dynamic NTRP number</b> assigned to each player to assess skill level on a
                    per-match basis. With this rating, players can track their progress, compare their level to others,
                    and find better matchups for their rating.
                </p>
                <p>
                    While other ratings, such as UTR and the ITF World Tennis Number, compare you to every person in the
                    world, TLR aims to provide you with a meaningful comparison between yourself and other players on
                    Rival Tennis Ladder in your city. We believe people are less interested in comparing themselves to
                    everyone and more immersed in determining their skills against people in their area, and TLR focuses
                    on that experience.
                </p>
                <p>
                    Let’s be honest. Most of us are never going to play against an ATP pro, nor are we going to play
                    tennis against someone in Australia. So, why would we want a ranking that compares us to those
                    players? TLR is local and relatable to the average person playing competitive tennis in their
                    hometown.
                </p>

                <h3>How Do You Get a TLR?</h3>
                <p>
                    With Rival, you don’t have to pay extra fees or jump through some skills course to get your TLR.
                    Instead, all you have to do is <b>play 10 matches to get your initial TLR</b>. Why 10 matches? Well,
                    during that period of time, we take into account the skill level of each of your opponents to
                    determine where you stand currently. After those 10 matches, you can start gaining (or losing) TLR
                    based on how you perform in each match.
                </p>

                <h3>How Do We Calculate TLR?</h3>
                <p>
                    Of course, we do some calculations behind the scenes, but TLR is easy for anyone to understand! Here
                    are the details we use to calculate your TLR:
                </p>

                <ul>
                    <li>
                        <b>Match history</b>: TLR is sensitive to how many matches you have played. In the beginning,
                        your TLR will change more quickly. At this point, we are unsure if your wins and losses are
                        lucky or just off-days. As you play matches, your TLR will change more slowly. With additional
                        data, we become more confident in our capability to predict the result of each match. People
                        tend to improve gradually in tennis, and this model supports that idea. One exception: TLR
                        speeds back up if a player hasn’t played for a long time.
                    </li>
                    <li>
                        <b>Set scores</b>: With TLR, our motto is, “Every Game Matters.” That’s because your TLR changes
                        depending on the set score. If you win in straight sets (6-3, 6-4), you’ll receive more TLR
                        points compared to if you win a close match in three sets (7-5, 4-6, 6-3). It’s important to
                        close a match out earlier to reach your maximum TLR potential.
                    </li>
                    <li>
                        <b>Competitiveness</b>: The strength of your opponent will determine the maximum number of
                        points you can achieve. You’ll receive more TLR points for beating a stronger opponent compared
                        to a weaker one. You’ll lose more points if you lose to a weaker opponent compared to a stronger
                        one. It’s also possible to lose points, even if you win. If you’re heavily favored against your
                        opponent and barely win (7-6, 5-7, 7-6), you could potentially lose points. In this situation,
                        we expect the much stronger player to win easily.
                    </li>
                </ul>

                <h3>What’s the Best Way to Improve Your TLR?</h3>
                <p>
                    Improving your TLR is a lot like learning to cook: You’re not going to be a Michelin Star Chef after
                    cooking just a few dishes. Improving your TLR takes time, patience, and practice. Here are a few
                    suggestions for getting the most TLR points possible:
                </p>
                <ul className="mb-0">
                    <li>
                        <b>Play comparable players</b>: Find players on the ladder who are within 0.1 points of your TLR
                        rating. These matches will be challenging, but not overwhelming. If you keep taking on players
                        of this caliber, you will move up incrementally.
                    </li>
                    <li>
                        <b>Always be closing</b>: Going alongside the “Every Game Matters” motto we have around here,
                        you have to close out matches. If you’re up 5-2 in the second set, you can’t let it go to three
                        sets. Closing out matches earlier means getting more TLR points.
                    </li>
                    <li>
                        <b>Practice, practice, practice</b>: TLR is based on expertise, so the fundamentals, such as
                        your serve, backhand, forehand, overhead, or volleys, are essential to increasing your rating.
                        Take time off the court to work on some aspects that are leading to your defeat, then your TLR
                        will reflect that practice in your match scores and points awarded.
                    </li>
                    <li>
                        <b>Consider moving down a level</b>: Are you consistently losing TLR to players on your current
                        ladder? Move down a level to play more comparable players based on your current TLR. If your
                        rating is 3.65, for instance, you may still want to spend some time on the 3.5 level before
                        transitioning completely to the 4.0.
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Contacts;
