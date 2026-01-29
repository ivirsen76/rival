import type { Config } from '../types';
import { normal } from './normal';
import formatElo from '../utils/formatElo';

type Params = {
    config: Config;
    userName: string;
    profileLink: string;
    joinReason: string;
    elo: number;
    level: string;
    previewText: string;
};

export default ({ config, userName, profileLink, joinReason, elo, level, previewText }: Params) => {
    return normal(
        `
  <mj-text><a href="${profileLink}"><b>${userName}</b></a> with TLR <b>${formatElo(
      elo
  )}</b> joined <b>${level}</b> with the reason:</mj-text>
  <mj-text><div style="border: 1px solid #b3e2fd; padding: 15px; background-color: #ccecfd; border-radius: 5px; color: #005f94; white-space: pre-line;">${joinReason}</div></mj-text>
`,
        { config, previewText }
    );
};
