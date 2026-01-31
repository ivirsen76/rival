import { Link } from 'react-router-dom';
import classnames from 'classnames';
import Tabs from './Tabs';
import Badge from '@rival/common/components/Badge';
import Timeline from './Timeline';
import Elo from './Elo';
import allBadges from '@rival/club.backend/src/utils/badges';
import AndrewSrc from '../Founders/Andrew.svg';
import IgorSrc from '../Founders/Igor.svg';
import { Title } from '@rival/common/components/Statbox';
import { HashLink } from 'react-router-hash-link';
import RacketToLogo from './RacketToLogo';
import BallToLogo from './BallToLogo';
import RivalLogo from '@/assets/logo.svg?react';
import OldRivalLogo from '@/assets/rival.svg?react';
import { Squircle } from 'corner-smoothing';
import style from './style.module.scss';

const badgeStats = {
    matchesTotal: 837,
    matchesWon: 315,
    proposalsCreated: 367,
    proposalsAccepted: 168,
    rivalries: 66,
    tiebreaks: 109,
    feedbacks: 1,
    isAvatarCreated: true,
    hasAbout: true,
    hasTennisStyle: true,
    hasEquipment: true,
    seasonsPlayed: {
        winter: 253,
        spring: 160,
        summer: 205,
        fall: 219,
    },
    seasonsParticipated: {
        37: true,
        38: true,
        39: true,
        40: true,
        41: true,
        42: true,
        43: true,
        44: true,
        45: true,
        46: true,
        47: true,
        48: true,
        49: true,
        50: true,
        51: true,
        52: true,
        53: true,
        54: true,
        56: true,
        57: true,
        58: true,
        59: true,
        60: true,
        61: true,
        62: true,
        63: true,
        64: true,
        65: true,
        66: true,
        67: true,
    },
    statsUploaded: false,
    maxPlayedInWeek: 6,
    wonManyGamesMatch: true,
    playedSinglesDoubles: false,
    doubleImpact: true,
    beatMuchStrongerPlayer: true,
    beatOnTwoTiebreaks: true,
    doubleBageled: true,
    comebacks: 45,
    revenge: true,
    levels: {
        3: {
            id: 3,
            maxTLR: 1696,
            maxPoints: 548,
            tournamentResult: 'final',
            minFinalSpot: 0,
            seasonPoints: {},
        },
    },
    payload: {
        beatMuchStrongerPlayer: [],
        beatOnTwoTiebreaks: [],
        doubleBageled: [],
        comebacks: [],
        tiebreaks: [],
        rivalries: {
            recent: [],
            candidates: [],
        },
        revenge: {
            players: [],
            candidates: {},
        },
        wonManyGamesMatch: [],
        maxPlayedInWeek: {},
        doubleImpact: {},
        latestMatches: [],
        latestWins: [],
        latestProposalsSent: [],
        latestProposalsAccepted: [],
        seasons: [],
    },
    sum: {
        prevMatchWonAt: '',
        playedSinglesSeasonId: 0,
        playedDoublesSeasonId: 0,
        prevWeekNumber: 0,
        weekNumberCount: 0,
        maxPoints: {},
        rivalries: {},
        revenge: {},
    },
};

const finalTournamentStructure = (
    <div>
        <p>
            Moving forward, the structure of the Final Tournament will depend on the number of players before the last
            week of the regular season.
        </p>
        <ul>
            <li>
                <b>Fewer than 50 players</b>: Top 8 players compete in three rounds (Quarterfinal, Semifinal, and
                Final).
            </li>
            <li>
                <b>50-74 players</b>: Top 12 players compete in four rounds (Round of 16, Quarterfinal, Semifinal, and
                Final). Top 4 players will receive a Bye for the first round.
            </li>
            <li>
                <b>75 players or more</b>: Top 16 players will compete in four rounds (Round of 16, Quarterfinal,
                Semifinal, and Final).
            </li>
        </ul>

        <p>
            All tournaments will take two weeks, and the tournament calendar will adjust based on the number of players.
        </p>
        <h4>
            Three Rounds <span className="fw-normal">(Top 8)</span>
        </h4>
        <div className="mb-6">
            <div>
                <b>Quarterfinalists</b> will play between Monday and Saturday of Week 1.
            </div>
            <div>
                <b>Semifinalists</b> will play between Sunday Week 1 and Friday Week 2.
            </div>
            <div>
                <b>Finalists</b> will play at the weekend of Week 2.
            </div>
        </div>
        <Timeline totalPlayers={25} />

        <h4>
            Four Rounds <span className="fw-normal">(Top 12 / Top 16)</span>
        </h4>
        <div className="mb-6">
            <div>
                <b>Round of 16 participants</b> will play between Monday and Saturday of Week 1.
            </div>
            <div>
                <b>Quarterfinalists</b> will play between Sunday Week 1 and Friday Week 2.
            </div>
            <div>
                <b>Semifinalists</b> will play on Saturday of Week 2.
            </div>
            <div>
                <b>Finalists</b> will play on Sunday of Week 2.
            </div>
        </div>
        <Timeline totalPlayers={60} />

        <div className="mt-12 fst-italic">
            Players who complete their matches before the next round may play the next match early.
        </div>
    </div>
);

