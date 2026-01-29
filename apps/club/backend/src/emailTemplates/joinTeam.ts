import type { Config } from '../types';
import { normal, h2 } from './normal';

type Params = {
    config: Config;
    playerName: string;
    playerFirstName: string;
    initialTlr: string;
    comment: string;
    acceptLink: string;
    previewText: string;
};

export default ({ config, playerName, playerFirstName, initialTlr, comment, acceptLink, previewText }: Params) =>
    normal(
        `
  ${h2('Hello, #firstName#!', 'padding-top="10px"')}

  <mj-text><b>${playerName}</b> is requesting you add them to your team.</mj-text>

  <mj-text>
      ${comment ? `<b>Comment:</b> ${comment}.<br>` : ''}
      <b>${playerFirstName}'s Initial TLR:</b> ${initialTlr}
  </mj-text>

  <mj-button href="${acceptLink}">Accept the request</mj-button>`,
        { config, previewText }
    );
