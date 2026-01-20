import { wide } from './normal';

export default (config, { reporter, date, stat }) =>
    wide(
        `
  <mj-text><b>${reporter}</b> uploaded statistics for your match on <b>${date}</b>.</mj-text>
  <mj-image src="${stat.imageUrl}" border-radius="5px"/>
`,
        { config }
    );
