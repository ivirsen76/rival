import type { Config } from '../types';
import { normal, h2 } from './normal';

type Params = {
    config: Config;
    proposalDate: string;
    proposalLocation: string;
    proposalComment: string;
    teamDetails: string;
    ladderLink: string;
    ladderName: string;
};

export default ({
    config,
    proposalDate,
    proposalLocation,
    proposalComment,
    teamDetails,
    ladderLink,
    ladderName,
}: Params) => {
    return normal(
        `
    ${h2('Hello, #firstName#!', 'padding-top="10px"')}
  <mj-text>The following people have a Doubles match scheduled for tomorrow, and they need just one more player to join!</mj-text>
  ${teamDetails}
  <mj-text padding-bottom="0px">Proposal details:</mj-text>
  <mj-text>
    <b>Date:</b> ${proposalDate}<br>
    <b>Location:</b> ${proposalLocation}
    ${proposalComment ? `<br><b>Comment:</b> ${proposalComment}` : ''}
  </mj-text>
  <mj-text>Are you available for this time and location?</mj-text>
  <mj-text>If so, you can accept this proposal and see other proposals on the <a href="${ladderLink}">${ladderName}</a> ladder.</mj-text>
`,
        { config }
    );
};
