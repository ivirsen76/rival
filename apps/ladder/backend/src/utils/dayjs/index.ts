import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import minMax from 'dayjs/plugin/minMax';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';

const isNode = Boolean(process.env.TL_DB_NAME);
const TIMEZONE = process.env.TL_TIMEZONE;
if (isNode && !TIMEZONE) {
    throw new Error('Timezone is not set in env variables');
}

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.extend(minMax);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isoWeek);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);
if (TIMEZONE) {
    dayjs.tz.setDefault(TIMEZONE);
}

export const formatLong = (date) => {
    const days = {
        0: 'Sun',
        1: 'Mon',
        2: 'Tue',
        3: 'Wed',
        4: 'Thu',
        5: 'Fri',
        6: 'Sat',
    };

    const localDate = dayjs.tz(date);
    const day = localDate.day();

    return days[day] + localDate.format(', MMM D, h:mm A');
};
export const formatMiddle = (date) => dayjs.tz(date).format('MMM D, h:mm A');
export const formatShort = (date) => dayjs.tz(date).format('h:mm A');
export const formatDate = (date) => dayjs.tz(date).format('MMM\xa0D, YYYY');
export const formatCustom = (date, string) => dayjs.tz(date).format(string);

export default dayjs;
