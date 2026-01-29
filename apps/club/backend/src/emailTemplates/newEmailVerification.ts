import type { Config } from '../types';
import { normal } from './normal';

type Params = { config: Config; verificationCode: string };

export default ({ config, verificationCode }: Params) =>
    normal(
        `
  <mj-text>This is your confirmation code to verify your new email:</mj-text>
  <mj-text align="center" font-weight="bold" font-size="40px" line-height="60px">${verificationCode}</mj-text>
  <mj-text>If you did not ask about changing email please ignore this message.</mj-text>
  <mj-text>Thanks,<br>The Rival Tennis Ladder Team</mj-text>
`,
        { config }
    );
