import type { Config } from '../types';
import { normal } from './normal';

export default (config: Config, { userName, profileLink, photoSrc, moderationInfo, approveLink, previewText }) => {
    return normal(
        `
  <mj-text><a href="${profileLink}"><b>${userName}</b></a> added an inappropriate photo.</mj-text>

  <mj-image src="${photoSrc}" alt="" />

  <mj-text padding-bottom="0px">Moderation info:</mj-text>
  <mj-text>
    <ul style="margin: 0 !important; padding-top: 0px; padding-bottom: 0px;">
        ${moderationInfo.map((item) => `<li>${item.label}: <b>${item.percent}%</b></li>`).join('')}
    </ul>
  </mj-text>
 
  <mj-button href="${approveLink}">Approve photo</mj-button>
`,
        { config, previewText }
    );
};
