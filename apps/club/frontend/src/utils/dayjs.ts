import dayjs from '@rival/club.backend/src/utils/dayjs';

const TIMEZONE = process.env.TL_TIMEZONE || window.TL_TIMEZONE || import.meta.env.VITE_TIMEZONE;
if (!TIMEZONE) {
    throw new Error('Timezone is not set in env variables');
}
dayjs.tz.setDefault(TIMEZONE);

export default dayjs;
export * from '@rival/club.backend/src/utils/dayjs';
