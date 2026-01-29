import type { Config, Image } from '../types';
import { normal, h2, signature, getImageUrl } from './normal';

type Params = {
    config: Config;
    bracketImage: Image;
    seasonName: string;
    levelName: string;
    topPlayers: number;
    hasBracketContest: boolean;
};

export default ({ config, bracketImage, seasonName, levelName, topPlayers, hasBracketContest }: Params) => {
    const bracketContent = hasBracketContest
        ? `
    ${h2('Rival Bracket Battle!')}

    <mj-text>You can now participate in the Rival Bracket Battle! You can fill out your own tournament bracket and pick who you think will win each match and take home the title of Champion. You will earn points by choosing the correct winner of each matchup and how many sets it will take.</mj-text>

    <mj-text>Using our sophisticated tennis technology, <b>BracketBot</b> is also competing! BracketBot will make its picks for the tournament and attempt to beat everyone at creating the perfect bracket. <b>Can you beat the BracketBot?</b></mj-text>

    <mj-text>Players who accumulate the most points at the end of the tournament will win the Rival Bracket Battle, earning them "<b>The Oracle</b>" badge and <b>$5</b> of credit. That's if they can beat the BracketBot!</mj-text>

    <mj-image src="${getImageUrl(
        __dirname + '/images/oracleBadge.png'
    )}" alt="The Oracle Badge" width="112px" height="auto" />

    <mj-text>To participate in the Rival Bracket Battle, you have to <b>submit your bracket by 6 PM today</b>. Otherwise, you let BracketBot win (don't let BracketBot win).</mj-text>`
        : '';

    return normal(
        `
    ${h2('Hello, #firstName#!', 'padding-top="10px"')}
  <mj-text>With the ${seasonName} Season coming to a close, today marks the start of the Final Tournament for the ${levelName} ladder! The Top ${topPlayers} players will face off over the next two weeks. Here is the tournament bracket and the initial matchups:</mj-text>
  <mj-image src="${bracketImage.src}" width="${bracketImage.width}px" alt="Tournament bracket" />

    ${bracketContent}

    ${h2('Thanks for Playing')}
    <mj-text>As always, thank you for participating in Rival Tennis Ladder. We hope everyone had a great season, and we wish all the tournament players the best of luck in their matchups. Don't forget to fill out your brackets, and go ahead and sign up for next season!</mj-text>

    ${signature({ config: { ...config, isRaleigh: 0 } })}`,
        { config }
    );
};