const limitingLadderLevels = (season) => (
    <div>
        <p>
            Starting with the {season} Season, we will limit the Singles ladders players can join based on their
            established TLR. Players will have to be within a <b>TLR of 0.5 to qualify for a specific ladder</b>. For
            example, players who wish to join the Men&apos;s 3.5 ladder must have a TLR between 3.00 and 4.00. In this
            situation, players above a TLR of 4.00 or below 3.00 will have to join a higher or lower ladder,
            respectively. Players without an established TLR will still be able to choose any ladder they believe aligns
            with their current skill as they continue to achieve the 10 matches needed to establish their initial TLR.
        </p>

        <div className="mb-4">
            <Elo />
        </div>

        <p>
            So, why are we making this change? Since the creation of Rival Tennis Ladder, we have been developing and
            refining the TLR metric to better assess player skill on a per-match basis. We feel TLR is primed and ready
            to act as an active guide for players and what ladders apply best to them. Our mission at Rival Tennis
            Ladder has always been to bring skill-based tennis competition to local players using our application, and
            we believe this change will enhance our community in the following ways:
        </p>

        <ul>
            <li>
                <b>Stronger players will move up.</b> Nobody wants to lose 6-0, 6-0 to a player who is way beyond their
                skill range. While looking at wins and losses can be helpful for placing players, TLR will definitively
                tell us when players are playing on ladders below their level. That means we will get closer to
                eliminating seasons where a misplaced player dominates the entire season and the tournament.
            </li>
            <li>
                <b>Weaker players will move down.</b> On the flip side, winning quickly against a weaker player can
                diminish the experience and exercise gained for opponents. While we encourage players to challenge
                themselves every time they step on the court, this new system will motivate players to play on a more
                appropriate level to gain TLR and move up accordingly.
            </li>
            <li>
                <b>Matches will become more competitive.</b> When we move players up or down ladders based on TLR, we
                bring the skill level of everyone on each ladder closer together. This regulation means every match will
                be closer, more competitive, and more fulfilling throughout each season. Moreover, tournaments will be
                more exciting and less predictable, adding to the overall experience.
            </li>
        </ul>

        <p>
            That said, there will be circumstances where players do not align with their TLR. For example, a player may
            succumb to an injury for a prolonged period, or they might move to another city or state and improve
            drastically when they are away. In these types of circumstances, we will consider player input and make
            exceptions on a case-by-case basis.
        </p>
    </div>
);

const tournamentEligibilityContent = (config) => (
    <div>
        <p>
            In our ongoing efforts to create a more balanced and competitive ladder, we added these new eligibility
            rules regarding the Final Tournament:
        </p>
        <ol>
            <li>
                Players who are <b>more than 0.5 TLR above their ladder level at the start of the season</b> will not be
                eligible for that level&apos;s Final Tournament. These players will receive a $
                {config.tooHighTlrDiscount / 100} discount due to this limitation since they can only play the regular
                season.
            </li>
            <li>
                Players who establish an <b>initial TLR that&apos;s 0.5 TLR higher than their ladder level</b> will also
                be ineligible for the Final Tournament. They will be encouraged to move up a level to gain eligibility.
            </li>
        </ol>
        <div>
            These changes aim to help maintain fair play and ensure the Final Tournament reflects each ladder&apos;s
            true level of competition.
        </div>
    </div>
);

