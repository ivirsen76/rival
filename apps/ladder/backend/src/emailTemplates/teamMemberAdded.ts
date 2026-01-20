import { normal, h2 } from './normal';

export default (config, { captainName, teamName, previewText }) =>
    normal(
        `
  ${h2('Hello, #firstName#!', 'padding-top="10px"')}

  <mj-text><b>${captainName}</b> added you as a member of the ${teamName} team.</mj-text>
  <mj-text>Good luck this season!</mj-text>`,
        { config, previewText }
    );
