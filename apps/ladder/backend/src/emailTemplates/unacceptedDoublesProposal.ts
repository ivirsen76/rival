import { normal } from './normal';
import { formatPhone } from '../services/users/helpers';

export default (config, { refuserName, refuserEmail, refuserPhone, level, reason, previewText }) =>
    normal(
        `
  <mj-text><b>${refuserName}</b> unaccepted the proposal for your upcoming match in ${level}.</mj-text>
  <mj-text><b>Reason:</b> ${reason}.</mj-text>
  <mj-text padding-bottom="0px">You can contact the player for more information:</mj-text>
  <mj-text>
    <b>Email:</b> <a href="mailto:${refuserEmail}">${refuserEmail}</a><br>
    <b>Phone:</b> <a href="sms:${refuserPhone}">${formatPhone(refuserPhone)}</a>
  </mj-text>
`,
        { config, previewText }
    );
