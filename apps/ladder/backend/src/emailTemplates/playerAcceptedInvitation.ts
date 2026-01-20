import { normal, h2 } from './normal';

export default (config, { playerName, previewText }) =>
    normal(
        `
  ${h2('Hello, #firstName#!', 'padding-top="10px"')}
  <mj-text><b>${playerName}</b> accepted your invitation and joined the team!</mj-text>
`,
        { config, previewText }
    );
