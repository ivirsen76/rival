import type { Config } from '../types';
import { normal } from './normal';

type Params = {
    config: Config;
    challenger: string;
    acceptor: string;
    date: string;
    location: string;
    isRescheduling: boolean;
    previewText: string;
};

export default ({ config, challenger, acceptor, date, location, isRescheduling, previewText }: Params) =>
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
