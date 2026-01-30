import useConfig from '../../utils/useConfig';

const TermsAndConditions = (props) => {
    const config = useConfig();
    let number = 1;

    return (
        <div>
            <p>
                <b>Last Updated</b>: October 29, 2025
            </p>
            <p>
                By registering for an account, participating in any match, or otherwise using the Rival Tennis Ladder,
                LLC (“Rival Tennis Ladder,” “Rival,” “we,” “our,” or “us”) website, you agree to these Terms &
                Conditions (“Terms”).
            </p>
            <p>If you do not agree, do not use or access the Rival Tennis Ladder platform.</p>

            <h2>{number++}. Introduction and Acceptance of Terms</h2>
            <p>
                Rival Tennis Ladder operates an online platform that connects adult tennis players for organized ladder
                play, rankings, and seasonal tournaments. Our service includes web pages, databases, email
                communications, and related tools (collectively, the “Platform”).
            </p>
            <p>
                These Terms form a legally binding agreement between you (“you,” “your,” or “player”) and Rival Tennis
                Ladder, LLC. They apply to your registration, use of our website, participation in matches, and any
                related activities.
            </p>
            <p>
                By creating an account, joining a ladder, or participating in a Rival event, you affirm that you have
                read, understood, and agree to these Terms.
            </p>

            <h2>{number++}. Eligibility</h2>
            <p>Players must adhere to the following to be eligible to play in Rival Tennis Ladder:</p>
            <ul>
                <li>
                    You must be <b>18 years or older</b> by the start date of the regular season to use Rival Tennis
                    Ladder.
                </li>
                <li>You must provide accurate, current, and complete information when registering.</li>
                <li>You may not impersonate another individual or create multiple accounts.</li>
            </ul>
            <p>
                Rival Tennis Ladder reserves the right to deny access to any player who does not meet these requirements
                and may request verification of age or identity at any time.
            </p>

            <h2>{number++}. Description of Services</h2>
            <p>Rival Tennis Ladder provides a competitive community tennis league, allowing registered players to:</p>
            <ul>
                <li>Join a ladder in their local area</li>
                <li>Propose, accept, and play matches with other players</li>
                <li>Report match results for ranking and tournament purposes</li>
            </ul>
            <p>
                We do <b>not</b> book or pay for courts, supply equipment, or provide referees. Players are fully
                responsible for arranging court time, paying court or facility fees, and ensuring that matches occur
                safely and fairly.
            </p>
            <p>
                For a full overview of how Rival operates, see our <a href="/about">About</a> page.
            </p>

            <h2>{number++}. Account Creation and Player Responsibilities</h2>
            <p>Players must adhere to the following:</p>
            <ul>
                <li>Maintain accurate contact information (including a valid email address and phone number)</li>
                <li>Use their own account - sharing or creating multiple accounts is prohibited</li>
                <li>Keep login credentials confidential</li>
                <li>Use the Platform only for legitimate tennis-related communication</li>
            </ul>
            <p>
                Any use of player contact information for marketing, solicitation, or non-league purposes is strictly
                forbidden. Violations may result in immediate suspension or permanent removal.
            </p>

            <h2>{number++}. Season Structure and Participation</h2>
            <p>The following outlines the definition of Rival seasons and participation:</p>
            <ul>
                <li>
                    Rival operates <b>10-week seasons</b> with 3 weeks between seasons.
                </li>
                <li>We may adjust season lengths before they begin to accommodate holidays or scheduling conflicts.</li>
                <li>
                    Players may participate as often or as little as they choose; however, inactive players are not
                    eligible for Final Tournaments.
                </li>
            </ul>
            <p>
                Details related to the calculation of scoring can be found on our <a href="/scoring">Scoring</a> page.
            </p>

            <h2>{number++}. Fees, Payments, and Refunds</h2>
            <p>
                <b>Fees:</b>
            </p>
            <ul>
                <li>
                    <b>Singles ladders</b>: ${(config.singlesCost - config.earlyRegistrationDiscount) / 100} before
                    season begins; ${config.singlesCost / 100} after season begins.
                </li>
                <li>
                    <b>Doubles ladders</b>: ${(config.doublesCost - config.earlyRegistrationDiscount) / 100} before
                    season begins; ${config.doublesCost / 100} after season begins.
                </li>
                <li>
                    Players can get a ${config.additionalLadderDiscount / 100} discount for each additional ladder
                    registration when paying for multiple ladders.
                </li>
                <li>Some ladders are offered for free in select areas or when prior-season participation was low.</li>
                <li>Players may apply Rival Wallet credits toward registration.</li>
            </ul>

            <p>
                <b>Refunds:</b>
            </p>
            <ul>
                <li>
                    Any participant who joins and is not satisfied with their experience within 14 days from their
                    payment date may request a refund at{' '}
                    <a href="mailto:info@tennis-ladder.com">info@tennis-ladder.com</a>.
                </li>
                <li>
                    Players who withdraw later in a season after the 14-day mark may request a refund by emailing{' '}
                    <a href="mailto:info@tennis-ladder.com">info@tennis-ladder.com</a>. Refunds in these situations are
                    reviewed on a case-by-case basis.
                </li>
                <li>
                    Non-attendance or non-participation in an activity does not entitle the patron to a refund or credit
                    through the Rival Tennis Ladder.
                </li>
                <li>
                    If a season is canceled, Rival will issue refunds in the form of credit to players&apos; Rival
                    Wallets.
                </li>
                <li>No automatic refunds are issued for suspensions or disqualifications.</li>
                <li>
                    Rival Wallet credit is not redeemable as cash or transferable to any bank account or financial
                    institution.
                </li>
            </ul>
            <p>
                For more details about fees, payments, or refunds, see our <a href="/pricing">Pricing</a> page.
            </p>

            <h2>{number++}. Scheduling and Match Play</h2>
            <p>The following outlines stipulations related to Rival scheduling and match play:</p>
            <ul>
                <li>
                    Players schedule their own matches by proposing times, dates, and locations through the Platform.
                </li>
                <li>Rival does not guarantee court availability.</li>
                <li>
                    Participants are responsible for paying any facility fees or court rentals; these may be split by
                    mutual agreement.
                </li>
                <li>Players should confirm match details via email, text, or phone prior to play.</li>
                <li>Match results must be reported on the Platform promptly after completion.</li>
            </ul>
            <p>
                For more details about ladder procedures and etiquette, see our <a href="/rules">Rules</a> page.
            </p>

            <h2>{number++}. Weather and Rescheduling</h2>
            <p>The following outlines stipulations related to weather impact and rescheduling on the Platform:</p>
            <ul>
                <li>
                    If inclement weather renders a court unplayable, players may <b>reschedule without penalty</b>.
                </li>
                <li>
                    Tournament matches must be completed within Rival&apos;s published deadlines unless players receive
                    explicit permission from Rival Tennis Ladder Support allowing for an extension.
                </li>
            </ul>

            <h2>{number++}. Code of Conduct and Discipline</h2>
            <p>
                All players are expected to uphold Rival&apos;s values of respect, fairness, and integrity. The
                following behaviors are strictly prohibited:
            </p>
            <ul>
                <li>Aggressive or abusive language</li>
                <li>Excessive lateness or repeated cancellations</li>
                <li>Harassment or unsportsmanlike conduct</li>
                <li>
                    Lack of adherence to the <a href="/rules">Rival Tennis Ladder Rules</a>
                </li>
                <li>Manipulation of scores or results</li>
                <li>Playing while intoxicated</li>
                <li>Poor or intentionally incorrect line calls</li>
                <li>Spamming, soliciting, or contacting players outside of match coordination</li>
                <li>Substance use (including smoking or drinking) during matches</li>
            </ul>
            <p>
                This list is not intended to be comprehensive, and Rival may take action if it deems any additional
                behavior detrimental to the community&apos;s values and integrity.
            </p>

            <p>
                <b>Disciplinary Actions:</b>
            </p>
            <p>
                Rival will take the following path of disciplinary escalation against players receiving complaints in
                normal circumstances:
            </p>
            <ol>
                <li>Warning after repeated or verified complaints</li>
                <li>Temporary suspension (up to two seasons)</li>
                <li>Permanent ban for continued or severe violations</li>
            </ol>
            <p>
                Rival reserves the right to take immediate action in severe cases without prior warning and may suspend
                or ban any player from Rival Tennis Ladder if their actions cause harm, disrupt gameplay, or negatively
                impact the community.
            </p>

            <h2>{number++}. Default, Retirements, and Non-Participation</h2>
            <p>
                The following outlines stipulations related to Defaults, forfeits, and lack of participation in Rival:
            </p>
            <ul>
                <li>
                    A <b>Default</b> occurs when a player fails to show for a scheduled match without notice or cancels
                    within 24 hours.
                </li>
                <li>
                    A <b>Retirement</b> occurs when a player begins a match but is no longer able to continue.
                </li>
                <li>Excessive defaults may lead to disciplinary action.</li>
                <li>
                    Players who do not participate at all during the regular season will be excluded from Final
                    Tournaments.
                </li>
            </ul>
            <p>
                For more details, see our <a href="/rules">Rules</a> page.
            </p>

            <h2>{number++}. Dispute Resolution (Matches and Rules)</h2>
            <p>The following outlines how Rival handles disputes:</p>
            <ul>
                <li>Players should first attempt to resolve disputes directly and in good faith.</li>
                <li>
                    If unresolved, contact <a href="mailto:info@tennis-ladder.com">info@tennis-ladder.com</a> with full
                    details.
                </li>
                <li>
                    Rival will interpret its <a href="/rules">Rules</a> and scoring procedures, confer with relevant
                    stakeholders (such as local Parks & Recreation, if applicable), and issue a final decision.
                </li>
                <li>Rival&apos;s decisions on disputes, rankings, and rule interpretations are final and binding.</li>
            </ul>

            <h2>{number++}. Assumption of Risk, Waiver, and Release of Liability</h2>
            <p>
                Tennis is an inherently physical sport with associated risks, including, but not limited to, injury,
                illness, or death. By participating in Rival Tennis Ladder activities, you acknowledge and accept these
                risks.
            </p>
            <p>
                You hereby agree for yourself and your heirs, assigns, executors, and administrators to{' '}
                <b>release, waive, and discharge all claims</b> against Rival Tennis Ladder, LLC, its owners,
                affiliates, officers, employees, agents, and partners for:
            </p>
            <ul>
                <li>Accidents while traveling;</li>
                <li>Conditions of courts, facilities, or weather;</li>
                <li>Injury, illness, or death arising out of your participation;</li>
                <li>Negligence by Rival or other participants;</li>
                <li>Property loss or damage.</li>
            </ul>
            <p>
                You agree that <b>you are solely responsible</b> for evaluating court safety and obtaining medical or
                emergency assistance if needed. Rival is not responsible for any medical costs, damages, or
                consequential losses.
            </p>

            <h2>{number++}. Indemnification</h2>
            <p>
                You agree to indemnify and hold harmless Rival Tennis Ladder, LLC and its affiliates from any claims,
                damages, losses, or costs (including reasonable attorney fees) arising from:
            </p>
            <ul>
                <li>Your participation or conduct in any Rival event;</li>
                <li>Injury or damage caused to others while participating;</li>
                <li>Violation of these Terms or our Rules.</li>
            </ul>
            <p>This section survives the termination of your account.</p>

            <h2>{number++}. Use of Personal Data and Media</h2>
            <p>
                Rival collects and processes personal information in accordance with our{' '}
                <a href="/privacy-policy">Privacy Policy</a>.
            </p>
            <ul>
                <li>Match results, standings, player names, and player photos are public by default.</li>
                <li>
                    Player photos submitted through the Platform may be used in Rival marketing or public materials{' '}
                    <b>only if permission is granted during upload</b>.
                </li>
                <li>
                    Players may request exclusion from promotional use by emailing{' '}
                    <a href="mailto:info@tennis-ladder.com">info@tennis-ladder.com</a>.
                </li>
            </ul>

            <h2>{number++}. Platform Use and Acceptable Use Policy</h2>
            <p>The Rival Platform is provided for personal, non-commercial use. Prohibited activities include:</p>
            <ul>
                <li>Sending spam or advertisements</li>
                <li>Collecting user information for external purposes</li>
                <li>Attempting to disrupt or hack the Platform</li>
                <li>Reverse engineering, copying, or redistributing Rival&apos;s intellectual property</li>
            </ul>
            <p>Violations may result in account termination and possible legal action.</p>

            <h2>{number++}. Rule Changes and Platform Modifications</h2>
            <p>Rival reserves the right to:</p>
            <ul>
                <li>Modify ladder rules, structures, or policies mid-season if necessary.</li>
                <li>Update these Terms or related pages.</li>
                <li>Add, suspend, or discontinue Platform features.</li>
            </ul>
            <p>
                All changes will be communicated via email and/or posted on the <a href="/changelog">Changelog</a>. By
                continuing to use Rival after such updates, you agree to the revised Terms.
            </p>

            <h2>{number++}. Termination and Withdrawal</h2>
            <p>The following outlines Rival&apos;s policies regarding terminations and withdrawal from the ladder:</p>
            <ul>
                <li>
                    Players may withdraw from a ladder at any time by utilizing the built-in option on the player&apos;s
                    ladder level or by contacting <a href="mailto:info@tennis-ladder.com">info@tennis-ladder.com</a>.
                </li>
                <li>Rival may suspend or terminate an account for violations of these Terms or any policy.</li>
                <li>Suspended or disqualified players remain bound by these Terms and are not eligible for refunds.</li>
            </ul>

            <h2>{number++}. Governing Law and Venue</h2>
            <p>
                These Terms are governed by the laws of the <b>state in which the ladder operates</b>, without regard to
                conflict-of-law principles. Any disputes shall be brought exclusively in the state or federal courts
                located in that state. You consent to personal jurisdiction in those courts.
            </p>

            <h2>{number++}. Non-Discrimination Policy</h2>
            <p>
                Rival Tennis Ladder, LLC is committed to providing an inclusive and welcoming environment for all
                participants. We do <b>not</b> discriminate on the basis of race, color, national origin, sex, religion,
                age, sexual orientation, or disability in any of our activities, programs, or opportunities.
            </p>
            <p>
                Any participant who believes they have been subjected to discrimination may file a complaint by
                contacting:
            </p>
            <ul>
                <li>
                    <b>Email</b>: <a href="mailto:info@tennis-ladder.com">info@tennis-ladder.com</a>, or
                </li>
                <li>
                    <b>Office of Equal Opportunity, U.S. Department of the Interior</b>, Washington, D.C. 20240.
                </li>
            </ul>
            <p>
                Rival Tennis Ladder will take all reasonable steps to ensure that every player has equal access and
                opportunity to participate regardless of background or personal characteristics.
            </p>

            <h2>{number++}. Americans With Disabilities Act</h2>
            <p>
                Rival welcomes the participation of all individuals, including those with disabilities or special needs.
                We are committed to full compliance with the <b>Americans with Disabilities Act (ADA)</b> and applicable
                state and local accessibility laws.
            </p>
            <p>
                Players who require reasonable accommodations to participate should contact{' '}
                <a href="mailto:info@tennis-ladder.com">info@tennis-ladder.com</a>. Rival will make every reasonable
                effort to support equal access and inclusion for all participants.
            </p>

            <h2>{number++}. Miscellaneous Provisions</h2>
            <p>The following outlines any miscellaneous provisions not covered in prior sections:</p>
            <ul>
                <li>
                    <b>Entire agreement</b>: These Terms, together with Rival&apos;s Rules and Privacy Policy, form the
                    entire agreement between you and Rival.
                </li>
                <li>
                    <b>Severability</b>: If any provision is found invalid, the remaining sections remain enforceable.
                </li>
                <li>
                    <b>Waiver</b>: Rival&apos;s failure to enforce any term is not a waiver of its rights.
                </li>
                <li>
                    <b>Assignment</b>: Rival may assign its rights or obligations under these Terms at any time without
                    notice.
                </li>
            </ul>

            <h2>{number++}. Contact Information</h2>
            <p>For questions, concerns, or requests related to these Terms, contact us using the following:</p>
            <p>
                <b>Mail</b>:
            </p>
            <p>
                Rival Tennis Ladder, LLC
                <br />
                207 W Millbrook Rd. Ste 210, #202
                <br />
                Raleigh, NC 27609
            </p>
            <p>
                <b>Email</b>: <a href="mailto:info@tennis-ladder.com">info@tennis-ladder.com</a>
            </p>
            <p>
                For more details, see our <a href="/contacts">Contact</a> page
            </p>
        </div>
    );
};

export default TermsAndConditions;
