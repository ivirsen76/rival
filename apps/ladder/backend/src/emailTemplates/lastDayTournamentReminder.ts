import type { Config } from '../types';
import { normal, h2 } from './normal';

export default (config: Config, { seasonName, link, levelName, isRegistered }) =>
    normal(
        `
        ${h2(`Thanks again for participating in the ${seasonName} Ladder!`, 'padding-top="10px"')}
    ${
        isRegistered
            ? `<mj-text>We see you already signed up for the Final Tournament in the <b>${levelName}</b> ladder. Are you still available to play in this tournament?</mj-text>
<mj-text>If so, good luck in the tournament!</mj-text>
<mj-text>If not, could you <a href="${link}">change your status</a> in the ${levelName} today?</mj-text>`
            : `<mj-text>We noticed you haven't decided whether or not you are playing the tournament that begins next week. As a reminder, the top players who sign up will be eligible to play in the tournament.</mj-text>
    <mj-text>Could you confirm or decline your entry into the tournament by midnight tonight?</mj-text>
    <mj-text>Go to the <a href="${link}">${levelName} page</a> and let us know if you can play the upcoming tournament.</mj-text>`
    }
`,
        { config }
    );
