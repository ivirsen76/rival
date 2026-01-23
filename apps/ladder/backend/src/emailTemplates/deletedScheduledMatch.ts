import type { Config } from '../types';
import { normal } from './normal';
import { getPlayerName, getEmailLink, getPhoneLink } from '../services/users/helpers';

export default (config: Config, { currentUser, reason, playedAt, previewText }) =>
    normal(
        `
  <mj-text><b>${getPlayerName(currentUser)}</b> deleted your scheduled match for ${playedAt}.</mj-text>
  <mj-text><b>Reason:</b> ${reason}.</mj-text>
  <mj-text padding-bottom="0px">You can contact ${getPlayerName(currentUser, true)} for more information:</mj-text>
  <mj-text>
    <b>Email:</b> ${getEmailLink(currentUser)}<br>
    <b>Phone:</b> ${getPhoneLink(currentUser)}
  </mj-text>
`,
        { config, previewText }
    );