const getData = ({ config, lazyClass = '' } = {}) => [
    {
        date: '2026-01-14',
        title: 'Proposal Email Filters and Age-Compatible Proposals',
        content: (
            <div>
                <p>
                    Getting too many proposal emails? Players can now customize exactly which proposal emails they
                    receive with our new advanced subscription options. Additionally, we have introduced a{' '}
                    <b>Weekly Schedule tool</b> to ensure you only get proposals for matches that fit your calendar.
                    Here are all the ways you can filter your proposals.
                </p>

                <div className={classnames(style.subscribeForProposals, lazyClass)} />

                <p>
                    Players can now also choose to limit recipients to players within 15 years of their age (above or
                    below) by selecting the advanced age-compatible proposal option.
                </p>

                <div className={classnames(style.ageCompatibleProposal, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2025-12-24',
        title: 'Match Formats and Fast4',
        content: (
            <div>
                <p>
                    Players can now select from <b>Regular</b>, <b>Full 3rd Set</b>, or <b>Fast4</b> match formats when
                    sending a proposal. These new options offer players more flexibility when scheduling matches on the
                    ladder.
                </p>

                <div className="d-flex align-items-start gap-6 mt-8 mb-8">
                    <div className={classnames(style.proposeFast4Match, lazyClass)} />
                    <div className={classnames(style.reportFast4Match, lazyClass)} />
                </div>

                <p>
                    <b>Fast4</b> is a shortened format designed for quicker play (typically under an hour). Here is how
                    it works:
                </p>

                <ul className="mb-8">
                    <li>
                        <b>Structure</b>: Best 2-out-of-3 short sets
                    </li>
                    <li>
                        <b>First to 4</b>: The first player to reach 4 games wins the set (e.g., 4-0, 4-2).
                    </li>
                    <li>
                        <b>Tiebreak at 3-3</b>: If the score reaches 3-3, a 7-point tiebreak is played to decide the
                        set.
                    </li>
                    <li>
                        <b>Deciding Set:</b> If players split sets, a 10-point match tiebreak is played.
                    </li>
                    <li>
                        <b>No-Ad Scoring</b>: At Deuce (40-40), a single &quot;deciding point&quot; is played. The
                        receiver chooses which side (Deuce or Ad) to receive the serve.
                    </li>
                </ul>

                <div>
                    We&apos;ve also updated the <Link to="/rules">Rival Rules</Link> to reflect these new formats and
                    our adoption of a <b>10-point match tiebreak as the default match format</b>.
                </div>
            </div>
        ),
    },
    {
        date: '2025-10-22',
        title: 'Practice Proposals',
        content: (
            <div>
                <p>
                    Players can now create practice proposals. Practice proposals give everyone a chance to hit, rally,
                    and refine their game without the pressure of ladder points, as you won&apos;t report any score.
                    You&apos;ll be able to choose the type of practice you want (ball striking or practice points) and
                    the length of time you want to practice. Plus, you don&apos;t need brand-new balls for these
                    sessions, as old balls are acceptable for practice hits.
                </p>

                <div className={classnames(style.practiceProposalButton, lazyClass)} />
                <div className={classnames(style.practiceProposalForm, lazyClass)} />

                <p>
                    Practice proposals will have a special &quot;P&quot; sign to differentiate them from normal
                    proposals.
                </p>

                <div className={classnames(style.practiceProposal, lazyClass)} />

                <p>As an added bonus, you can earn a new badge for sending your first practice proposal!</p>

                <div className={classnames(style.practicianBadge, lazyClass)} />
            </div>
        ),
    },
    ...(config.isRaleigh
        ? [
              {
                  date: '2025-09-24',
                  title: 'Limiting Ladder Levels',
                  content: limitingLadderLevels('2025 Winter'),
              },
              {
                  date: '2025-08-19',
                  title: 'Updated Final Tournament Eligibility',
                  content: tournamentEligibilityContent(config),
              },
          ]
        : []),
    ...(!config.isRaleigh
        ? [
              {
                  date: '2025-06-03',
                  title: 'Updated Final Tournament Eligibility',
                  content: tournamentEligibilityContent(config),
              },
          ]
        : []),
    {
        date: '2025-05-09',
        title: 'New Rival Logo',
        content: (
            <div>
                <p>
                    Rival Tennis Ladder is growing, and so is our identity. Today, we unveil our new logo, which
                    you&apos;ll find throughout our app, emails, and even avatars.
                </p>
                <div className={style.logoUpgrade}>
                    <Squircle className={style.oldLogo} cornerRadius={30}>
                        <OldRivalLogo />
                    </Squircle>
                    <div>&rarr;</div>
                    <Squircle className={style.newLogo} cornerRadius={30}>
                        <RivalLogo />
                    </Squircle>
                </div>
                <p>
                    Built from the geometry of tennis, this new mark aims to capture the energy and ambition of our
                    rapidly expanding player network. For us, it&apos;s more than just a visual change. This logo is a
                    sign of Rival&apos;s evolution, and we hope to make it a symbol that players across the nation will
                    come to associate with competitive tennis.
                </p>
                <div className="mt-8 mb-8">
                    <RacketToLogo />
                </div>
                <div className="mb-8">
                    <BallToLogo />
                </div>
                <div>
                    As tennis shapes us, we shape tennis. Together, we&apos;re building a better tennis community - one
                    rival at a time.
                </div>
            </div>
        ),
    },
    {
        date: '2025-03-02',
        title: 'Points Calculation Adjustments',
        content: (
            <div>
                <p>
                    Starting in the 2025 Spring Season, we are adjusting the points calculation to promote participation
                    and create a fairer system for all players. We are making these changes based on our own analysis
                    and feedback from the community. Here are the updates you can expect:
                </p>

                <ol className="mb-8">
                    <li>
                        <b>More points for participation:</b> We are adding <b>2 points</b> for participating in any
                        match. Even if you lose 0-6, 0-6, you will still receive at least 2 points.
                    </li>
                    <li>
                        <b>Every set matters:</b> Previously, we calculated points based on the game difference in the
                        sets won by the winner. This meant that players could receive the same points for winning (6-2,
                        6-3) as they would in a match where they lost a set (6-2, 3-6, 6-3). Now, we will calculate
                        points based on the total difference in games across all sets (Min 2).
                    </li>
                    <li>
                        <b>Decreased maximum points per match:</b> We found some players would use the 50-point maximum
                        late in the season to make the tournament. To address this issue, we are reducing the maximum
                        number of points per match to <b>40 points</b>.
                    </li>
                </ol>

                <div className={style.pointsCalculationChanges}>
                    <div className={classnames(style.before, lazyClass)}>
                        <h4 className={style.compare}>Before:</h4>
                        <div />
                    </div>
                    <div className={classnames(style.after, lazyClass)}>
                        <h4 className={style.compare}>After:</h4>
                        <div />
                    </div>
                </div>
            </div>
        ),
    },
    {
        date: '2024-12-06',
        title: 'Introducing Tennis Frames',
        content: (
            <div>
                <p>
                    Players can now upload their own tennis photos to their profiles! Also known as Tennis Frames, these
                    pictures will appear publicly on player profiles, where other players can like, comment, and even
                    react to each image.
                </p>

                <div className={classnames(style.tennisFrames, lazyClass)} />

                <p>
                    Tennis Frames are only meant to be photos related to tennis. So, think about pictures of you playing
                    on the court, enjoying a tennis event with friends, or even showing off your latest tennis
                    equipment. As long as it&apos;s related to tennis, it&apos;s fair game!
                </p>

                <div className={classnames(style.comments, lazyClass)} />

                <p>
                    Tennis Frames will showcase your love for tennis, life as a tennis player, and journey as you climb
                    the ranks in Rival Tennis Ladder. Plus, if you receive enough likes, you may find your post
                    highlighted on our official social media pages!
                </p>
            </div>
        ),
    },
    {
        date: '2024-10-11',
        title: 'Multi-Ladder Match Reporting',
        content: (
            <div>
                <p>
                    Players can now report one match and receive points for multiple ladders. If two players play a
                    match, and they are both registered for the same ladders, we will now count the match for points in
                    each of those ladders. For example, Johnny and Paul are both in the Men&apos;s 3.5 and Men&apos;s
                    4.0 ladders. When Johnny reports the match (in either ladder), we will automatically replicate those
                    results in the other ladder. However, players will only receive one win or loss based on the result
                    of the singular match, and TLR will only be adjusted once.
                </p>
                <div className={classnames(style.multiLadderMatch, lazyClass)} />
                <p className="mt-8">
                    As an added bonus, we will now be providing a <b>$10 discount</b> each time a player signs up for an
                    additional ladder!
                </p>
            </div>
        ),
    },
    ...(!config.isRaleigh
        ? [
              {
                  date: '2024-08-08',
                  title: 'Limiting Ladder Levels',
                  content: limitingLadderLevels('2024 Fall'),
              },
          ]
        : []),
    {
        date: '2024-07-26',
        title: 'Rival Bracket Battle',
        content: (
            <div>
                <p>
                    Players can now participate in the Rival Bracket Battle at the end of each season. Rival Bracket
                    Battle is a post-season game where anyone on the ladder can fill out a tournament bracket, picking
                    who they think will win or lose and make it to the Final. Players can earn points by choosing the
                    correct winner of each matchup and how many sets it will take.
                </p>
                <div className={classnames(style.bracket, lazyClass)} />
                <p>
                    At the end of the tournament, the player with the most points will win the Rival Bracket Battle and
                    receive &quot;The Oracle&quot; badge and <b>$5</b> in credit.
                </p>
                <div className={classnames(style.oracleBadge, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2024-06-28',
        title: 'Top Players',
        content: (
            <div>
                <p>
                    Players can now view the <Link to="/top/mostMatches">top players</Link> of all time across multiple
                    categories, including most matches played, highest TLR reached, and greatest progress made. Players
                    can filter these lists by all players, current players, or by player gender.
                </p>
                <div className={classnames(style.topPlayers, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2024-06-16',
        title: 'Updated Tennis Ladder Rating (TLR)',
        content: (
            <div>
                <p>
                    Starting today, we are releasing a new version of our Tennis Ladder Rating, also known as TLR. In
                    the old system, players started with a TLR of 1500 in each ladder, and they used that rating to
                    gauge their progress against other players on the same ladder. While we believed this system to be
                    effective and specific, we found that new players had a difficult time understanding this metric,
                    and preexisting players weren’t completely sure when to move up or down a ladder. For these reasons,
                    we decided to update the TLR system to better serve the community.
                </p>

                <div className={style.eloToTlr}>
                    <Title>1630</Title>
                    <div>&rarr;</div>
                    <Title colorHue={295}>3.72</Title>
                </div>

                <p>So, what is changing about TLR?</p>

                <ul>
                    <li>
                        <b>TLR will act as a dynamic NTRP rating.</b> Rather than using our previous scale, TLR will now
                        appear as an enhanced NTRP number that goes to two decimal places. For example, a strong Men’s
                        4.0 player may be rated 4.25, while a weak Men’s 3.5 player may be rated 3.15. Your TLR will act
                        as a guiding standard to what ladder you should be on and what players will give you the closest
                        competition.
                    </li>
                    <li>
                        <b>Each player will only have one TLR.</b> While you had a TLR for each ladder in the past, we
                        are combining all your match history and performances into one TLR number. This new TLR takes
                        into account your strength at the time of each match, giving you an updated estimation of your
                        skill level.
                    </li>
                    <li>
                        <b>New players must establish a TLR.</b> Before, we started players at 1500 and adjusted their
                        TLR immediately. Now, new players to Rival must play 10 matches to establish their TLR. This TLR
                        will not only be more accurate as a starting point, but it will help us place players on the
                        appropriate ladders for their skill levels.
                    </li>
                    <li>
                        <b>TLR will be used to enforce ladders.</b> In the future, we will use TLR to prevent players
                        from participating in ladders that are too weak or too strong for their level. It’s essential
                        for us to keep ladders competitive, and we feel this new TLR is a step forward in enforcing more
                        standards surrounding player skill level.
                    </li>
                </ul>

                <p>
                    With these changes, we feel TLR will improve competitiveness throughout Rival Tennis Ladder and
                    better equip our team to help you visualize your tennis improvement.
                </p>

                <p>
                    Want to know more about TLR? Please visit the <Link to="/tlr">Tennis Ladder Rating</Link> page for
                    more details.
                </p>
            </div>
        ),
    },
    {
        date: '2024-05-15',
        title: 'Messages (and Sunsetting Challenges)',
        content: (
            <div>
                <p>
                    Players can now send direct messages to potential opponents by simply navigating to their profile.
                    This system will replace Challenges, effective immediately.
                </p>
                <div className={classnames(style.messageButton, lazyClass)} />
                <p>
                    While Challenges were initially useful for encouraging matches between specific ladder players, we
                    found them to be ineffective in our current system. First, it became common for players to send
                    Challenges without getting a response, resulting in dozens of expired Challenges. Second, when
                    people did accept a Challenge, players frequently wouldn&apos;t follow up and coordinate the
                    matches. For these reasons, we no longer have confidence in Challenges as an effective way to create
                    player interaction, and instead, players who wish to play a specific player may message them
                    directly.
                </p>
            </div>
        ),
    },
    {
        date: '2024-02-23',
        title: 'New Injury Reporting',
        content: (
            <div>
                <p>
                    Players can now report unfinished matches at the time of the injury. Instead of reporting a set
                    score of 6 for all remaining games and sets, users can enter the exact score at the point of
                    stopping the match in the system.
                </p>
                <p>
                    As a result, the winning player will still receive maximum ladder points as if the match was
                    finished. However, each player will only have their TLRs affected based on the number of games
                    played.
                </p>

                <div className={classnames(style.injuryPointsCalculation, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2023-12-21',
        title: 'Apple Calendar Integration',
        content: (
            <div>
                <p>
                    Players can now synchronize their matches with Apple Calendar. Doing so will show all your matches
                    (opponent, time, and place) in your calendar app.
                </p>
                <div className={classnames(style.calendar, lazyClass)} />

                <p>Set up your Apple Calendar integration in your Settings.</p>
                <div className={classnames(style.calendarSettings, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2023-12-06',
        title: 'Dark Mode',
        content: (
            <div>
                <p>
                    Players can now enable Dark mode to change the color scheme of the Rival Tennis Ladder to match
                    their preference.
                </p>
                <div className={classnames(style.darkMode, lazyClass)} />

                <p>Navigate to the Appearance section of your Settings to toggle from Light mode to Dark mode.</p>
                <div className={classnames(style.appearanceSelector, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2023-11-29',
        title: 'Points Calculation',
        content: (
            <div>
                <p>
                    Players can now see how the system calculates points for every match. Visit the{' '}
                    <HashLink to="/scoring/#score_breakdown">scoring breakdown</HashLink> for a more detailed
                    explanation of how the points system works.
                </p>

                <div className={classnames(style.pointsCalculation, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2023-11-17',
        title: 'Complaints',
        content: (
            <div>
                <p>
                    Players can now send us complaints about specific players based on various reasons by selecting the
                    option on the offending player&apos;s profile. We are collecting these complaints in a continued
                    effort to grow and maintain our tennis ladder communities more effectively and comprehensively.
                </p>

                <div className={classnames(style.complaintButton, lazyClass)} />

                <p className="fw-bold">We do not send these complaints directly to the player.</p>
                <p>
                    Instead, if a player receives numerous complaints about their behavior, we will notify them and
                    offer a warning. If this behavior does not improve and players continue to complain, the player will
                    face suspension and an eventual ban from the system.
                </p>
                <p>
                    While we strive to keep all complaints anonymous, players could still guess who made the complaints
                    initially based on the category of complaint and the nature of the explanation. So, please keep that
                    in mind as you fill out the form.
                </p>

                <div className={classnames(style.complaintForm, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2023-10-04',
        title: 'Personal Notes About Players',
        content: (
            <div>
                <p>
                    Players can now add private notes about specific players. Want to add notes about players for you to
                    remember? Well now you can! These notes are secure and only visible to you.
                </p>
                <div className={classnames(style.personalNoteNew, lazyClass)} />
                <div className={classnames(style.personalNote, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2023-07-27',
        title: 'The Arrival of Rival Tennis Ladder',
        content: (
            <div>
                <div className={style.rivalLogo} />
                <p>
                    Starting today, we are changing our name to <b>Rival Tennis Ladder</b> (also known as <b>Rival</b>)
                    in all instances and references. If you’re asking yourself, “Why change the name?” Well, don’t
                    worry! We’re here to explain.
                </p>

                <p>
                    While we liked our previous name, <b>Ultimate Tennis Ladder</b>, (and frankly, there was nothing
                    wrong with it), we wanted to signal to the world that we are evolving into a mainstream tennis
                    solution. In just the last year, we’ve gone from being just a budding and unknown tennis ladder
                    system to a powerhouse of functionalities and a grower of tennis communities. We are transforming
                    into a prominent tennis organization with the intent of expanding our platform to all major tennis
                    destinations across the U.S., and we want our name to reflect our brand, our mission, and our
                    backstory.
                </p>

                <p>
                    So, why <b>Rival</b>?
                </p>

                <p>First, let’s start with some definitions of “rival” from Merriam-Webster:</p>

                <ul>
                    <li>(noun) One of two or more striving to reach or obtain something that only one can possess</li>
                    <li>(noun) One striving for competitive advantage</li>
                    <li>(verb) To possess qualities or aptitudes that approach or equal (those of another)</li>
                    <li>(verb) To be in competition with</li>
                    <li>(verb) To strive to equal or excel</li>
                </ul>

                <p>
                    From the dawn of modern tennis history, whether it’s Agassi-Sampras, Borg-McEnroe,
                    Federer-Nadal-Djokovic, Graf-Seles, or Evert-Navratilova, rivalries are the heart and soul of what
                    tennis is. Rivals make you strategize more, practice harder, and play with more desire. Rivals push
                    each other to become stronger, faster, and overall better people. Through wins and losses, water
                    gained and sweat lost, emotions showed or reserved, we grow together through our tennis, our
                    competition, our friendships - our rivals.
                </p>

                <p>
                    Deep down, we feel <b>Rival</b> embodies what tennis is about the most, and we find it echoes what
                    we do on this tennis ladder. We establish rivals, we compete for points, and we vie for our
                    head-to-head records to reflect our progress. In fact, we (Andrew and Igor, the Co-Founders) started
                    the application because we wanted to know where we stood as rivals over the years.
                </p>

                <div className={style.founders}>
                    <div>
                        <img src={AndrewSrc} alt="Andrew" />
                        <h4 className="mt-4 text-center">Andrew</h4>
                    </div>
                    <div>
                        <img src={IgorSrc} alt="Igor" />
                        <h4 className="mt-4 text-center">Igor</h4>
                    </div>
                </div>

                <p>
                    We asked ourselves, “What is our head-to-head? Who has more work to do?” And, you know what, the
                    ladder has made our competition (and friendship) stronger than ever. We want that for everyone else,
                    no matter what level or where they live. That’s why we are now <b>Rival Tennis Ladder</b>. We’re
                    ready to bring that experience to tennis everywhere.
                </p>

                <p>
                    So, Hello, Tennis World! Are you ready to take on <b>your next rival</b>? We are.
                </p>
            </div>
        ),
    },
    ...(config.isRaleigh
        ? [
              {
                  date: '2023-07-12',
                  title: 'Final Tournament Structure',
                  content: finalTournamentStructure,
              },
          ]
        : []),
    {
        date: '2023-06-28',
        title: 'Competitive Proposals',
        content: (
            <div>
                <p>
                    Players can now toggle the Competitive Proposal setting to find matches with players of similar
                    strength. Opponents must be within 0.25 TLR points to see and accept this type of proposal.
                </p>
                <div className={classnames(style.competitiveProposal, lazyClass)} />
            </div>
        ),
    },
    ...(config.isRaleigh
        ? []
        : [
              {
                  date: '2023-05-24',
                  title: 'Final Tournament Structure',
                  content: finalTournamentStructure,
              },
          ]),
    {
        date: '2023-04-19',
        title: 'Badges',
        content: (
            <div>
                <p>
                    Players can now earn badges for achieving milestones and performing feats of skill. Your entire
                    badge history will be visible on your <Link to="/user/badges">Badges page</Link>.
                </p>

                <p>Badges come in three different types: One-Time Badges, Series Badges, and Ladder Badges.</p>

                <h4 className="mt-12">One-Time Badges</h4>
                <div className={classnames(style.badgesWrapper, 'mb-4')}>
                    <div className={style.badges}>
                        {allBadges.oneTime.map((item) => {
                            const badgeState = item.getState({ stats: badgeStats });

                            return (
                                <div key={item.code} className={style.badge}>
                                    <Badge {...badgeState.props} completed={false} disabled={false} />
                                    <div className={style.title}>{item.title}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <p>
                    One-Time Badges are achievable only once for particular tasks, such as creating your avatar, winning
                    back-to-back tiebreaks, or winning two matches played on the same day.
                </p>

                <h4 className="mt-12">Series Badges</h4>
                <div className={classnames(style.badgesWrapper, 'w-100', 'mb-4')}>
                    <div className={style.badges}>
                        {allBadges.series.map((item) => {
                            const badgeState = item.getState({ stats: badgeStats });

                            return (
                                <div key={item.code} className={classnames(style.badge, style.series)}>
                                    <Badge {...badgeState.props} completed={false} disabled={false} />
                                    <div className={style.title}>{item.title}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <p>
                    Series Badges have several levels, where you earn a badge for each level you reach. These badges
                    tally up things such as matches won, rivalries created, and comebacks.
                </p>

                <h4 className="mt-12">Ladder Badges</h4>
                <div className={classnames(style.badgesWrapper, 'mb-4')}>
                    <div className={style.badges}>
                        {allBadges.levels.map((item) => {
                            const badgeState = item.getState({ stats: badgeStats.levels[3] });

                            return (
                                <div key={item.code} className={classnames(style.badge, style.series)}>
                                    <Badge {...badgeState.props} completed={false} disabled={false} />
                                    <div className={style.title}>{item.title}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <p>
                    Ladder Badges are multi-level achievements related to each ladder, such as accomplishing a TLR
                    maximum, completing stages of the tournament, or reaching a certain number of points during the
                    regular season.
                </p>

                <h4 className="mt-12">Badge Insights</h4>
                <div className={classnames(style.latestComebacks, lazyClass)} />
                <p>
                    Explore each badge to find special Badge Insights about your progress, when you achieved certain
                    levels, and how to reach the next level.
                </p>

                <h4 className="mt-12">Earn Rival Credit for Each Badge</h4>
                <p>
                    For every badge you achieve, you’ll receive <b>$1</b> in credit to your{' '}
                    <Link to="/user/wallet">Rival Wallet</Link> for future seasons!
                </p>
            </div>
        ),
    },
    {
        date: '2023-04-05',
        title: 'Create the Rival App',
        content: (
            <div>
                <p>Players can now add an icon to their mobile home screens to use Rival like a regular app.</p>
                <div className={classnames(style.iconOnIphone, lazyClass)} />
                <p>Here are specific instructions for your phone:</p>
                <Tabs
                    list={[
                        {
                            label: 'iPhone',
                            content: (
                                <>
                                    <p>
                                        Use <b>Safari</b> browser to create an icon:
                                    </p>
                                    <div className={style.instructionIphone} />
                                    <p>
                                        You have to <b>sign in again</b> after creating an icon.
                                    </p>
                                    <p>Use these gestures while using the app:</p>
                                    <ul className="m-0">
                                        <li className="m-0">
                                            <b>Go back</b> - Swipe from the left screen edge to the right.
                                        </li>
                                        <li className="m-0">
                                            <b>Reload page</b> - Pull down from the top of the page.
                                        </li>
                                    </ul>
                                </>
                            ),
                        },
                        {
                            label: 'Android',
                            content: (
                                <>
                                    <p>
                                        Use <b>Chrome</b> browser to create an icon:
                                    </p>
                                    <div className={style.instructionAndroid} />
                                    <p>
                                        While using the app you can <b>reload the page</b> by just pulling down from the
                                        top of the page.
                                    </p>
                                </>
                            ),
                        },
                    ]}
                />
            </div>
        ),
    },
    {
        date: '2023-01-30',
        title: 'Player Statistics',
        content: (
            <div>
                <p>
                    Players can now see more in-depth statistics related to seasons, tournament results, and performance
                    over time on their profile pages.
                </p>
                <div className={style.levelStatsWrapper}>
                    <div className={classnames(style.levelStatsBefore, lazyClass)}>
                        <h4 className={style.compare}>Before:</h4>
                        <div />
                    </div>
                    <div className={classnames(style.levelStatsAfter, lazyClass)}>
                        <h4 className={style.compare}>After:</h4>
                        <div />
                    </div>
                </div>

                <p>
                    Click on the <b>Performance Timelines</b> box to see your yearly match performance statistics.
                </p>
                <div className={classnames(style.performanceTimelines, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2022-12-26',
        title: 'Weather Forecast',
        content: (
            <div>
                <p>
                    Players will now be able to see the weather forecast for the current day, the time of proposals, and
                    the upcoming week. Simply click the current weather icon to see the full 10-day forecast.
                </p>
                <div className={classnames(style.weatherCurrent, lazyClass)} />

                <p>
                    We are grabbing temperature, precipitation, and wind data to generate a weather forecast
                    specifically for tennis players. Notice, the weather forecast also includes a court dryness bar.
                </p>
                <div className={classnames(style.weatherTenDays, lazyClass)} />

                <p>Here is an example of the weather report for proposals at their specific time and date:</p>
                <div className={classnames(style.weatherOpenProposals, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2022-11-10',
        title: 'Schedule a Match',
        content: (
            <div>
                <p>
                    Players can now schedule a prearranged match with an opponent to see it in their upcoming matches.
                </p>
                <div className={classnames(style.scheduleMatch, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2022-11-03',
        title: 'Match Statistics',
        content: (
            <div>
                <p>
                    Players can now upload Rival Tennis Ladder match statistics using their Apple watch and the{' '}
                    <a href="https://swing.tennis" target="_blank" rel="noreferrer">
                        SwingVision
                    </a>{' '}
                    app!
                </p>
                <div className={classnames(style.swingVision, lazyClass)} />
                <div className={style.swingVisionBlock}>
                    <div className={classnames(style.swingScore, lazyClass)} />
                    <div className={classnames(style.swingWinners, lazyClass)} />
                </div>

                <p>
                    Upload your statistics through the match context menu shown below. You&apos;ll find uploading
                    instructions there as well.
                </p>
                <div className={classnames(style.swingUpload, lazyClass)} />

                <p>In the default tracking mode the statistics will look like this:</p>
                <div className={classnames(style.swingDefaultStat, lazyClass)} />

                <p>
                    If you use the more advanced <b>Point by Point+</b> mode (tracking winners, unforced and forced
                    errors) then the stats look even more exciting:
                </p>
                <div className={classnames(style.swingExtendedStat, lazyClass)} />

                <p>Anyone can see your match stats by clicking this icon:</p>
                <div className={classnames(style.swingIcon, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2022-09-28',
        title: 'Rescheduling Matches',
        content: (
            <div>
                <p>
                    Players now have the ability to reschedule matches. Here are some situations where this
                    functionality may be useful:
                </p>
                <ul>
                    <li>Your match was interrupted by rain, and you both agree to finish it later.</li>
                    <li>
                        Your proposal was flexible, and after a player accepts, you&apos;d like to set an exact time and
                        location.
                    </li>
                    <li>
                        You agreed with your opponent to play another date, time, or location that is different from the
                        proposal.
                    </li>
                </ul>

                <div className={style.reschedulingWrapper}>
                    <div className={classnames(style.rescheduling1, lazyClass)} />
                    <div className={classnames(style.rescheduling2, lazyClass)} />
                </div>
            </div>
        ),
    },
    {
        date: '2022-09-27',
        title: 'Contact Information Security',
        content: (
            <div>
                <p>
                    In order to prevent malicious activities on the Rival platform and protect player information, we
                    are now restricting player phone numbers and email addresses only to prospective and past match
                    opponents. Here are the scenarios where your phone number and email will be visible to specific
                    players in your ladder:
                </p>
                <ul>
                    <li>You have an open proposal.</li>
                    <li>You have an upcoming match with a player.</li>
                    <li>You played at least one match with someone.</li>
                </ul>

                <div className={classnames(style.contacts, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2022-08-21',
        title: 'Match Result Notifications',
        content: (
            <div>
                <p>Players now receive an email when an opponent reports a finished match.</p>
                <div className={classnames(style.matchEmail, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2022-08-10',
        title: 'Default Match Scoring',
        content: (
            <div>
                <p>
                    Default matches will now be worth 20 points to the winner. Challengers will no longer receive the
                    2-point Challenger bonus for Default matches. The Default styling now reflects a new design.
                </p>
                <div className={style.defaultMatchWrapper}>
                    <div className={classnames(style.defaultMatchBefore, lazyClass)}>
                        <h4 className={style.compare}>Before:</h4>
                        <div className={style.paddingWrapper}>
                            <div />
                        </div>
                    </div>
                    <div className={classnames(style.defaultMatchAfter, lazyClass)}>
                        <h4 className={style.compare}>After:</h4>
                        <div className={style.paddingWrapper}>
                            <div />
                        </div>
                    </div>
                </div>
            </div>
        ),
    },
    {
        date: '2022-07-22',
        title: 'New Email Templates',
        content: (
            <div>
                <div className={style.emailWrapper}>
                    <div className={classnames(style.emailBefore, lazyClass)}>
                        <h4 className={style.compare}>Before:</h4>
                        <div />
                    </div>
                    <div className={classnames(style.emailAfter, lazyClass)}>
                        <h4 className={style.compare}>After:</h4>
                        <div />
                    </div>
                </div>
                <p className="mt-8">
                    Emails in your inbox will now show a preview in a pop-up or the message list. These previews will
                    have all the information a player needs, meaning emails require just a glance to get all the
                    pertinent details.
                </p>
                <div className={classnames(style.emailPreview, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2022-06-27',
        title: 'Incorrect Email Alert',
        content: (
            <div>
                <p>
                    In rare cases where we cannot deliver a message to a specific email (email deleted, email doesn’t
                    have free space, email domain deleted, etc.,), players will see the following mark beside their
                    profile’s email. This mark indicates the player must update their email address to receive messages
                    moving forward.
                </p>
                <div className={classnames(style.wrongEmail, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2022-06-26',
        title: 'Injury Symbol for Forfeits',
        content: (
            <div>
                <p>
                    Players can now indicate a match stopped due to player injury. This change is only informational,
                    and match result scoring will remain the same regarding forfeits.
                </p>
                <div className={style.injuryWrapper}>
                    <div className={style.injury1}>
                        <div className={style.lazyClass} />
                    </div>
                    <div className={style.injury2}>
                        <div className={style.lazyClass} />
                    </div>
                </div>
            </div>
        ),
    },
    {
        date: '2022-06-13',
        title: 'About Me on Profiles',
        content: (
            <div>
                <p>
                    Players can now fill out an <b>About Me</b> section on their profile. This content is visible to all
                    other players, and it allows players to share a little more about themselves.
                </p>
                <div className={style.aboutMeWrapper}>
                    <div className={classnames(style.aboutMe1, lazyClass)} />
                    <div className={classnames(style.aboutMe2, lazyClass)} />
                </div>
            </div>
        ),
    },
    {
        date: '2022-06-10',
        title: 'New Ladder Block Style',
        content: (
            <div className={style.ladderWrapper}>
                <div className={classnames(style.ladderBefore, lazyClass)}>
                    <h4 className={style.compare}>Before:</h4>
                    <div className={style.paddingWrapper}>
                        <div />
                    </div>
                </div>
                <div className={classnames(style.ladderAfter, lazyClass)}>
                    <h4 className={style.compare}>After:</h4>
                    <div className={style.paddingWrapper}>
                        <div />
                    </div>
                </div>
            </div>
        ),
    },
    {
        date: '2022-05-10',
        title: 'New Champion Style',
        content: (
            <div className={style.winnerWrapper}>
                <div className={classnames(style.winnerBefore, lazyClass)}>
                    <h4 className={style.compare}>Before:</h4>
                    <div className={style.paddingWrapper}>
                        <div />
                    </div>
                </div>
                <div className={classnames(style.winnerAfter, lazyClass)}>
                    <h4 className={style.compare}>After:</h4>
                    <div className={style.paddingWrapper}>
                        <div />
                    </div>
                </div>
            </div>
        ),
    },
    {
        date: '2022-05-07',
        title: 'New Avatar Styles',
        content: (
            <div>
                <p>
                    Players may customize their avatars even more with new avatar styles, including beards, hairstyles,
                    glasses, mouth options, and much more! Here are just a few examples:
                </p>
                <div className={style.avatarWrapper}>
                    <div className={classnames(style.avatar1, lazyClass)} />
                    <div className={classnames(style.avatar2, lazyClass)} />
                    <div className={classnames(style.avatar3, lazyClass)} />
                    <div className={classnames(style.avatar4, lazyClass)} />
                    <div className={classnames(style.avatar5, lazyClass)} />
                    <div className={classnames(style.avatar6, lazyClass)} />
                </div>
            </div>
        ),
    },
    {
        date: '2022-04-28',
        title: 'Doubles Ladder Functionality',
        content: (
            <div>
                <p>
                    Players can now participate in Doubles ladders. In this format, players register individually, and
                    they can either play with different partners or stick with a preferred partner from match to match.
                </p>
                <div className={style.doublesWrapper}>
                    <div className={classnames(style.doubles3, lazyClass)} />
                    <div className={classnames(style.doubles4, lazyClass)} />
                    <div className={classnames(style.doubles1, lazyClass)} />
                    <div className={classnames(style.doubles2, lazyClass)} />
                </div>
            </div>
        ),
    },
    {
        date: '2022-03-27',
        title: 'Multi-Ladder Proposals',
        content: (
            <div>
                <p>
                    Players who join two or more ladders can now propose a match for more than one ladder at once. If a
                    player accepts one of these proposals, the other will be deleted automatically.
                </p>
                <div className={classnames(style.twoLadderProposal, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2022-03-15',
        title: 'Suggested Players for Reporting Matches',
        content: (
            <div>
                <p>
                    When reporting a match using the <b>Report Match</b> button, players will receive a player
                    suggestion from their outstanding matches.
                </p>
                <div className={style.matchSuggestionsWrapper}>
                    <div className={classnames(style.matchSuggestions1, lazyClass)} />
                    <div className={classnames(style.matchSuggestions2, lazyClass)} />
                </div>
            </div>
        ),
    },
    {
        date: '2022-02-15',
        title: 'Live Rankings',
        content: (
            <div>
                <p>
                    Players can now click the <b>Live</b> tab to see the current rankings of players in the ladder based
                    on matches reported throughout the week.
                </p>
                <div className={classnames(style.liveMode, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2022-01-03',
        title: 'Friendly Proposals',
        content: (
            <div>
                <p>
                    Players can propose friendly matches between seasons to stay active! Players will not receive points
                    or TLR for these matches, and they cannot report the scores in the system.
                </p>
                <div className={classnames(style.friendlyProposal, lazyClass)} />
            </div>
        ),
    },
    {
        date: '2021-12-26',
        title: 'Switch Ladder Option',
        content: (
            <div>
                <p>Players can now switch ladders at any point in the season to better match their skill level.</p>
                <div className={style.switchLadderWrapper}>
                    <div className={classnames(style.switchLadder1, lazyClass)} />
                    <div className={classnames(style.switchLadder2, lazyClass)} />
                </div>
            </div>
        ),
    },
];

export default getData;
