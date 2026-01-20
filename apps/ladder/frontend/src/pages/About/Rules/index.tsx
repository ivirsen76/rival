
import Card from '@/components/Card';
import ScrollToTop from '@/components/ScrollToTop';
import Header from '@/components/Header';
import useConfig from '@/utils/useConfig';
import { Link } from 'react-router-dom';

const Rules = props => {
    const config = useConfig();

    return (
        <div className="tl-front">
            <Header
                title="Rules & Regulations"
                description={`Learn the rules and etiquette of the ${config.city} Rival Tennis Ladder, surrounding topics such as proposals, match play, defaults, match reporting, the final tournament, and more.`}
            />
            <h2 className="text-white mt-4">Rules & Regulations</h2>
            <ScrollToTop />
            <Card>
                <p>
                    Whether you&apos;re a seasoned competitor or just getting back into the swing of things, our goal is
                    to provide a fun, fair, and flexible environment for tennis competition. While it may not be the
                    most exciting part, a cornerstone of a good community is a clear set of rules and expectations.
                </p>
                <p>To keep everyone on the same page, we&apos;ve organized our Rules into three distinct parts:</p>
                <ol>
                    <li>
                        <p>
                            <a href="#general-gameplay">General Gameplay (The Baseline)</a>: The baseline rules for how
                            tennis is played (scoring, line calls, etc.).
                        </p>
                    </li>
                    <li>
                        <p>
                            <a href="#rules-regulations">Rival Rules &amp; Regulations</a>: The specific logistical
                            rules for our ladder (defaults, tiebreaks, reporting scores) and our enforcement policies.
                        </p>
                    </li>
                    <li>
                        <p>
                            <a href="#ladder-etiquette">Ladder Etiquette</a>: The &quot;unwritten rules&quot; of
                            sportsmanship and court courtesy that make our community great.
                        </p>
                    </li>
                </ol>
                <p>
                    <strong>A Note on Precedence:</strong> While we adhere to the standard rules of tennis, the Rival
                    Rules listed below take precedence over general ITF rules regarding match logistics (such as default
                    times, tiebreak formats, or set structures).
                </p>

                <h2 id="general-gameplay">Part I: General Gameplay (The Baseline)</h2>
                <p>
                    <strong>Official Governance:</strong> All matches on Rival Tennis Ladder are governed by the current{' '}
                    <a
                        href="https://www.itftennis.com/en/about-us/governance/rules-and-regulations/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        ITF Rules of Tennis
                    </a>
                    . Unless a specific exception is noted in Part II (Rival Rules &amp; Regulations), all players are
                    expected to follow the standard rules regarding scoring, service, court positioning, and line calls.
                </p>
                <p>
                    <strong>Un-Officiated Play (&quot;The Code&quot;):</strong> Because Rival matches are played without
                    a chair umpire or referee, players are solely responsible for officiating their own match. We rely
                    on the principles of &quot;The Code&quot; to resolve on-court disputes. Key principles include:
                </p>
                <ul>
                    <li>
                        <p>
                            <strong>Line calls:</strong> You are responsible for calling lines on your side of the net.
                            Calls must be made immediately and loud enough for your opponent to hear.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Benefit of the doubt:</strong> If you are not 100% certain a ball was
                            &quot;out,&quot; you must call it &quot;in.&quot; The benefit of the doubt always goes to
                            your opponent.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Scoring disputes:</strong> If players cannot agree on the score, they should resume
                            play from the last score both players agree on (e.g., if Player A thinks it is 40-30 and
                            Player B thinks it is 30-30, play resumes at 30-30).
                        </p>
                    </li>
                </ul>
                <p>
                    <strong>Resources:</strong> For a complete explanation of the rules, specific scenarios, or obscure
                    regulations, please refer to the official documentation:{' '}
                    <a
                        href="https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf"
                        target="_blank"
                        rel="noreferrer"
                    >
                        2026 ITF Rules of Tennis (PDF)
                    </a>
                </p>

                <h2 id="rules-regulations">Part II: Rival Rules &amp; Regulations</h2>
                <p>
                    The following regulations govern the specific logistics, format, and administration of Rival Tennis
                    Ladder. These rules cover everything from match setup to tournament play.
                </p>

                <h3>Section 1 - Tennis Balls</h3>
                <h4>1.1 - Match Requirements</h4>
                <p>
                    All players must bring an <strong>unopened can</strong> of pressurized tennis balls to the match.
                </p>
                <ul>
                    <li>
                        <p>
                            <strong>Singles:</strong> The winner takes the unopened can. The loser keeps the used balls.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Doubles:</strong> The winning team takes an unopened can. The losing team keeps the
                            used balls.
                        </p>
                    </li>
                </ul>
                <h4>1.2 - Opening Balls</h4>
                <p>
                    Tennis balls should only be opened when all players are present. Please do not open a can before
                    your opponent arrives.
                </p>
                <h4>1.3 - Disputes</h4>
                <p>
                    If players disagree on which can to open (e.g., brand preference), a random method (such as a coin
                    flip or racquet spin) shall determine which can is used.
                </p>
                <h4>1.4 - Approved Ball Types</h4>
                <p>
                    Matches must be played with <strong>standard pressurized balls</strong> (
                    <a
                        href="https://www.itftennis.com/en/about-us/tennis-tech/approved-balls/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        ITF Type 1 or Type 2
                    </a>
                    ). Low-compression &quot;Junior&quot; balls — Stage 1 (Green), Stage 2 (Orange), or Stage 3 (Red) —
                    are not permitted on the ladder.
                </p>
                <h3>Section 2 - Courts &amp; Costs</h3>
                <h4>2.1 - Match Location</h4>
                <p>Players are free to play at any tennis facility that is mutually convenient.</p>
                <ul>
                    <li>
                        <p>
                            <strong>Surface:</strong> Matches may be played on Hard or Clay courts (indoor or outdoor).
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Booking:</strong> The Challenger is responsible for securing the court reservation
                            (if necessary).
                        </p>
                    </li>
                </ul>
                <h4>2.2 - Court Fees</h4>
                <ul>
                    <li>
                        <p>
                            <strong>Public courts:</strong> If there is a fee to play (e.g., public park reservation),
                            the cost should be split <strong>50/50</strong> between the players.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Private clubs:</strong> If a match is hosted at a private club, the host{' '}
                            <strong>must</strong> inform the opponent of any guest fees prior to confirming the match.
                            Unless agreed otherwise, the visiting player is expected to cover their own guest fee. If
                            the host fails to mention the fee upfront, the host is responsible for covering the cost.
                        </p>
                    </li>
                </ul>
                <h3>Section 3 - Match Play</h3>
                <h4>3.1 - Determining Serve &amp; Side</h4>
                <p>
                    Players should use a random method (such as spinning a racquet or tossing a coin) to start the
                    match. The winner of the toss may choose to <strong>serve</strong> or <strong>receive</strong>. The
                    opponent then chooses which <strong>side</strong> of the court they wish to start on.
                </p>
                <h4>3.2 - Line Calls</h4>
                <p>Each player is responsible for making line calls on their own side of the net.</p>
                <ul>
                    <li>
                        <p>
                            <strong>Clear communication:</strong> Calls must be made{' '}
                            <strong>immediately and clearly</strong> (verbally, with or without a hand signal).
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Benefit of the doubt:</strong> If you are not 100% sure a ball was out, you must
                            play it as <strong>IN</strong>. The benefit of the doubt always goes to the opponent.
                        </p>
                    </li>
                </ul>
                <h4>3.3 - Changing Ends</h4>
                <p>
                    Players should switch sides of the court when the total number of games in a set is an{' '}
                    <strong>odd number</strong> (e.g., 1-0, 2-1, 4-3).
                </p>
                <ul>
                    <li>
                        <p>
                            <strong>Tiebreaks:</strong> During any tiebreak, players switch sides every{' '}
                            <strong>6 points</strong>.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>End of Set:</strong> Players always switch sides at the end of a set decided by a
                            tiebreak (7-6). Players should switch from where they <strong>started</strong> the tiebreak.
                        </p>
                    </li>
                </ul>
                <h4>3.4 - Interruptions (Lets)</h4>
                <p>
                    If play is disrupted by an outside factor (e.g., a ball rolling onto your court or a person walking
                    behind the baseline), any player may call a &quot;Let.&quot; The point is immediately stopped and
                    replayed from the <strong>first serve</strong>, regardless of the previous score in that point.
                </p>
                <h4>3.5 - Hindrances</h4>
                <p>
                    A hindrance describes any situation where a player is impeded from playing the point due to an
                    action by their opponent.
                </p>
                <ul>
                    <li>
                        <p>
                            <strong>Unintentional:</strong> If the hindrance is accidental (e.g., a player&apos;s hat
                            falls off or a ball drops from their pocket), the point should be replayed as a{' '}
                            <strong>Let</strong>. Players should make adjustments moving forward to prevent this type of
                            hindrance from occurring again.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Deliberate:</strong> If a player deliberately hinders their opponent (e.g., yelling
                            during the opponent&apos;s swing), they immediately <strong>lose the point</strong>.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Electronic devices:</strong> If a player&apos;s phone or watch rings during a point,
                            play is stopped.
                        </p>
                        <ul>
                            <li>
                                <p>
                                    <strong>First offense:</strong> The point is replayed (Let).
                                </p>
                            </li>
                            <li>
                                <p>
                                    <strong>Second offense:</strong> The opponent is awarded the point.
                                </p>
                            </li>
                        </ul>
                    </li>
                </ul>
                <h3>Section 4 - Match Formats</h3>
                <h4>4.1 - Approved Formats</h4>
                <p>
                    There are three approved match formats available for Rival Tennis Ladder play. By default, the{' '}
                    <strong>Regular</strong> format is played. If you prefer a different format, you must specify it in
                    the <strong>Proposal settings</strong> when sending a challenge.
                </p>
                <h4>4.2 - Regular Format (Default)</h4>
                <p>This format is the standard setup for most ladder matches.</p>
                <ul>
                    <li>
                        <p>
                            <strong>Structure:</strong> Best 2-out-of-3 sets
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Timing:</strong> Players should expect to play for{' '}
                            <strong>1.5 hours or more</strong>.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>First 2 sets:</strong> Standard sets played to 6 games. At 6-6, a{' '}
                            <strong>7-point tiebreak</strong> (first to 7, win by 2) is played.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Deciding set:</strong> If players split the first two sets, a{' '}
                            <strong>10-point match tiebreak</strong> (first to 10, win by 2) is played to determine the
                            winner.
                        </p>
                    </li>
                </ul>
                <h4>4.3 - Full 3rd Set Format</h4>
                <p>This format is for players who prefer tennis endurance.</p>
                <ul>
                    <li>
                        <p>
                            <strong>Structure:</strong> Best 2-out-of-3 full sets
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Timing:</strong> Players should expect to play for <strong>2 hours or more</strong>.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>All sets:</strong> All 3 sets are played to 6 games. If
                            <em>any</em> set reaches 6-6, a <strong>7-point tiebreak</strong> is played.
                        </p>
                    </li>
                </ul>
                <h4>4.4 - Fast4 Format</h4>
                <p>A shortened format designed for quicker play.</p>
                <ul>
                    <li>
                        <p>
                            <strong>Structure:</strong> Best 2-out-of-3 short sets
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Timing:</strong> Players should expect to play for <strong>up to 1 hour</strong>.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>First to 4:</strong> The first player to reach 4 games wins the set (e.g., 4-0, 4-1,
                            4-2).
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Tiebreak at 3-3:</strong> If the score reaches 3-3, a{' '}
                            <strong>7-point tiebreak</strong> is played immediately to decide the set.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Deciding Set:</strong> If players split sets (1-1), a{' '}
                            <strong>10-point match tiebreak</strong> is played.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>No-Ad Scoring:</strong> At Deuce (40-40), a single &quot;deciding point&quot; is
                            played. The receiver chooses which side (Deuce or Ad) to receive the serve.
                        </p>
                    </li>
                </ul>
                <h3>Section 5 - Defaults and Forfeitures</h3>
                <h4>5.1 - No-Show Default Policy</h4>
                <p>
                    If an opponent (or opposing team) does not arrive within <strong>15 minutes</strong> of the
                    scheduled start time and has not contacted you, you are entitled to report a Default win.
                </p>
                <h4>5.2 - Late Cancellation Default</h4>
                <p>
                    Players may report a Default win if their opponent (or opposing team) cancels within{' '}
                    <strong>24 hours</strong> of the scheduled match time.
                </p>
                <ul>
                    <li>
                        <strong>Player discretion:</strong> While this rule exists to protect your time, many players
                        choose not to enforce it if they can easily reschedule. The choice is yours.
                    </li>
                </ul>
                <h4>5.3 - Mid-Match Retirements</h4>
                <p>
                    If a player or team must stop playing due to injury or other reasons (Retirement), the match is
                    recorded based on the score at the time of the stoppage.
                </p>
                <ul>
                    <li>
                        <p>
                            <strong>Reporting:</strong> The non-retiring player/team is marked as the winner. The score
                            is entered exactly as it stood when play stopped (e.g., if a player retired when down 1-3,
                            report the score as 1-3).
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Equipment failure:</strong> If a player breaks their strings, racquet, or shoes and
                            has no replacement available, they must retire from the match. The match cannot be suspended
                            to obtain new equipment.
                        </p>
                    </li>
                </ul>
                <h4>5.4 - Inclement Weather</h4>
                <p>
                    Matches cancelled or interrupted due to rain or wet courts are <strong>not</strong> subject to
                    Default rules.
                </p>
                <ul>
                    <li>
                        <p>
                            <strong>Cancellations:</strong> If a match is cancelled due to weather, no penalty applies.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Suspended play:</strong> If rain interrupts a match in progress, players should note
                            the exact score (sets, games, and points) and schedule a time to finish the match.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Resuming a match:</strong> The match picks up exactly where it left off.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Reporting a suspended match:</strong> Do not enter the score on the platform until
                            the match is fully completed.
                        </p>
                    </li>
                </ul>
                <h3>Section 6 - Match Reporting</h3>
                <h4>6.1 - Reporting Deadlines &amp; Responsibility</h4>
                <p>
                    The <strong>winner</strong> of the match (or winning team) is responsible for reporting the score on
                    the platform.
                </p>
                <ul>
                    <li>
                        <strong>Deadline:</strong> Scores must be entered before <strong>midnight on Sunday</strong> of
                        the current week.
                    </li>
                </ul>
                <h4>6.2 - Unofficial Matches</h4>
                <p>
                    If you are entering a match that did not originate from an official system proposal (e.g., you
                    agreed to play via text), you must manually enter the match details.
                </p>
                <ul>
                    <li>
                        <strong>Setting the Challenger:</strong> Be sure to set the <strong>Challenger</strong> as the
                        player or team who originally suggested the match. This ensures accurate record-keeping for the
                        season.
                    </li>
                </ul>
                <h4>6.3 - Eligible Matches</h4>
                <p>Only competitive matches played within the official dates of the Regular Season may be reported.</p>
                <ul>
                    <li>
                        <p>
                            <strong>Practice matches:</strong> Matches played as casual practice or &quot;hits&quot;
                            without competitive intent should <strong>not</strong> be entered into the system.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Off-season:</strong> Matches played before the start of the season or after the
                            regular season ends are not eligible for regular match reporting.
                        </p>
                    </li>
                </ul>
                <h3>Section 7 - Final Tournament</h3>
                <h4>7.1 - Tournament Structure</h4>
                <p>
                    At the end of the regular season, the top-ranked players (Singles) and teams (Doubles) are invited
                    to a single-elimination Final Tournament taking place over two weeks. The draw size is based on the
                    total number of participants (players or teams) in that specific ladder before the final week of the
                    regular season.
                </p>
                <ul>
                    <li>
                        <p>
                            <strong>Fewer than 50 participants:</strong> Top 8 qualify (3 rounds).
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>50-74 participants:</strong> Top 12 qualify (4 rounds), with the Top 4 seeds
                            receiving a first-round Bye.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>75+ participants:</strong> Top 16 qualify (4 rounds).
                        </p>
                    </li>
                </ul>
                <h4>7.2 - Qualification &amp; Ties</h4>
                <ul>
                    <li>
                        <p>
                            <strong>Minimum requirements:</strong> A ladder must have at least{' '}
                            <strong>4 participants</strong> and <strong>20 total matches played</strong> before the last
                            week of the regular season to host a Final Tournament.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Tiebreaker:</strong> If two players/teams are tied in points for the final
                            tournament spot, the participant with the <strong>most matches played</strong> will qualify,
                            followed by who won the most matches.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Rating Restrictions (TLR):</strong> To maintain competitive balance, players will be
                            restricted from playing in the Final Tournament if:
                        </p>
                        <ul>
                            <li>
                                They start the season with a <Link to="/tlr">Tennis Ladder Rating</Link> (TLR) that is
                                more than 0.5 above the ladder level (e.g., a player with a 3.75 TLR competing in a 3.0
                                ladder).
                            </li>
                            <li>
                                They establish a TLR during the season that is more than 0.5 above the ladder level.
                            </li>
                            <li>
                                They possess an unestablished TLR but demonstrate a skill trajectory in their initial
                                five matches that clearly exceeds the ladder&apos;s level.
                            </li>
                        </ul>
                    </li>
                    <li>
                        <p>
                            <strong>Byes:</strong> If a tournament bracket is not full (e.g., fewer than 8 confirmed
                            players), Byes will be awarded to the highest seeds.
                        </p>
                    </li>
                </ul>
                <h4>7.3 - Seeding &amp; Randomization</h4>
                <p>
                    The tournament draw is randomized using a method similar to those used in professional tour events.
                </p>
                <ul>
                    <li>
                        <p>
                            <strong>3-Round Tournaments (Top 8):</strong> Feature <strong>4 Seeds</strong>.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>4-Round Tournaments (Top 12 or 16):</strong> Feature <strong>8 Seeds</strong>.
                        </p>
                    </li>
                </ul>
                <p>
                    <strong>Randomization Logic:</strong>
                </p>
                <ul>
                    <li>
                        <p>
                            <strong>Seeds 1 &amp; 2:</strong> Placed on opposite ends of the draw to ensure they cannot
                            meet until the Final.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Seeds 3 &amp; 4:</strong> Assigned randomly to empty brackets in opposite halves.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Seeds 5-8 (4-Round only):</strong> Assigned randomly to empty brackets.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Remaining Participants:</strong> Distributed randomly into separate quarters of the
                            draw.
                        </p>
                    </li>
                </ul>
                <h4>7.4 - Scheduling &amp; Defaults</h4>
                <p>
                    Tournament matches must be played within the strict timeframe assigned for each round, as outlined
                    in the tournament details on each ladder.
                </p>
                <ul>
                    <li>
                        <p>
                            <strong>Good faith effort:</strong> All participants are required to share their
                            availability immediately and make a genuine effort to schedule the match.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Enforcement:</strong> Failure to schedule or play the match within the designated
                            window may result in a Default issued by Rival match coordinators for one or both
                            participants.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Decision:</strong> In the event of a scheduling stalemate, the administration
                            reserves the right to advance the player who demonstrated greater availability and
                            responsiveness.
                        </p>
                    </li>
                </ul>
                <h3>Section 8 - Code of Conduct &amp; Discipline</h3>
                <h4>8.1 - Prohibited Behavior</h4>
                <p>
                    All players are expected to uphold Rival&apos;s values of respect, fairness, and integrity. The
                    following behaviors are strictly prohibited and may result in disciplinary action:
                </p>
                <ul>
                    <li>
                        <p>Aggressive, abusive, or discriminatory language</p>
                    </li>
                    <li>
                        <p>Harassment, threats, or unsportsmanlike conduct</p>
                    </li>
                    <li>
                        <p>Physical violence or aggression of any kind</p>
                    </li>
                    <li>
                        <p>Poor or intentionally incorrect line calls (cheating)</p>
                    </li>
                    <li>
                        <p>Manipulation of scores or match results</p>
                    </li>
                    <li>
                        <p>Excessive lateness or repeated cancellations (flaking)</p>
                    </li>
                    <li>
                        <p>Substance use (including alcohol or smoking) during matches or playing while intoxicated</p>
                    </li>
                    <li>
                        <p>Spamming, soliciting, or contacting players for reasons other than match coordination</p>
                    </li>
                </ul>
                <h4>8.2 - Disciplinary Actions</h4>
                <p>
                    Rival Tennis Ladder generally follows a three-step escalation path for players who receive verified
                    complaints or violate rules:
                </p>
                <ol>
                    <li>
                        <p>
                            <strong>Warning:</strong> Issued after repeated or verified complaints.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Suspension:</strong> Temporary removal from the ladder (up to two seasons).
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Permanent ban:</strong> Complete removal from the platform for continued violations.
                        </p>
                    </li>
                </ol>
                <h4>8.3 - Severe Violations</h4>
                <p>
                    Rival reserves the right to skip the warning phase and take <strong>immediate action</strong>,
                    including immediate suspension or a permanent ban, if a player&apos;s actions cause physical harm,
                    threaten safety, or severely disrupt the community.
                </p>
                <h3>Section 9 - Spectators &amp; Coaching</h3>
                <h4>9.1 - Spectators</h4>
                <p>
                    Friends and family are welcome to watch matches, but they must remain outside the court area and may
                    not interfere with play.
                </p>
                <ul>
                    <li>
                        <strong>Line calls:</strong> Spectators are <strong>never</strong>
                        permitted to make line calls or offer their opinion on a call, even if asked. The players on the
                        court are the sole officials.
                    </li>
                </ul>
                <h4>9.2 - Coaching</h4>
                <p>
                    To maintain a fair competitive environment, coaching is <strong>not permitted</strong> once the
                    match has started.
                </p>
                <ul>
                    <li>
                        <strong>Definition:</strong> Coaching is considered any communication, advice, or instruction of
                        any kind, audible or visible, to a player.
                        <br />
                    </li>
                    <li>
                        <strong>Exception:</strong> In Doubles, communication between partners is fully encouraged
                        between points.
                    </li>
                </ul>
                <h2 id="ladder-etiquette">Part III: Ladder Etiquette</h2>
                <p>
                    While the Rival Rules &amp; Regulations define the rules of play,
                    <strong>etiquette</strong> defines the character of our community. Rival Tennis Ladder relies on
                    players being responsive, respectful, and fair. The following guidelines help ensure every match is
                    enjoyable, regardless of the score.
                </p>
                <h4>1. Scheduling &amp; Communication</h4>
                <p>
                    <em>Timely communication enables the ladder to function efficiently and keeps matches moving.</em>
                </p>
                <ul>
                    <li>
                        <p>
                            <strong>The &quot;24-Hour&quot; rule:</strong> Communication is the lifeline of a ladder.
                            Please reply to all emails and text messages within <strong>24 hours</strong>, even if your
                            match is scheduled for later in the week.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Don&apos;t ghost people:</strong> If you are injured, busy, or out of town, simply
                            let the opponent know so they can move on to another player.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Flexibility:</strong> When coordinating with other players in the Final Tournament,
                            strive to be accommodating of your opponent&apos;s schedule.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Confirmation:</strong> Once a proposal is accepted in the system, follow up
                            immediately via text or email to confirm the specific court location and meeting time.
                        </p>
                    </li>
                </ul>
                <h4>2. Punctuality</h4>
                <p>
                    <em>Being on time ensures that the full match can be played within the allotted schedule.</em>
                </p>
                <ul>
                    <li>
                        <p>
                            <strong>Arrival:</strong> Try to arrive <strong>5-10 minutes early</strong> to allow time
                            for parking, using the restroom, and walking to the court. You should be ready to hit the
                            first ball at the scheduled start time.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Running Late?</strong> Traffic happens. If you are running late, text your opponent
                            immediately to let them know you are on your way.
                        </p>
                    </li>
                </ul>
                <h4>3. The Warm-Up</h4>
                <p>
                    <em>
                        A structured warm-up routine prepares both players for competitive play without wasting match
                        time.
                    </em>
                </p>
                <ul>
                    <li>
                        <p>
                            <strong>Time limit:</strong> The warm-up is intended to loosen your muscles and should
                            typically last no longer than <strong>10 minutes</strong>.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Cooperation:</strong> If your opponent needs a few more overheads, serves, or
                            backhands, be accommodating.
                        </p>
                    </li>
                </ul>
                <p>
                    <strong>Structure of a Warm-Up:</strong>
                </p>
                <ol>
                    <li>
                        <p>
                            <strong>Mini-tennis:</strong> Hitting softly inside the service boxes to get a feel for the
                            ball.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Baseline:</strong> Hitting groundstrokes down the middle.
                            <strong>Do not</strong> aim for winners or hit heavy angles. Try to hit the ball right to
                            your opponent.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Volleys and overheads:</strong> One player comes to the net while the other feeds.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Serves:</strong> Take practice serves from both the Deuce and Ad sides (usually 3
                            serves per side).
                        </p>
                    </li>
                </ol>
                <h4>4. On-Court Sportsmanship</h4>
                <p>
                    <em>
                        Maintaining a respectful atmosphere is crucial for fostering fair competition and effective
                        conflict resolution.
                    </em>
                </p>
                <ul>
                    <li>
                        <p>
                            <strong>Call the score:</strong> Always announce the game score clearly <em>before</em> you
                            serve. This prevents confusion later and signals the start of the point.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Score disputes:</strong> If you and your opponent disagree on the score, try to
                            reconstruct the points played in that game. If you cannot agree, compromise by returning to
                            the last score both players agree on.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Honesty:</strong> If you see your own shot land clearly <strong>Out</strong> (and
                            your opponent didn&apos;t call it), it is good etiquette to call it out yourself. Honesty is
                            more important than a cheap point.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Overruling yourself:</strong> If you call a ball &quot;Out&quot; but then realize it
                            was good (or if you see a mark that proves it hit the line), you should correct your call
                            and award the point to your opponent.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Changeovers:</strong> Players may use the changeover period (switching sides) to
                            take a minute or two to sit down, hydrate, and relax before resuming play.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Set breaks:</strong> Players are permitted a break (
                            <strong>no more than 5 minutes</strong>) between sets for a bathroom visit or rest. Please
                            respect your opponent&apos;s time and try to return to the court promptly.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>The handshake:</strong> Win or lose, end every match by shaking hands or touching
                            racquets at the net.
                        </p>
                    </li>
                </ul>
                <h4>5. Equipment &amp; Environment</h4>
                <p>
                    <em>
                        Proper care of equipment and facilities ensures a high-quality experience for all participants.
                    </em>
                </p>
                <ul>
                    <li>
                        <p>
                            <strong>Ball choice:</strong> While any standard ball is legal, try to choose the ball best
                            suited for your surface (Extra-Duty for hard courts, Regular-Duty for clay).
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Ball quality:</strong> Do not store your match balls in your car during extreme heat
                            or freezing cold, as this degrades the pressure.
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>Clean up:</strong> Leave the court better than you found it. Gather all tennis
                            balls, throw away ball cans/lids, and ensure you haven&apos;t left any water bottles or grip
                            tape behind.
                        </p>
                    </li>
                </ul>
            </Card>
        </div>
    );
};

export default Rules;
