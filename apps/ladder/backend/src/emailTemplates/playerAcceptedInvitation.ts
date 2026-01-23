import type { Config } from '../types';
import { normal, h2 } from './normal';

type Params = { config: Config; playerName: string; previewText: string };

export default ({ config, playerName, previewText }: Params) =>
    normal(
        `
  ${h2('Hello, #firstName#!', 'padding-top="10px"')}
  <mj-text><b>${playerName}</b> accepted your invitation and joined the team!</mj-text>
`,
        { config, previewText }
    );
