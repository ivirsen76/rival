import type { Config } from '../types';
import { normal } from './normal';
import { getPlayerName } from '../services/users/helpers';

export default (config: Config, { reason, description, currentUser, opponent, avoided, previewText }) => {
    const currentUserName = getPlayerName(currentUser);
    const opponentName = getPlayerName(opponent);

    return normal(
        `
  <mj-text><b>${currentUserName}</b> complained about <b>${opponentName}</b>:</mj-text>
  <mj-text>
    <b>Type:</b> ${reason}<br>
    <b>Description:</b> ${description}<br>
    <b>Avoided:</b> ${avoided ? 'Yes' : 'No'}
  </mj-text>
`,
        { config, previewText }
    );
};
