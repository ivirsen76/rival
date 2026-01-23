import type { Config } from '../types';
import { normal } from './normal';

export default (config: Config, { challenger, acceptor, date, location, isRescheduling, previewText }) =>
    normal(
        `
  <mj-text><b>${challenger}</b> and <b>${acceptor}</b> ${
      isRescheduling ? 'rescheduled' : 'scheduled'
  } a match.</mj-text>
  <mj-text>
    <b>Date:</b> ${date}<br>
    <b>Location:</b> ${location}
  </mj-text>
`,
        { config, previewText }
    );
