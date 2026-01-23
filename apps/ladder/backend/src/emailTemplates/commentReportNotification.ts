import type { Config, User } from '../types';
import { normal } from './normal';

type Params = {
    config: Config;
    userName: User;
    author: string;
    comment: string;
    message: string;
    previewText: string;
};

export default ({ config, userName, author, comment, message, previewText }: Params) => {
    return normal(
        `
  <mj-text><b>${userName}</b> reported on a comment.</mj-text>

  <mj-text padding-bottom="0px">Comment by <b>${author}</b>:</mj-text>
  <mj-text><div style="border: 1px solid #b3e2fd; padding: 15px; background-color: #ccecfd; border-radius: 5px; color: #005f94; white-space: pre-line;">${comment}</div></mj-text>

  <mj-text padding-bottom="0px">Report:</mj-text>
  <mj-text><div style="border: 1px solid #b3e2fd; padding: 15px; background-color: #ccecfd; border-radius: 5px; color: #005f94; white-space: pre-line;">${message}</div></mj-text>
`,
        { config, previewText }
    );
};
