import type { Config } from '../types';
import { normal } from './normal';

type Params = {
    config: Config;
    userName: string;
    userEmail: string;
    profileLink: string;
    levelFrom: string;
    levelTo: string;
};

export default ({ config, userName, userEmail, profileLink, levelFrom, levelTo }: Params) =>
    normal(
        `
  <mj-text><b>${userName}</b> switched level from <b>${levelFrom}</b> to <b>${levelTo}</b></mj-text>
  <mj-text>
    <b>Email:</b> <a href="mailto:${userEmail}">${userEmail}</a><br>
    <b>Profile:</b> <a href="${profileLink}">${profileLink}</a>
  </mj-text>
`,
        { config }
    );
