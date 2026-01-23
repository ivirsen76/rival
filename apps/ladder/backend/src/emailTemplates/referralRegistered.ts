import type { Config } from '../types';
import { normal, h2 } from './normal';

type Params = {
    config: Config;
    fullName: string;
    referralName: string;
    referralLink: string;
    refPercent: string;
    refYears: string;
};

export default ({ config, fullName, referralName, referralLink, refPercent, refYears }: Params) => {
    const isPartner = Boolean(refPercent);
    const benefitsInfo = isPartner
        ? `<mj-text>You will receive <b>${refPercent}%</b> of all payments for <b>${refYears} years</b> since player registration.</mj-text>`
        : `<mj-text>You'll get <b>$${
              config.referralFirstMatchCredit / 100
          }</b> when they play their first match and <b>$${
              config.referralFirstPaymentCredit / 100
          }</b> when they pay for their first season!</mj-text>`;

    return normal(
        `
    ${h2('Hello, #firstName#!', 'padding-top="10px"')}
  <mj-text>${
      isPartner ? '' : 'Your friend, '
  }<a href="${referralLink}"><b>${referralName}</b></a>, just signed up for the ${
      config.city
  } Rival Tennis Ladder using your referral!</mj-text>
    ${benefitsInfo}
`,
        { config }
    );
};
