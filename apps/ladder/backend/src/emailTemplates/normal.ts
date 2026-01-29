import mjml2html from 'mjml';
import fs from 'fs';
import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getEmailLink } from '../social';
import { S3_BUCKET_NAME } from '../constants';
import dayjs from '@rival/dayjs';
import practiceTypeOptions from '../services/proposals/practiceTypeOptions';
import matchFormatOptions from '../services/proposals/matchFormatOptions';
import durationOptions from '../services/proposals/durationOptions';
import type { Config, Proposal } from '../types';

const { TL_URL } = process.env;

export const h2 = (text: string, attributes = '') =>
    `<mj-text ${attributes} font-size="22px" font-weight="bold" padding-top="40px" padding-bottom="14px" line-height="27px">${text}</mj-text>`;

export const h3 = (text: string, attributes = '') =>
    `<mj-text ${attributes} font-size="20px" font-weight="bold" padding-top="36px" padding-bottom="12px" line-height="24px">${text}</mj-text>`;

export const warning = (text: string) =>
    `<mj-text container-background-color="#fff3cd" color="#664d03">${text}</mj-text><mj-spacer height="10px" />`;

export const socialLinks = ({ referralCode = '#referralCode#' } = {}) => {
    const emailLink = getEmailLink(TL_URL!, referralCode);
    const instagramLink = 'https://www.instagram.com/rivaltennisladder';
    const facebookLink = 'https://www.facebook.com/rivaltennisladder';

    return `<mj-social font-size="15px" icon-size="30px" mode="horizontal">
  <mj-social-element href="${emailLink}" background-color="#666666" src="https://utl.nyc3.digitaloceanspaces.com/images/email.png" text-padding="4px 14px 4px 0">
    Email
  </mj-social-element>
  <mj-social-element background-color="#ea1a5c" name="instagram-noshare" href="${instagramLink}" text-padding="4px 14px 4px 0">
    Instagram
  </mj-social-element>
  <mj-social-element name="facebook-noshare" href="${facebookLink}" text-padding="4px 0 4px 0">
    Facebook
  </mj-social-element>
</mj-social>`;
};

export const thankYou = ({ config, referralCode = '#referralCode#' }: { config: Config; referralCode?: string }) => {
    const totalCredit = (config.referralFirstMatchCredit + config.referralFirstPaymentCredit) / 100;

    return `${h2('Thank You for Joining!')}
<mj-text>Please <b>let your friends know about us</b> directly, via email, or by sharing our app with others on social media:</mj-text>

${socialLinks({ referralCode })}

<mj-text>For every person who plays on a ladder from your referral, you can <b>earn up to $${totalCredit}</b>! Learn more about the program on your <a href="${TL_URL}/user/referral">Referral Page</a>.</mj-text>
`;
};

export const signature = ({ config }: { config: Config }) => {
    return `<mj-text>See you on the courts!</mj-text>
     <mj-text font-style="italic">${
         config.isRaleigh ? 'Ken Glanville, Raleigh Ladder Director' : 'Andrew Cole, Co-Founder of Rival Tennis Ladder'
     }</mj-text>`;
};

export const renderProposal = (proposal: Proposal) => {
    const proposalDate = dayjs.tz(proposal.playedAt).format('ddd, MMM D, h:mm A');
    const practiceType =
        proposal.practiceType && proposal.practiceType < 99
            ? practiceTypeOptions.find((item) => item.value === proposal.practiceType)?.label
            : null;
    const matchFormat =
        proposal.matchFormat && proposal.matchFormat > 0
            ? matchFormatOptions.find((item) => item.value === proposal.matchFormat)?.label
            : null;
    const duration = proposal.duration ? durationOptions.find((item) => item.value === proposal.duration)?.label : null;

    return `
        <b>Date:</b> ${proposalDate}<br>
        <b>Location:</b> ${proposal.place}
        ${matchFormat ? `<br><b>Match format:</b> ${matchFormat}` : ''}
        ${practiceType ? `<br><b>Practice type:</b> ${practiceType}` : ''}
        ${duration ? `<br><b>Duration:</b> ${duration}` : ''}
        ${proposal.comment ? `<br><b>Comment:</b> ${proposal.comment}` : ''}`;
};

