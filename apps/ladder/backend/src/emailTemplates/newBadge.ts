import { normal, h2 } from './normal';

const phrases = ['Awesome job', 'Great job', 'Amazing job', 'You crushed it', 'You are unstoppable', 'You are on fire'];

export default (config, { badges }) => {
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    const walletUrl = `${process.env.TL_URL}/user/wallet`;
    const badgesUrl = `${process.env.TL_URL}/user/badges`;

    return normal(
        `
    ${h2(`${randomPhrase}, #firstName#!`, 'padding-top="10px"')}
    <mj-text>You earned ${badges.length === 1 ? 'a new badge' : 'new badges'}!</mj-text>
    <mj-table font-size="16px" line-height="24px">
        ${badges
            .map(
                (badge) => `<tr>
    <td width="100px" style="padding-top: 5px; padding-bottom: 5px;">
        <img src="${badge.image}" style="width: 100%;" />
    </td>
    <td style="padding-left: 15px;">
        <div style="font-size: 22px; font-weight: bold; line-height: 27px; padding-bottom: 5px;">${badge.title}</div>
        <div style="font-size: 16px; line-height: 24px;">${badge.description}</div>
    </td>
</tr>`
            )
            .join('')}
    </mj-table>
    <mj-text>With ${badges.length === 1 ? 'this badge' : 'these badges'}, you earned <b>$${
        badges.length
    }</b> in your <a href="${walletUrl}">Rival Wallet</a>!</mj-text>
    <mj-text>See all your badge progress and more insights by visiting your <a href="${badgesUrl}">Rival Badges</a>.</mj-text>
`,
        { config }
    );
};
