import type { Config } from '../types';
import { normal, h2 } from './normal';

type Params = {
    config: Config;
    captainName: string;
    teamsUrl: string;
    reason: string;
    previewText: string;
};

export default ({ config, captainName, teamsUrl, reason, previewText }: Params) =>
    normal(
        `${h2('Hello, #firstName#!', 'padding-top="10px"')}

  <mj-text><b>${captainName}</b> disbanded your team.</mj-text>

  ${reason ? `<mj-text><b>Reason:</b> ${reason}</mj-text>` : ''}

  <mj-text>Find another team, add your name to the player pool, or create your own team on the <a href="${teamsUrl}">Teams page</a> instead.</mj-text>`,
        { config, previewText }
    );
