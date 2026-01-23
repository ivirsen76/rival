import type { Config, User } from '../types';
import { normal } from './normal';
import { getPlayerName } from '../services/users/helpers';

type Params = {
    config: Config;
    reason: string;
    description: string;
    currentUser: User;
    opponent: User;
    avoided: boolean;
    previewText: string;
};

export default ({ config, reason, description, currentUser, opponent, avoided, previewText }: Params) => {
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
