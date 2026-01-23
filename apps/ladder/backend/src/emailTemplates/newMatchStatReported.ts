import type { Config } from '../types';
import { wide } from './normal';

type Params = { config: Config; reporter: string; date: string; statImageUrl: string };

export default ({ config, reporter, date, statImageUrl }: Params) =>
    wide(
        `
  <mj-text><b>${reporter}</b> uploaded statistics for your match on <b>${date}</b>.</mj-text>
  <mj-image src="${statImageUrl}" border-radius="5px"/>
`,
        { config }
    );
