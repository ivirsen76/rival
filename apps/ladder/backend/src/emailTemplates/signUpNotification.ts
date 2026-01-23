import type { Config, User } from '../types';
import { normal } from './normal';
import { getPlayerName, formatPhone } from '../services/users/helpers';

type Params = {
    config: Config;
    userName: string;
    userEmail: string;
    userPhone: string;
    profileLink: string;
    comeFromInfo: string;
    duplicates: User[];
    previewText: string;
};

export default ({
    config,
    userName,
    userEmail,
    userPhone,
    profileLink,
    comeFromInfo,
    duplicates,
    previewText,
}: Params) => {
    const { TL_URL } = process.env;

    return normal(
        `
  <mj-text><b>${userName}</b> signed up to the system:</mj-text>
  <mj-text padding-bottom="0px">Player info:</mj-text>
  <mj-text>
    <b>Email:</b> <a href="mailto:${userEmail}">${userEmail}</a><br>
    <b>Phone:</b> <a href="sms:${userPhone}">${formatPhone(userPhone)}</a><br>
    ${comeFromInfo ? `<b>Origin:</b> ${comeFromInfo}<br>` : ''}
    <b>Profile:</b> <a href="${profileLink}">${profileLink}</a>
  </mj-text>
  ${
      duplicates.length > 0
          ? `<mj-text><b>Duplicates:</b></mj-text>
  <mj-text><ul style="margin-top: 0; margin-bottom: 0;">${duplicates
      .map((user) => `<li><a href="${TL_URL}/player/${user.slug}">${getPlayerName(user)}</a></li>`)
      .join('')}</ul></mj-text>`
          : ''
  }
`,
        { config, previewText }
    );
};
