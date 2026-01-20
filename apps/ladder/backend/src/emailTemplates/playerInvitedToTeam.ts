import { normal, h2 } from './normal';

export default (config, { captainName, teamName, acceptLink, teamsUrl, img, comment, previewText }) =>
    normal(
        `
  ${h2('Hello, #firstName#!', 'padding-top="10px"')}

  <mj-text><b>${captainName}</b> is inviting you to join the ${teamName} team.</mj-text>


      ${comment ? `<mj-text><b>Comment:</b> ${comment}</mj-text>` : ''}


  <mj-image src="${img.src}" width="${img.width}px" height="${img.height}px" alt="" />

  <mj-button href="${acceptLink}">Join the Team</mj-button>

  <mj-text>You can see other details on the <a href="${teamsUrl}">Teams page</a>.</mj-text>`,
        { config, previewText }
    );
