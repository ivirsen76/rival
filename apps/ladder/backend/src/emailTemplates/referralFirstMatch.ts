import { normal, h2 } from './normal';

export default (config, { referralName }) => {
    const walletUrl = `${process.env.TL_URL}/user/wallet`;
    const referralUrl = `${process.env.TL_URL}/user/referral`;

    return normal(
        `
    ${h2('Hello, #firstName#!', 'padding-top="10px"')}
  <mj-text>Your friend, <b>${referralName}</b>, just played their first match on the ${
      config.city
  } Rival Tennis Ladder!</mj-text>
  <mj-text>Therefore, we are crediting you <b>$${
      config.referralFirstMatchCredit / 100
  }</b> to your <a href="${walletUrl}">Rival Wallet</a>!</mj-text>
  <mj-text>View your <a href="${referralUrl}">Referral page</a> to see how much referral credit you’ve earned so far!</mj-text>
`,
        { config }
    );
};
