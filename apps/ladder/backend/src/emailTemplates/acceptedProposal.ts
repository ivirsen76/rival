import { normal, renderProposal } from './normal';
import { getPlayerName, getEmailLink, getPhoneLink } from '../services/users/helpers';

export default (config, { acceptorName, contact, levelName, levelType, proposal, previewText }) => {
    const entity = proposal.practiceType ? 'practice' : 'match';

    return normal(
        `
  <mj-text><b>${acceptorName}</b> accepted the proposal for a ${entity} in ${levelName}.</mj-text>
  <mj-text padding-bottom="0px">Contact info:</mj-text>
  <mj-text>
    ${levelType === 'doubles-team' ? `<b>Player:</b> ${getPlayerName(contact, true)}<br>` : ''}
    <b>Email:</b> ${getEmailLink(contact)}<br>
    <b>Phone:</b> ${getPhoneLink(contact)}
  </mj-text>
  <mj-text padding-bottom="0px">Proposal details:</mj-text>
  <mj-text>${renderProposal(proposal)}</mj-text>
`,
        { config, previewText }
    );
};
