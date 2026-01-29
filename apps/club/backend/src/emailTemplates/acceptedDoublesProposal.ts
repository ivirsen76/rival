import { normal } from './normal';
import type { Config, User } from '../types';

const getName = (player: User) => `${player.firstName.slice(0, 1)}. ${player.lastName}`;

type Params = {
    config: Config;
    challenger: User;
    challenger2: User;
    acceptor: User;
    acceptor2: User;
    level: string;
    proposalDate: string;
    proposalLocation: string;
    previewText: string;
};

export default ({
    config,
    challenger,
    challenger2,
    acceptor,
    acceptor2,
    level,
    proposalDate,
    proposalLocation,
    previewText,
}: Params) => {
    // prettier-ignore
    return normal(
`<mj-text>Four players agreed to play the match in ${level}:</mj-text>
<mj-text><b>${getName(challenger)}</b>/<b>${getName(challenger2)}</b> vs <b>${getName(acceptor)}</b>/<b>${getName(acceptor2)}</b></mj-text>
<mj-text padding-bottom="0px">Proposal details:</mj-text>
<mj-text>
    <b>Date:</b> ${proposalDate}<br>
    <b>Location:</b> ${proposalLocation}
</mj-text>
<mj-text>Please arrive at the court on time for the convenience of all players.</mj-text>`,
        { config, previewText }
    );
};
