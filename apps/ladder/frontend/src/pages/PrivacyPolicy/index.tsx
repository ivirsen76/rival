import Card from '@/components/Card';
import ScrollToTop from '@/components/ScrollToTop';

const Terms = (props) => {
    let number = 1;

    return (
        <div className="tl-front">
            <h2 className="text-white mt-4">Privacy Policy</h2>
            <ScrollToTop />
            <Card>
                <p>
                    <b>Last Updated</b>: October 29, 2025
                </p>
                <p>
                    This Privacy Policy explains how <b>Rival Tennis Ladder, LLC</b> (“Rival Tennis Ladder,” “Rival,”
                    “we,” “us,” or “our”) collects, uses, and protects your personal information when you use our
                    website, platform, or related services (collectively, the “Platform”).
                </p>
                <p>By creating an account or using the Platform, you consent to this Policy.</p>

                <h2>{number++}. Introduction and Purpose</h2>
                <p>
                    Rival Tennis Ladder connects tennis players through organized ladders, tournaments, and match
                    scheduling. To operate effectively, we collect and process certain personal and match-related data.
                </p>
                <p>
                    We respect your privacy and are committed to keeping your personal information secure and
                    transparent in how it&apos;s used.
                </p>
                <p>
                    This Privacy Policy applies to all users of the Platform, including those accessing our website at{' '}
                    <a href="/">{window.location.origin}</a>.
                </p>

                <h2>{number++}. Information We Collect</h2>
                <p>
                    We collect information in several ways, including when you register for an account, report match
                    results, or communicate through the Platform.
                </p>

                <h3>A. Account Information</h3>
                <ul>
                    <li>Full name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Hash for password</li>
                    <li>City and ladder levels</li>
                    <li>Tennis preferences and ranking data</li>
                    <li>Submitted photos</li>
                </ul>

                <h3>B. Match and Performance Data</h3>
                <ul>
                    <li>Match proposals, confirmations, and results</li>
                    <li>Win/loss history, match statistics, and tournament standings</li>
                    <li>Any comments, feedback, or reports submitted via the Platform</li>
                </ul>

                <h3>C. Payment Information</h3>
                <p>
                    Payments are securely processed through <b>Stripe</b>. When you make a purchase or pay ladder fees:
                </p>
                <ul>
                    <li>Stripe collects and processes your credit or debit card details directly.</li>
                    <li>
                        Rival <b>does not store</b> your complete card information.
                    </li>
                    <li>
                        Stripe&apos;s privacy practices are governed by its own stipulations outlined in the{' '}
                        <a href="https://stripe.com/privacy">Stripe Privacy Policy</a>.
                    </li>
                </ul>

                <h3>D. Communication Data</h3>
                <ul>
                    <li>Emails, notifications, and messages sent through the Platform</li>
                    <li>Correspondence with Rival support (including complaints or dispute submissions)</li>
                </ul>

                <h3>E. Technical and Usage Data</h3>
                <ul>
                    <li>Browser type, device information, and IP address</li>
                    <li>Pages viewed and actions taken on the Platform</li>
                    <li>Cookies and analytics data (see Section 5)</li>
                </ul>

                <h2>{number++}. How We Use Your Information</h2>
                <p>We use your data for the following purposes:</p>

                <h3>A. Operating the Platform</h3>
                <ul>
                    <li>To manage ladder registration, rankings, and match results.</li>
                    <li>To communicate with you regarding scheduling and updates.</li>
                </ul>

                <h3>B. Account Management</h3>
                <ul>
                    <li>To maintain your account and provide login authentication.</li>
                    <li>To process payments and Rival Wallet credits.</li>
                </ul>

                <h3>C. Customer Support</h3>
                <ul>
                    <li>To respond to inquiries, disputes, or rule questions.</li>
                </ul>

                <h3>D. Improvement & Analytics</h3>
                <ul>
                    <li>
                        To analyze user behavior and site performance using <b>Google Analytics</b>.
                    </li>
                    <li>To improve the usability and experience of our Platform.</li>
                </ul>

                <h3>E. Marketing & Promotion (Optional)</h3>
                <ul>
                    <li>
                        With your consent, we may use submitted photos, testimonials, or ladder results for promotional
                        purposes.
                    </li>
                    <li>
                        Players can opt out by contacting us at{' '}
                        <a href="mailto:info@tennis-ladder.com">info@tennis-ladder.com</a>.
                    </li>
                </ul>

                <h2>{number++}. How We Share Your Information</h2>
                <p>
                    We share information only when necessary to operate the Platform or comply with legal obligations.
                </p>

                <h3>A. Public Information</h3>
                <ul>
                    <li>
                        Your name, ladder level, and match results are displayed publicly on Rival ladders and
                        leaderboards.
                    </li>
                    <li>Photos or profile images may appear publicly.</li>
                </ul>

                <h3>B. Third-Party Service Providers</h3>
                <p>We use third parties for specific operational purposes, including:</p>
                <ul>
                    <li>
                        <b>Stripe</b> for payment processing.
                    </li>
                    <li>
                        <b>Google Analytics</b> for website performance measurement.
                    </li>
                    <li>
                        <b>Twilio</b> for phone number verification.
                    </li>
                    <li>Email delivery and hosting providers for communication and account services.</li>
                </ul>
                <p>
                    Each provider is contractually required to protect your data in accordance with applicable privacy
                    laws.
                </p>

                <h3>C. Legal and Safety Requirements</h3>
                <p>We may disclose information when required to:</p>
                <ul>
                    <li>Comply with law, court orders, or legal process.</li>
                    <li>Protect Rival&apos;s rights, safety, and property or that of others.</li>
                    <li>
                        Enforce our <a href="/terms-and-conditions">Terms & Conditions</a>.
                    </li>
                </ul>

                <h3>D. Ladder Participation</h3>
                <p>The following information may be shared with other players for the purposes of participation:</p>
                <ul>
                    <li>Email address</li>
                    <li>Phone number</li>
                </ul>

                <h2>{number++}. Cookies and Tracking Technologies</h2>
                <p>
                    We use <b>cookies</b> and similar technologies to:
                </p>
                <ul>
                    <li>Maintain session security.</li>
                    <li>
                        Analyze traffic and performance through <b>Google Analytics</b>.
                    </li>
                    <li>Remember user preferences between sessions.</li>
                </ul>
                <p>
                    You can adjust your browser settings to refuse or delete cookies, though some Platform features may
                    not function properly.
                </p>
                <p>
                    For more information on how Google Analytics handles data, see{' '}
                    <a href="https://policies.google.com/privacy?hl=en-US">Google&apos;s Privacy Policy</a>.
                </p>

                <h2>{number++}. Data Retention and Security</h2>
                <p>Here is how we retain data and keep it secure:</p>
                <ul>
                    <li>
                        We retain account data as long as your account is active or as necessary to operate the
                        Platform.
                    </li>
                    <li>You may request deletion of your data (see Section 7).</li>
                    <li>
                        We use industry-standard security measures, including encryption, secure hosting, and limited
                        staff access.
                    </li>
                    <li>
                        Despite our efforts, no online system is entirely risk-free, and we cannot guarantee absolute
                        security.
                    </li>
                </ul>

                <h2>{number++}. Your Rights and Choices</h2>
                <p>You have the following rights regarding your data:</p>
                <ul>
                    <li>
                        <b>Access and correction</b>: You may view and update your account information at any time.
                    </li>
                    <li>
                        <b>Deletion</b>: You may request deletion of your personal data by emailing{' '}
                        <a href="mailto:info@tennis-ladder.com">info@tennis-ladder.com</a>.
                    </li>
                    <li>
                        <b>Opt-out</b>: You may opt out of promotional communications or photo use.
                    </li>
                    <li>
                        <b>Data portability</b>: Upon request, we may provide a summary of your account data in a
                        readable format.
                    </li>
                </ul>
                <p>We will verify identity before fulfilling requests to protect user privacy.</p>

                <h2>{number++}. Children&apos;s Privacy</h2>
                <p>Here is how we protect data related to children:</p>
                <ul>
                    <li>
                        Rival Tennis Ladder is intended for <b>adults aged 18 and older</b>.
                    </li>
                    <li>We do not knowingly collect or store information from minors.</li>
                    <li>
                        If you believe a minor has registered, please contact us immediately so we can remove their
                        account and information.
                    </li>
                </ul>

                <h2>{number++}. International Users</h2>
                <p>Here is how we handle data related to international users:</p>
                <ul>
                    <li>Rival Tennis Ladder operates primarily within the United States.</li>
                    <li>
                        If you access the Platform from outside the U.S., your information may be processed and stored
                        on U.S. servers.
                    </li>
                    <li>By using the Platform, you consent to this transfer and processing.</li>
                </ul>

                <h2>{number++}. Changes to This Policy</h2>
                <p>Rival retains the right to do the following related to this policy:</p>
                <ul>
                    <li>We may update this Privacy Policy from time to time.</li>
                    <li>
                        Updates will be posted on this page and communicated via email or on our{' '}
                        <a href="/changelog">Changelog</a>.
                    </li>
                    <li>
                        Your continued use of the Platform after updates constitutes acceptance of the revised Policy.
                    </li>
                </ul>

                <h2>{number++}. Contact Information</h2>
                <p>For questions, data requests, or privacy concerns, contact us using the following:</p>
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
            </Card>
        </div>
    );
};

export default Terms;
