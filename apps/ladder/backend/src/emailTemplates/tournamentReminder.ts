import type { Config } from '../types';
import { normal, h2 } from './normal';

type Params = { config: Config; seasonName: string; link: string; levelName: string; entity: string };

export default ({ config, seasonName, link, levelName, entity }: Params) => {
    return normal(
        `
  ${h2(`Thank you for your participation in the ${seasonName} Ladder!`, 'padding-top="10px"')}
  <mj-text>The Final Tournament begins next week. The top ${entity}s who sign up for the tournament will be eligible to play.</mj-text>
  <mj-text>Go to the <a href="${link}">${levelName} Ladder page</a> and let us know if you will be participating.</mj-text>
`,
        { config }
    );
};
