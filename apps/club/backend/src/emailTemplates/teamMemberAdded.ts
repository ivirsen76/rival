import type { Config } from '../types';
import { normal, h2 } from './normal';

type Params = { config: Config; captainName: string; teamName: string; previewText: string };

export default ({ config, captainName, teamName, previewText }: Params) =>
    normal(
        `
  ${h2('Hello, #firstName#!', 'padding-top="10px"')}

  <mj-text><b>${captainName}</b> added you as a member of the ${teamName} team.</mj-text>
  <mj-text>Good luck this season!</mj-text>`,
        { config, previewText }
    );
