import type { Config, Image } from '../types';
import { normal } from './normal';
import { getListAsString } from '../utils/helpers';

type Params = {
    config: Config;
    reporter: string;
    date: string;
    levelName: string;
    ladderLink: string;
    img: Image;
    isUnavailable: boolean;
    multiLadderMatch: string[];
    previewText: string;
};

export default ({
    config,
    reporter,
    date,
    levelName,
    ladderLink,
    img,
    isUnavailable,
    multiLadderMatch,
    previewText = '',
}: Params) =>
    normal(
        `
  <mj-text><b>${reporter}</b> reported the results of your ${
      isUnavailable ? 'Teams ' : ''
  }match on <b>${date}</b>.</mj-text>
  <mj-image src="${img.src}" width="${img.width}px" height="${img.height}px" alt="${previewText}" />
  ${
      multiLadderMatch
          ? `<mj-text>Since you and ${reporter} play in the ${getListAsString(
                multiLadderMatch
            )} ladders, the match will be reported in each ladder.</mj-text>`
          : ''
  }
  <mj-text>If this score is incorrect, please update it on the <a href="${ladderLink}">${levelName} Ladder</a>.</mj-text>
`,
        { config, previewText }
    );
