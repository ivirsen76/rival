import type { Config } from '../types';
import { normal, h2 } from './normal';
import { getPlayerName, getEmailLink, getPhoneLink } from '../services/users/helpers';

export default (config: Config, { message, currentUser }) => {
    const { TL_URL } = process.env;
    const profileLink = `${TL_URL}/player/${currentUser.slug}`;

    return normal(
        `
  ${h2('Hello, #firstName#!', 'padding-top="10px"')}
  <mj-text><a href="${profileLink}"><b>${getPlayerName(currentUser)}</b></a> sent you a message:</mj-text>

  <mj-text><div style="border: 1px solid #b3e2fd; padding: 15px; background-color: #ccecfd; border-radius: 5px; color: #005f94; white-space: pre-line;">${message}</div></mj-text>

  <mj-text padding-bottom="0px">Contact the player using this information:</mj-text>
  <mj-text>
    <b>Email:</b> ${getEmailLink(currentUser)}<br>
    <b>Phone:</b> ${getPhoneLink(currentUser)}<br>
  </mj-text>
`,
        { config }
    );
};
