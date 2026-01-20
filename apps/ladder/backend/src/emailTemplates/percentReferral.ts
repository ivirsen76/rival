import { normal, h2, signature } from './normal';

const { TL_URL } = process.env;

export default config => {
    const { city } = config;
    const refLink = `${TL_URL}/ref/#referralCode#`;

    return normal(
        `
    ${h2('Hi, #firstName#!', 'padding-top="10px"')}
<mj-text>Welcome to the ${city} Rival Tennis Ladder - we're excited to have you join us! As one of our first adopters, you're not just a player - you're a key part of building an exciting tennis community from the ground up.</mj-text>
<mj-text>We've established multiple tennis communities over the years, and we know it takes a solid group of players to make the ladder fun and competitive. Without those people playing often and growing the community through word of mouth, we wouldn't be successful. </mj-text>
<mj-text>That's why we're offering you our <b>Rival Referral Rewards</b> program, where you can earn cash for helping us grow the ladder in your area.</mj-text>

${h2('How Rival Referral Rewards Works:')}

<mj-text>
    <ul style="margin: 0 !important; padding-top: 0px; padding-bottom: 0px;">
        <li><b>Share your personal referral link</b> (below) with friends who love tennis, or tell them to let us know you referred them when they register.</li>
        <li><b>Earn 30% of their payments</b> for the next <b>3 years</b> any time they pay for a ladder.</li>
        <li><b>Build the ladder and the community</b> by referring players, creating a bigger, better ladder for everyone.</li>
    </ul>
</mj-text>


<mj-text>💡 <b>Imagine</b>: You refer just 5 friends who pay $30 per season. That's <b>$180 per year</b> paid directly to you for the next <b>3 years</b>! Want more? Simply invite more players!</mj-text>
<mj-text>👉 <b>Your personal referral link:</b> <a href="${refLink}">${refLink}</a></mj-text>
<mj-text>🎯 <b>Share it in your tennis group chat, social media, or just text a friend:</b></mj-text>

<mj-text padding-left="80px" padding-right="80px"><i>"Hey! I just joined this new tennis ladder in ${city}. It's a great way to play more matches and meet more players based on your schedule. Sign up today using this link: ${refLink}"</i></mj-text>

${h2(`Let's Grow ${city} Tennis Together!`)}

<mj-text>We're counting on trailblazers like you to help us kick things off strong. Do you have questions about the program or the ladder? Just reply to this email - we're here to help!</mj-text>
    ${signature({ config })}`,
        { config }
    );
};
