import type { Config } from '../types';
import { normal, h2, getImageUrl, signature } from './normal';

export default (config: Config) =>
    normal(
        `
${h2('Hello, #firstName#!', 'padding-top="10px"')}

<mj-text>We noticed you haven't played any matches yet on ${
            config.city
        } Rival Tennis Ladder. We would love to see you on the courts!</mj-text>

<mj-text>Getting out to play on the Rival Tennis Ladder is easy. Here are some ways to start playing:</mj-text>

<mj-image src="${getImageUrl(__dirname + '/images/actions.png')}" alt="Actions" width="260px" height="82px" />

<mj-text>
    <ul style="margin: 0 !important; padding-top: 0px; padding-bottom: 0px;">
        <li style="margin-bottom: 10px;"><b>Create a proposal for a time and date at a court you want to play at.</b> Other players on the ladder will see your proposal on the system or through email, and they will be able to accept it directly. Once accepted, you and your opponent will meet to play on the day of the match.</li>
        <li style="margin-bottom: 0px;"><b>Schedule a match independently and report it in the system.</b> If you know someone on the ladder already, just reach out to them individually and ask when they would be able to play. Once you complete your match, just report it in the system to start getting points.</li>
    </ul>
 </mj-text>

 <mj-text>No matter how you choose to play your first match, getting out and playing on the Rival Tennis Ladder is simple. We love to see new players out on the courts, so try one of these methods today!</mj-text>

 <mj-text>Thank you for your participation on the Rival Tennis Ladder. If you have any questions, don't hesitate to reach out to us!</mj-text>

${signature({ config })}`,
        { config }
    );
