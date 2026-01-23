import type { Config } from '../types';
import { normal } from './normal';

export default (config: Config, { verificationCode }) =>
    normal(
        `
  <mj-text>This is your confirmation code to verify your email:</mj-text>
  <mj-text align="center" font-weight="bold" font-size="40px" line-height="60px">${verificationCode}</mj-text>
  <mj-text>If you did not sign up for this account please ignore this email and the account will be deleted.</mj-text>
  <mj-text>Thanks,<br>The Rival Tennis Ladder Team</mj-text>
`,
        { config }
    );
