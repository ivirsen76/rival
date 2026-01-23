import type { Config } from '../types';
import { normal } from './normal';
import { formatPhone } from '../services/users/helpers';

export default (config: Config, { challengerName, challengerEmail, challengerPhone, level, reason, previewText }) =>
    normal(
        `
  <mj-text><b>${challengerName}</b> deleted the proposal for your upcoming match in ${level}.</mj-text>
  <mj-text><b>Reason:</b> ${reason}.</mj-text>
  <mj-text padding-bottom="0px">You can contact the player for more information:</mj-text>
  <mj-text>
    <b>Email:</b> <a href="mailto:${challengerEmail}">${challengerEmail}</a><br>
    <b>Phone:</b> <a href="sms:${challengerPhone}">${formatPhone(challengerPhone)}</a>
  </mj-text>
`,
        { config, previewText }
    );
