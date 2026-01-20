import { normal, h2 } from './normal';

export default (config, { memberName, isDisbanded, teamsUrl, reason, previewText }) =>
    normal(
        `
  ${h2('Hello, #firstName#!', 'padding-top="10px"')}

  <mj-text><b>${memberName}</b> left your team.</mj-text>

  ${reason ? `<mj-text><b>Reason:</b> ${reason}</mj-text>` : ''}

  ${
      isDisbanded
          ? `<mj-text>Your team was disbanded because all teams require at least two players. Create another team on the <a href="${teamsUrl}">Teams page</a>.</mj-text>`
          : ''
  }`,
        { config, previewText }
    );
