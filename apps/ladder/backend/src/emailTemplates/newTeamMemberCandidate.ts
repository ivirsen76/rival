import type { Config } from '../types';
import { normal, h2 } from './normal';

type Params = {
    config: Config;
    playerName: string;
    playerFirstName: string;
    initialTlr: string;
    teamsUrl: string;
    comment: string;
    previewText: string;
};

export default ({ config, playerName, playerFirstName, initialTlr, teamsUrl, comment, previewText }: Params) =>
    normal(
        `
  ${h2('Hello, #firstName#!', 'padding-top="10px"')}
  <mj-text><b>${playerName}</b> is available to be a team member.</mj-text>

  <mj-text>
      ${comment ? `<b>Comment:</b> ${comment}.<br>` : ''}
      <b>${playerFirstName}'s Initial TLR:</b> ${initialTlr}
  </mj-text>

  <mj-text>Add him to your team on the <a href="${teamsUrl}">Teams page</a>.</mj-text>
`,
        { config, previewText }
    );
