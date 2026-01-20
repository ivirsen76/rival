import { normal, h2, thankYou, signature } from './normal';
import { getSeasonName } from '../services/seasons/helpers';
import dayjs from '../utils/dayjs';

export default (config, { season }) => {
    const seasonName = getSeasonName(season);
    const seasonStartDate = dayjs.tz(season.startDate).format('MMMM D');
    const { TL_URL } = process.env;
    const { city } = config;

    return normal(
        `
    ${h2('Hey, #firstName#!', 'padding-top="10px"')}
    <mj-text>You can now sign up for the upcoming <b>${seasonName} Season</b> of Rival Tennis Ladder in ${city}.</mj-text>

    <mj-button href="${TL_URL}/register">Register Now</mj-button>
    
    <mj-text>Stay active, play competitive matches at your level, and fight for prizes this season — starting <b>${seasonStartDate}</b>.</mj-text>

    <mj-image src="#seasonImageSrc#" alt="${seasonName}" href="${TL_URL}/register" border-radius="10px" />

    ${thankYou({ config })}
    ${signature({ config })}`,
        { config }
    );
};
