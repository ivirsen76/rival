import type { Config } from '../types';
import { normal, renderProposal } from './normal';

export default (
    config: Config,
    { level, proposal, proposalPlayer, proposalLink, isFriendlyProposal, teamDetails, previewText }
) => {
    const entity = proposal.practiceType ? 'practice' : isFriendlyProposal ? 'friendly match' : 'match';

    return normal(
        `
  <mj-text><b>${proposalPlayer}</b> proposed a new ${entity} in <a href="${proposalLink}">${level}</a>:</mj-text>
  <mj-text>${renderProposal(proposal)}</mj-text>
  ${teamDetails || ''}
  <mj-text>Getting too many proposal emails? <a href="#adjustProposalsLink#">Adjust frequency</a></mj-text>
`,
        { config, previewText }
    );
};
