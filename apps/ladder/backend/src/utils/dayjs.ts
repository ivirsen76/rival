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

export default dayjs;
