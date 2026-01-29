import type { Config } from '../types';
import { normal, h2, signature } from './normal';
import dayjs from '@rival/dayjs';
import { formatPhone } from '../services/users/helpers';

type Params = {
    config: Config;
    seasonEndDate: string;
    finalSpot: number;
    opponentName: string;
    opponentEmail: string;
    opponentPhone: string;
    fakeCurrentDate: string;
    roundsTotal: number;
};

export default ({
    config,
    seasonEndDate,
    finalSpot,
    opponentName,
    opponentEmail,
    opponentPhone,
    fakeCurrentDate,
    roundsTotal,
}: Params) => {
    const isRoundOf16 = finalSpot > 7;
    const isQuarterFinal = finalSpot <= 7 && finalSpot > 3;
    const isSemiFinal = finalSpot <= 3 && finalSpot > 1;

    const currentDate = fakeCurrentDate ? dayjs.tz(fakeCurrentDate) : dayjs.tz();
    const tournamentMonday = dayjs.tz(seasonEndDate).add(12, 'hour').isoWeekday(1);
    const stage = isRoundOf16 ? 'Round of 16' : isQuarterFinal ? 'Quarterfinal' : isSemiFinal ? 'Semifinal' : 'Final';

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

<mj-text>We noticed you haven't scheduled your ${stage} match against <b>${opponentName}</b> yet! Have you reached out to them?</mj-text>

<mj-text>Here is their information again if you need to contact them:</mj-text>

<mj-text>
    <b>Email:</b> <a href="mailto:${opponentEmail}">${opponentEmail}</a><br>
    <b>Phone:</b> <a href="sms:${opponentPhone}">${formatPhone(opponentPhone)}</a>
</mj-text>

${h2('Please Schedule and Play Before the Deadline')}
<mj-text>The deadline for finishing your match with ${opponentName} is <b>${formattedDate}</b>. Can you schedule your match and insert these details into the tournament bracket using the <b>Schedule</b> button? Doing so helps us ensure the match is set and ready!</mj-text>

${
    config.isRaleigh
        ? `<mj-text>If you require a court reservation, you can request a free court by filling out the <a href="https://docs.google.com/forms/d/e/1FAIpQLSe6y12_k4l5Xjg5D4oscza7a8X0jlPXyHOv6oJYmT-XQ6CC_Q/viewform?embedded=true">Tennis Court Reservation Form</a> at least 24 hours before your match. Make sure to put "<b>ladder tournament match</b>" in the Comments/Questions section to avoid payment. Your court assignment location will depend on availability.</mj-text>`
        : ''
}

${signature({ config })}
`,
        { config }
    );
};
