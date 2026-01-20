import { normal, h2 } from './normal';

export default (config, { user, opponent, lead, history, img, previewText }) => {
    const profileUrl = `${process.env.TL_URL}/player/${user.slug}`;
    const isLeading = lead[0] > lead[1];

    return normal(
        `
  ${h2('Hello, #firstName#!', 'padding-top="10px"')}
  <mj-text>After your most recent match you have a new rival: <b>${opponent.name}</b>!</mj-text>
  <mj-image src="${img.src}" width="${img.width}px" height="${img.height}px" alt="${previewText}" />
  <mj-text>You establish a new rival when you play an opponent 3 times. You ${isLeading ? 'lead' : 'are behind'} <b>${
      opponent.name
  }</b> in the head to head <b>${lead.join('-')}</b>:</mj-text>
  <mj-text>
    <ul style="margin: 0 !important; padding-top: 0px; padding-bottom: 0px;">
      ${history
          .map(match => `<li><b>${match.date}</b>: You ${match.isWinner ? 'won' : 'lost'} <b>${match.score}</b></li>`)
          .join('')}
    </ul>
  </mj-text>
  <mj-text>Follow your progress in rivalries by tracking these stats on <a href="${profileUrl}">your Rival profile</a>.</mj-text>`,
        { config, previewText }
    );
};
