import { normal } from './normal';

export default (config, { userName, author, comment, message, previewText }) => {
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
