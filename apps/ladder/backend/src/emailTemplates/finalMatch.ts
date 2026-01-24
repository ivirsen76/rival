import type { Config, Image, User } from '../types';
import { normal, h2, warning, signature } from './normal';
import dayjs from '../utils/dayjs';
import { getPlayerName, getEmailLink, getPhoneLink } from '../services/users/helpers';

export type Params = {
    config: Config;
    seasonEndDate: string;
    finalSpot: number;
    opponent: User;
    seasonName: string;
    levelName: string;
    img: Image;
    showNewOpponentWarning: boolean;
    fakeCurrentDate: string;
    roundsTotal: number;
    previewText: string;
};

export default ({
    config,
    seasonEndDate,
    finalSpot,
    opponent,
    seasonName,
    levelName,
    img,
    showNewOpponentWarning,
    fakeCurrentDate,
    roundsTotal,
    previewText = '',
}: Params) => {
    const isRoundOf16 = finalSpot > 7;
    const isQuarterFinal = finalSpot <= 7 && finalSpot > 3;
    const isSemiFinal = finalSpot <= 3 && finalSpot > 1;
    const isFinal = finalSpot === 1;

    const opponentName = opponent.teamName || getPlayerName(opponent);
    const currentDate = fakeCurrentDate ? dayjs.tz(fakeCurrentDate) : dayjs.tz();
    const tournamentMonday = dayjs.tz(seasonEndDate).add(12, 'hour').isoWeekday(1);
    const stage = isRoundOf16 ? 'Round of 16' : isQuarterFinal ? 'Quarterfinal' : isSemiFinal ? 'Semifinal' : 'Final';

    const isFirstRound = (roundsTotal === 4 && isRoundOf16) || (roundsTotal === 3 && isQuarterFinal);

    const matchDate = (() => {
        if (roundsTotal === 4) {
            return isRoundOf16
                ? tournamentMonday.isoWeekday(6)
                : isQuarterFinal
                  ? tournamentMonday.add(1, 'week').isoWeekday(5)
                  : isSemiFinal
                    ? tournamentMonday.add(1, 'week').isoWeekday(6)
                    : tournamentMonday.add(1, 'week').isoWeekday(7);
        }

        return isQuarterFinal
            ? tournamentMonday.isoWeekday(6)
            : isSemiFinal
              ? tournamentMonday.add(1, 'week').isoWeekday(5)
              : tournamentMonday.add(1, 'week').isoWeekday(7);
    })();

    if (matchDate.hour(23).minute(59).diff(currentDate, 'day', true) <= 1 && process.env.NODE_ENV !== 'test') {
        return null;
    }

    const formattedDate = matchDate.format('dddd, MMMM D');

    return normal(
        `
${h2('Hello, #firstName#!', 'padding-top="10px"')}

${(() => {
    if (showNewOpponentWarning) {
        return warning(`These things happen... Your ${stage} opponent has changed!`);
    }

    if (isFirstRound || isRoundOf16) {
        return `<mj-text>Congrats on making the Final Tournament for the ${seasonName} ${levelName} ladder!</mj-text>`;
    }

    if (isQuarterFinal) {
        return `<mj-text>Your Quarterfinal opponent is ready and waiting!</mj-text>`;
    }

    if (isSemiFinal) {
        return `<mj-text>Your Semifinal opponent is ready and waiting!</mj-text>`;
    }

    return `<mj-text>Woah, you must be pretty good! You are now in the Finals!</mj-text>`;
})()}

<mj-image src="${img.src}" width="${img.width}px" height="${img.height}px" alt="${previewText}" />

<mj-text>For your ${stage} match, you will be facing <b>${opponentName}</b>. Here are their details to set up this match:</mj-text>

<mj-text>
    ${opponent.teamName ? `<b>Captain:</b> ${getPlayerName(opponent, true)}<br>` : ''}
    <b>Email:</b> ${getEmailLink(opponent)}<br>
    <b>Phone:</b> ${getPhoneLink(opponent)}
</mj-text>

${h2('1. Schedule', 'padding-top="20px" padding-bottom="0px"')}
<mj-text>Once you decide on a place and time with <b>${opponentName}</b>, please insert these details into the tournament bracket using the <b>Schedule</b> button. Doing so helps us ensure the match is set and ready!</mj-text>

${
    config.isRaleigh
        ? `<mj-text>If you require a court reservation, you can request a free court by filling out the <a href="https://docs.google.com/forms/d/e/1FAIpQLSe6y12_k4l5Xjg5D4oscza7a8X0jlPXyHOv6oJYmT-XQ6CC_Q/viewform?embedded=true">Tennis Court Reservation Form</a> at least 24 hours before your match. Make sure to put "<b>ladder tournament match</b>" in the Comments/Questions section to avoid payment. Your court assignment location will depend on availability.</mj-text>`
        : ''
}

${h2('2. Play', 'padding-top="20px" padding-bottom="0px"')}
<mj-text>You must complete your ${stage} match by the <b>end of the day on ${formattedDate}</b>${
            isRoundOf16 || isQuarterFinal
                ? `, to be eligible for the next round of the tournament.`
                : isSemiFinal
                  ? `, to be eligible for the Final round of the tournament.`
                  : '.'
        } If you have any issues scheduling your match or reaching out to your opponent, please let us know.</mj-text>

${h2('3. Report', 'padding-top="20px" padding-bottom="0px"')}
<mj-text>Once finished, please insert the match results into the Final Tournament bracket as soon as possible.${
            isFinal ? ' That way, we can start giving out trophies and gift cards immediately!' : ''
        }</mj-text>

${signature({ config })}
`,
        { config }
    );
};
