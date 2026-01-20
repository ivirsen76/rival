import { normal } from './normal';
import { getPlayerName, getEmailLink, getPhoneLink } from '../services/users/helpers';

export default (config, { coach, message, currentUser }) => {
    const { TL_URL } = process.env;
    const profileLink = `${TL_URL}/player/${currentUser.slug}`;

    return normal(
        `
  <mj-text>Hello, ${coach.firstName}!</mj-text>
  <mj-text><b>${getPlayerName(currentUser)}</b> sent you a message about coaching:</mj-text>

  <mj-text><div style="border: 1px solid #b3e2fd; padding: 15px; background-color: #ccecfd; border-radius: 5px; color: #005f94; white-space: pre-line;">${message}</div></mj-text>

  <mj-text padding-bottom="0px">Contact the player using this information:</mj-text>
  <mj-text>
    <b>Email:</b> ${getEmailLink(currentUser)}<br>
    <b>Phone:</b> ${getPhoneLink(currentUser)}<br>
    <b>Profile:</b> <a href="${profileLink}">${profileLink}</a>
  </mj-text>
`,
        { config }
    );
};
