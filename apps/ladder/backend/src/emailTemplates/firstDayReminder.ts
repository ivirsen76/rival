import type { Config } from '../types';
import { normal, h2, getImageUrl, thankYou, signature } from './normal';
import { getSeasonName } from '../services/seasons/helpers';

export default (config: Config, { currentSeason, isFirstDay = true }) => {
    const { TL_URL } = process.env;
    const seasonName = getSeasonName(currentSeason);
    const gif = '<mj-image src="https://utl.nyc3.digitaloceanspaces.com/animation/novak.gif" alt="Djokovic" />';

    return normal(
        `
    ${h2('Hello, #firstName#!', 'padding-top="10px"')}
    ${
        isFirstDay
            ? `<mj-text>Finally, the first day of the ${seasonName} session of the ${config.city} Rival Tennis Ladder is here! That means you can start hitting the courts right now!</mj-text>

    ${gif}

    <mj-text>Remember, with the Rival Tennis Ladder, the more you play, the more points you can get. So, start off this first week on the right foot by playing as much as possible!</mj-text>`
            : `<mj-text>We've received your payment for the ${config.city} Rival Tennis Ladder and added you to the ladder! That means you can start hitting the courts right now!</mj-text>

    ${gif}

    <mj-text>Remember, with the Rival Tennis Ladder, the more you play the more points you can get. So, start off your first week on the right foot by playing as much as possible!</mj-text>`
    }



    <mj-text>If you’ve played on the ladder before, then you know the drill. However, if you’re new to the ladder (or you just need a refresher course), we put together the following guide to help you get started playing on the Rival Tennis Ladder today.</mj-text>

    ${h2('Overview of Rival Tennis Ladder')}

    <mj-text>Once logged in, you'll arrive at the <b>Overview</b> page for your ladder. Here, you'll see information about all the players on the ladder on the left, such as their names, avatars, matches played, wins and losses, points gained, and overall TLR. On the right will be information about the season, such as how many weeks are left, the dates of the ladder, and when the Final Tournament will occur, as well as <b>Actions</b> you can take, <b>Open proposals</b>, and <b>Matches</b> played recently. Here is a screenshot showing how your page may appear:</mj-text>

    <mj-image src="${getImageUrl(__dirname + '/images/overview.png')}" alt="Overview" />

    ${h2('Getting Matches on Rival Tennis Ladder')}

    <mj-text>To get started on the ${
        config.city
    } Rival Tennis Ladder, you'll want to do one of the two actions found on the right sidebar of the <b>Overview</b> page:</mj-text>

    <mj-image src="${getImageUrl(__dirname + '/images/actions.png')}" alt="Actions" width="260px" height="82px" />

   <mj-text>
        <ul style="margin: 0 !important; padding-top: 0px; padding-bottom: 0px;">
            <li style="margin-bottom: 10px;"><b>Propose match</b> – A proposal is an open invitation to everyone on the ladder to accept a match at a time, date, and court of your choosing. Set these details in your proposal for others to see. Once you send a proposal, other players can accept it directly. After confirming with one another via email, text, or phone, you will meet that player at the time and place set to play the match. The winner reports the scores in the system after the match is played.</li>
            <li style="margin-top: 0px; margin-bottom: 0px;"><b>Report match</b>  – Reporting the match enables players to simply insert a match result for a particular day and time played during the week with another player from the ladder. If you already know someone on the ladder, you can coordinate with them without a proposal at all! Just make sure the winner inserts your match score into the system to get ladder points.</li>
        </ul>
    </mj-text>

    <mj-text>That's pretty much it! Once you start playing matches, you can begin earning points, and hopefully, you'll earn enough points to compete in the Final Tournament for a trophy and a prize!</mj-text>

    ${h2('Rival Tennis Ladder Resources')}

    <mj-text>In case you have any questions, here are some resources for additional guidance:</mj-text>

<mj-text>
<ul style="margin: 0 !important; padding-top: 0px; padding-bottom: 0px;">
    <li style="margin: 0 !important;">Who can I contact about questions: ${
        config.isRaleigh
            ? `<a href="mailto:Kenneth.Glanville@raleighnc.gov">Kenneth.Glanville@raleighnc.gov</a>`
            : `<a href="mailto:info@tennis-ladder.com">info@tennis-ladder.com</a>`
    }</li>
    <li style="margin: 0 !important;"><a href="${TL_URL}/rules">What are the rules</a></li>
    <li style="margin: 0 !important;"><a href="${TL_URL}/pricing">What is the pricing</a></li>
    <li style="margin: 0 !important;"><a href="${TL_URL}/scoring">How does scoring work</a></li>
    <li style="margin: 0 !important;"><a href="${TL_URL}/tlr">What is TLR</a></li>
</ul>
</mj-text>

${thankYou({ config })}
${signature({ config })}`,
        { config }
    );
};
