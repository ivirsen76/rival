import { normal } from './normal';

export default (config, { challenger, acceptor, date, location, isRescheduling, previewText }) =>
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