const imageUrlCache: Record<string, string> = {};
export const getImageUrl = (path: string) => {
    if (imageUrlCache[path]) {
        return imageUrlCache[path];
    }

    if (process.env.NODE_ENV === 'test' && !process.env.TL_EMAILS_AND_IMAGES) {
        return `https://nyc3.digitaloceanspaces.com/utl/production/ada3148b518bd4da04671e36231f9c5c763adebd0fc7069e63ed16402949aa8e.png`;
    }

    const buffer = fs.readFileSync(path);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(buffer);

    const key = `images/${hashSum.digest('hex').slice(0, 10)}.png`;
    const src = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${S3_BUCKET_NAME}/${key}`;
    imageUrlCache[path] = src;

    // Don't wait for this function to run
    (async () => {
        const client = new S3Client();
        const command = new PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: 'image/png',
        });
        await client.send(command);
    })();

    return src;
};

const renderPreviewText = (text: string) => {
    const style = 'display:none;max-height:0px;overflow:hidden;font-size:1px;line-height:1px;color:#ffffff;opacity:0;';

    return `
<mj-raw>
    <div style="${style}">${text}&nbsp;|&nbsp;</div>
</mj-raw>`;
};

const getTemplate =
    ({ width = 600 } = {}) =>
    (
        body: string,
        {
            config,
            previewText,
            showSocialIcons = true,
        }: { config: Config; previewText?: string; showSocialIcons?: boolean }
    ) => {
        const logoImage = getImageUrl(__dirname + '/images/logo.png');
        const twitterImage = getImageUrl(__dirname + '/images/twitter.png');
        const facebookImage = getImageUrl(__dirname + '/images/facebook.png');
        const instagramImage = getImageUrl(__dirname + '/images/instagram.png');

        return mjml2html(
            `
  <mjml>
    <mj-head>
      <mj-title>Rival Tennis Ladder</mj-title>
      <mj-font name="Nunito" href="https://fonts.googleapis.com/css?family=Nunito+Sans:400,700&display=swap"></mj-font>
      <mj-attributes>
        <mj-all font-family="Nunito Sans, Helvetica, Arial, sans-serif" />
        <mj-text font-size="16px" color="#000000" line-height="24px" />
        <mj-button font-size="16px" background-color="#22bc66" />
      </mj-attributes>
      <mj-style>
        ${showSocialIcons ? `@media (max-width: 550px) { .hide-social { display: none; } }` : ''}
        @media (max-width: ${width + 40}px) {
          .gap {
            display: none;
          }
        }
        .open {
          border: 1px solid #999;
          border-radius: 5px;
          padding: 0 5px;
          background-color: #fff;
        }
      </mj-style>
    </mj-head>
    <mj-body background-color="#efeff9" width="${width}px">
      ${previewText ? renderPreviewText(previewText) : ''}
      <mj-section background-color="#efeff9" padding-top="20px" padding-bottom="0px" css-class="gap">
      </mj-section>
      <mj-section background-color="#000000" padding-top="10px" padding-bottom="10px">
        <mj-column>
          <mj-table line-height="1">
            <tr>
              <td width="50px" style="vertical-align: top;">
                <img src="${logoImage}" alt="Rival Logo" width="36px" height="36px" style="line-height: 0;"/>
              </td>
              <td style="vertical-align: top;">
                <div style="font-size: 18px; font-weight: bold; color: #e3db69; line-height: 18px;">Rival Tennis Ladder</div>
                <div style="font-size: 14px; color: #ccc; line-height: 14px; padding-top: 4px;">${config.city}, ${
                    config.state
                }</div>
              </td>
              <td>&nbsp;</td>
              ${
                  showSocialIcons
                      ? `<td width="140px" style="vertical-align: top; text-align: right;" class="hide-social"><a href="https://www.facebook.com/rivaltennisladder"><img src="${facebookImage}" alt="Facebook" width="36px" height="36px" /></a>&nbsp;&nbsp;<a href="https://twitter.com/Rival_Tennis"><img src="${twitterImage}" alt="Twitter" width="36px" height="36px" /></a>&nbsp;&nbsp;<a href="https://www.instagram.com/rivaltennisladder"><img src="${instagramImage}" alt="Instagram" width="36px" height="36px" /></a></td>`
                      : ''
              }
            </tr>
          </mj-table>
        </mj-column>
      </mj-section>
      <mj-section background-color="#ffffff">
        <mj-column css-class="rival-template-body">
          ${body}
          <mj-raw><div data-preview="${previewText || ''}" data-city="${config.city}, ${config.state}"></div></mj-raw>
        </mj-column>
      </mj-section>
      <mj-section background-color="#efeff9">
        <mj-column width="360px">
          <mj-text font-size="13px" line-height="16px" align="center" color="#828aaa">If you have any questions, please email us at<br><a href="mailto:info@tennis-ladder.com" style="color: #828aaa;">info@tennis-ladder.com</a>.</mj-text>

          <mj-text font-size="13px" line-height="16px" align="center" color="#828aaa"><a href="${TL_URL}/terms-and-conditions" style="color: #828aaa;">Terms & Conditions</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;<a href="${TL_URL}/privacy-policy" style="color: #828aaa;">Privacy Policy</a></mj-text>

          <mj-divider border-width="2px" border-color="lightgrey" />

          <mj-text font-size="13px" line-height="16px" align="center" color="#828aaa">You are receiving this email because you expressed interest in local tennis opportunities or updates from Rival Tennis Ladder. If you no longer wish to receive future emails, please <a href="#unsubscribeLink#" style="color: #828aaa;">unsubscribe</a>.</mj-text>
          
          <mj-text font-size="13px" line-height="16px" align="center" color="#828aaa">2021-${new Date().getFullYear()} © Rival Tennis Ladder, LLC<br>207 W Millbrook Rd. Ste 210, #202<br>Raleigh, NC, 27609</mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
`,
            { validationLevel: 'strict' }
        ).html;
    };

export const simple = (content: string) => {
    return mjml2html(
        `
  <mjml>
    <mj-head>
      <mj-title>Rival Tennis Ladder</mj-title>
      <mj-font name="Nunito" href="https://fonts.googleapis.com/css?family=Nunito+Sans:400,700&display=swap"></mj-font>
      <mj-attributes>
        <mj-all font-family="Nunito Sans, Helvetica, Arial, sans-serif"></mj-all>
        <mj-text font-size="16px" color="#000000" line-height="24px"></mj-text>
      </mj-attributes>
    </mj-head>
    <mj-body>
      <mj-section>
        <mj-column>
          <mj-text>${content}</mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
`,
        { validationLevel: 'strict' }
    ).html;
};

export const normal = getTemplate();
export const wide = getTemplate({ width: 800 });
