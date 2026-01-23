import type { Config } from '../types';
import { normal, h2, signature } from './normal';
import { getSeasonName, getShortSeasonName } from '../services/seasons/helpers';

export default (config: Config, { prevSeason, currentSeason }) => {
    const prevSeasonName = getSeasonName(prevSeason);
    const currentShortSeasonName = getShortSeasonName(currentSeason);

    return normal(
        `
    ${h2('Hi, #firstName#!', 'padding-top="10px"')}
    <mj-text>My name is Andrew Cole, and I'm the Co-Founder of Rival Tennis Ladder.</mj-text>
    <mj-text>At Rival Tennis Ladder, we're committed to ensuring that you have the best experience possible engaging with our community and using our app.</mj-text>
    <mj-text>We noticed that while you played in the ${prevSeasonName} season, you didn't sign back up for our ${currentShortSeasonName} session, and we were wondering why.</mj-text>
    <mj-text>Is there anything we can do to improve and encourage you to rejoin us for this season? Do you have feedback for us to make the platform better?</mj-text>
    <mj-text>I read and respond to every email sent to Rival Tennis Ladder personally, and I strive each day to understand our community better and provide the best experience possible.</mj-text>
    <mj-text>If you have a moment, could you let us know how we could improve?</mj-text>
    <mj-text>Thanks, #firstName#, for your participation and feedback! We hope to hear from you!</mj-text>
    ${signature({ config })}`,
        { config }
    );
};
