import useBreakpoints from '@rival/common/utils/useBreakpoints';
import ScrollToTop from '@rival/common/components/ScrollToTop';
import Header from '@/components/Header';
import useConfig from '@rival/common/utils/useConfig';
import scoring from './scoring.jpg?w=1200;2400&format=jpeg&quality=60&as=metadata';
import getImageSize from '@rival/common/utils/getImageSize';
import style from './style.module.scss';

const Contacts = (props) => {
    const size = useBreakpoints();
    const config = useConfig();

    const isLarge = ['xl', 'xxl', 'lg'].includes(size);

    return (
        <div className="tl-front">
            <Header
                title="Scoring"
                description={`Find out how to earn points on the ${config.city} Rival Tennis Ladder and explore our in-depth breakdown of ladder scoring calculations.`}
            />
            <ScrollToTop />
            {!isLarge && <h1 className="text-white mt-4">Scoring</h1>}
            <div className={style.top}>
                <picture>
                    <source
                        media="(min-width: 800px) and (min-resolution: 2dppx), (min-width: 1600px)"
                        srcSet={getImageSize(scoring, 2400)}
                    />
                    <img src={getImageSize(scoring, 1200)} alt="" />
                </picture>
                {isLarge && (
                    <div>
                        <h1 className="text-white m-0">Scoring</h1>
                    </div>
                )}
            </div>
            <div className={style.content}>
                <p>
                    At this point, you&apos;ve joined your local tennis ladder, and you&apos;re ready to start playing.
                    However, you might find yourself wondering, “How do I score points?” and “Why do I need points
                    anyways?” In this guide, we&apos;ll cover all the details about scoring on Rival Tennis Ladder so
                    you can get the most points per match.
                </p>

                <h3>The ‘Point&apos; of Points in Rival Tennis Ladder</h3>
                <p>
                    In Rival Tennis Ladder, there are four multi-week tennis seasons that align with spring, summer,
                    fall, and winter. During each season, players compete against one another within their level to gain
                    points and move up the ladder. These points determine the final eight players who qualify for the
                    single-elimination tournament at the end of the Singles season. One of these players is crowned the
                    champion of that season and level after winning three consecutive matches against the other
                    participants.
                </p>
                <p>
                    Doubles in the Rival Tennis Ladder works in much the same way. While other ladders force you into
                    predefined Doubles teams, on the Rival Tennis Ladder, players are ranked on the ladder individually
                    and gain points by playing with other players. Whether you want to pair up with someone random or
                    play a match with someone you already know, the choice is up to you. In Doubles, the final
                    tournament is a three-round format where the Top 4 players compete for the most games out of 24 in
                    total.
                </p>
                <p>
                    So, in short, if you want to play the final tournament at the end of each season, you need to score
                    points to qualify. Now that you know why you need points, let&apos;s dive into how to get points by
                    playing tennis matches.
                </p>

                <h3>Earning Points Through Play</h3>
                <p>
                    Players participating in Rival Tennis Ladder can gain points by playing matches. In this system, you
                    don&apos;t have to win necessarily to get points. Rather, we base the points received on set scores,
                    challenges, and player ranking positions. Our aim is to encourage participants to play as much as
                    possible by using a scoring system that benefits everyone.
                </p>
                <p>
                    If you win your matches (best 2-out-of-3 set format), then you are awarded additional points for
                    that achievement. Alternatively, if you stop playing for a while, your ranking will fall compared to
                    other, more active players.
                </p>

                <h3 id="score_breakdown">Breakdown of Rival Tennis Ladder Scoring</h3>
                <p>
                    All right, now that you know you need points and how to get them, let&apos;s take a closer look at
                    how the scoring calculations are done. The following list offers all the ways you can earn points on
                    the ladder:
                </p>
                <ul>
                    <li>
                        All players receive <b>2 points for participating</b>, no matter the result of the match.
                    </li>
                    <li>
                        <b>Challengers receive 2 extra points</b> for initiating the match. These points may be gained
                        by sending out proposals. For Doubles, each player on the proposing team receives 2 additional
                        points.
                    </li>
                    <li>
                        Point calculations are based on the{' '}
                        <b>player&apos;s ranking on the date the match is reported</b>. This practice ensures we are
                        using the most up-to-date player ranking for scoring. For Doubles, we average the rank of each
                        team&apos;s players to establish their rank.
                    </li>
                    <li>
                        <b>Lower-ranked players or teams receive 15 points</b> for beating a higher-ranked player or
                        team, plus points using the following formula: (Difference in ranks, Min 2) x (Total difference
                        in games across all sets, Min 2) / 2.
                    </li>
                    <li>
                        <b>Winning players or teams tied in rank</b> with another player or team will earn 15 points,
                        plus the total difference in games across all sets.
                    </li>
                    <li>
                        <b>Higher-ranked players or teams receive 10 points</b>, plus the total difference in games
                        across all sets.
                    </li>
                    <li>
                        Winning players or teams can only score a <b>maximum of 40 points</b> in one match.
                    </li>
                    <li>
                        Singles players who report a <b>Default win receive 20 points</b>.
                    </li>
                    <li>
                        <b>Losing players or teams receive points equal to the total games won</b> in all sets, but they
                        cannot exceed 10 points.
                    </li>
                    <li>
                        Lower-ranked players or teams who beat higher-ranked players or teams{' '}
                        <b>more than 10 places above them</b> may only receive points as if they are only 10 places
                        apart.
                    </li>
                    <li>
                        All scores and calculations are <b>rounded up to the nearest whole number</b>.
                    </li>
                    <li>
                        <b>New rankings generate at midnight each Sunday</b> based on matches played in the previous
                        week.
                    </li>
                </ul>

                <h3>Example Singles Scoring Scenario</h3>
                <p>
                    Okay, we get it. You want to play tennis, not take a math class. That said, let&apos;s consider a
                    real-world scoring example to get a sense of how all these points might shake out.
                </p>
                <ol>
                    <li>Mark (ranked 8) challenges and defeats John (ranked 3) with a score of 4-6, 6-4, 6-3.</li>
                    <li>
                        Mark would receive <b>2 points for challenging</b>.
                    </li>
                    <li>
                        Mark would receive <b>15 points for beating a higher-ranked player</b>.
                    </li>
                    <li>
                        Mark would receive <b>13 points extra for games won</b> - [(Difference of 5 games in sets 2 and
                        3) x (8 rank of Mark - 3 rank of John) / 2]
                    </li>
                    <li>
                        <b>Mark&apos;s total points would equal 30</b> for this match (2 + 15 + 13).
                    </li>
                    <li>
                        John would receive <b>10 points maximum</b> out of 13 games won in the match.
                    </li>
                </ol>
            </div>
        </div>
    );
};

export default Contacts;
