import type { Config, Image } from '../types';
import { normal, h2 } from './normal';
import dayjs from '@rival/dayjs';
import { formatPhone } from '../services/users/helpers';

type Params = {
    config: Config;
    isFinal: boolean;
    opponentTeam: string;
    opponentName: string;
    opponentEmail: string;
    opponentPhone: string;
    img: Image;
    previewText: string;
};

export default ({
    config,
    isFinal,
    opponentTeam,
    opponentName,
    opponentEmail,
    opponentPhone,
    img,
    previewText = '',
}: Params) => {
    const weekEnd = dayjs.tz().isoWeekday(7).hour(12).format('dddd, MMMM D');
    const sundayInTwoWeeks = dayjs.tz().add(1, 'week').isoWeekday(7).hour(12).format('dddd, MMMM D');

    return normal(
        `
${h2(`${isFinal ? "Let's go" : 'Hello'}, #firstName#!`, 'padding-top="10px"')}

<mj-text>Your ${
            isFinal ? 'Final Battle' : 'Battle this week'
        } will be against the <b>${opponentTeam}</b> team!</mj-text>

<mj-image src="${img.src}" width="${img.width}px" height="${img.height}px" alt="${previewText}" />

<mj-text>You will be facing <b>${opponentName}</b>. Here are their details:</mj-text>

<mj-text>
    <b>Email:</b> <a href="mailto:${opponentEmail}">${opponentEmail}</a><br>
    <b>Phone:</b> <a href="sms:${opponentPhone}">${formatPhone(opponentPhone)}</a>
</mj-text>

${h2('1. Schedule', 'padding-top="20px" padding-bottom="0px"')}
<mj-text>Once you decide a place and time with ${opponentName}, please insert these details into the Battle info using the <b>Schedule</b> button.</mj-text>

${h2('2. Play', 'padding-top="20px" padding-bottom="0px"')}
${
    isFinal
        ? `<mj-text>You should complete your Teams match by the <b>end of the day on ${sundayInTwoWeeks}</b>.</mj-text>`
        : `<mj-text>You should complete your Teams match by the <b>end of the day on ${weekEnd}</b>. If both players cannot accommodate one another's schedules in the first week, an additional week will be provided.</mj-text>`
}

${h2('3. Report', 'padding-top="20px" padding-bottom="0px"')}
<mj-text>Once finished, please insert the match results into the Battle info.</mj-text>`,
        { config }
    );
};
