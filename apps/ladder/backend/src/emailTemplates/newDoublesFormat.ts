import type { Config } from '../types';
import { normal, h2, signature } from './normal';

export default (config: Config, { isPaidSeason, previewText }) => {
    return normal(
        `
  ${h2('Hello, #firstName#!', 'padding-top="10px"')}
  <mj-text>As always, thank you for supporting and participating in Rival Tennis Ladder in ${
      config.city
  }. Truly, it's because of people like you that we're able to build this amazing tennis community.</mj-text>  
  <mj-text>Each season, we are collecting your feedback, enhancing the application, and implementing new features to make Rival Tennis Ladder one of the best tennis experiences in the world. With that in mind, we are <b>making some changes to our Doubles format</b> for the 2025 Summer Season.</mj-text> 

  ${h2('Changing the Rival Doubles Format')}

  <mj-text>Originally, when we created Doubles for Rival Tennis Ladder, we adopted a format really similar to our Singles ladders, where you would move up or down the ladder individually based on your participation and performance. In this format, we allowed players to pair up with anyone for Doubles sessions, and we held a round-robin style of tournament at the end of the session.</mj-text>
  <mj-text>However, after running this style of flexible Doubles for a couple of years, we found that it had some significant flaws, including:</mj-text>

  <mj-text>
    <ul style="margin: 0 !important; padding-top: 0px; padding-bottom: 0px;">
        <li style="margin-bottom: 10px;">Participants would be <b>unwilling to join proposals with unknown players</b>.</li>
        <li style="margin-bottom: 10px;">Many <b>proposals would stall at 3 players</b>, unable to get the last player to accept.</li>
        <li style="margin-bottom: 10px;">Once a match was established, <b>participants found scheduling challenging</b>.</li>
        <li style="margin: 0 !important;">Most seasons <b>didn't generate substantial participation</b>.</li>
    </ul>
  </mj-text>

  <mj-text>For these reasons, we are changing the Doubles format for the upcoming season.</mj-text>

  ${h2('Introducing Teams into Rival Doubles')}

  <mj-text>In Doubles ladders this season, you will be able to team up with your friends to create your own Doubles team! This new format will bring with it the following changes:</mj-text>

  <mj-text>
    <ul style="margin: 0 !important; padding-top: 0px; padding-bottom: 0px;">
        <li style="margin-bottom: 10px;"><b>Team Captains:</b> Each team will have a designated Team Captain who creates and manages the team. Team Captains will accept and send proposals, coordinate with other Team Captains on scheduling, and decide who is playing in each match.</li>
        <li style="margin-bottom: 10px;"><b>Players per team:</b> New Doubles teams will be able to have up to 3 players. If you just want to team up with your best friend, no problem! We also allow teams of 2 players.</li>
        <li style="margin-bottom: 10px;"><b>Regular season:</b> The points, rankings, and other nuances that apply to the Singles ladder will also apply to this new Doubles format. The more your team participates, the more points you can earn to climb the ladder!</li>
        <li style="margin: 0 !important;"><b>Final Tournament:</b> If your team gets enough points by the end of the season, you will qualify for the Final Tournament. The Doubles Final Tournament will be a single-elimination style tournament where the top teams will compete for overall victory!</li>
    </ul>
  </mj-text>

  ${
      isPaidSeason
          ? `${h2('Join Doubles Next Season for Free')}
  <mj-text>Since we are changing to this new Doubles system, <b>we are offering Doubles for free</b> in the upcoming season. Join us! As you try it out, please let us know if you like this new Doubles experience. Remember, your feedback is essential to improving each step of the process and the ladder along the way.</mj-text>`
          : h2('Thank You for Joining!')
  }
  
  <mj-text>Thanks again for all your help in growing this community! We really appreciate all your support and participation each season.</mj-text>

  ${signature({ config })}
`,
        { config, previewText }
    );
};
