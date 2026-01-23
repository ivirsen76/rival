import type { Config } from '../types';
import { normal, h2 } from './normal';

export default (config: Config, { captainName, teamsUrl, previewText }) =>
    normal(
        `
  ${h2('Hello, #firstName#!', 'padding-top="10px"')}
  <mj-text><b>${captainName}</b> created a team and included you as a member.</mj-text>
  <mj-text>If you agreed to join, good luck this season! If not, you can withdraw on the <a href="${teamsUrl}">Teams page</a>.</mj-text>`,
        { config, previewText }
    );
