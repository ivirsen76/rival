import { normal } from './normal';

export default (config, { actionLink, fullName }) => {
    const contactLink = process.env.TL_URL + '/contacts';

    return normal(
        `
  <mj-text>You recently requested to reset your password for your Rival Tennis Ladder account. Use the button below to reset it. <strong>This password reset is only valid for the next 24 hours.</strong></mj-text>

  <mj-button href="${actionLink}">Reset your password</mj-button>

  <mj-text>If you did not request a password reset, please ignore this email or <a href="${contactLink}">contact support</a> if you have questions.</mj-text>
  <mj-text>Thanks,<br>The Rival Tennis Ladder Team</mj-text>
`,
        { config }
    );
};
