import dayjs from '@/utils/dayjs';

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export default date => {
    const diff = dayjs.tz().diff(dayjs.tz(date), 'millisecond');

    const seconds = Math.round(Math.abs(diff) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const weeks = Math.round(days / 7);
    const months = Math.round(days / 30);
    const years = Math.round(months / 12);

    if (seconds < 60) {
        return 'just now';
    }

    if (minutes < 60) {
        return rtf.format(-minutes, 'minute');
    }

    if (hours < 24) {
        return rtf.format(-hours, 'hour');
    }

    if (days < 7) {
        return rtf.format(-days, 'day');
    }

    if (weeks < 4) {
        return rtf.format(-weeks, 'week');
    }

    if (months < 12) {
        return rtf.format(-months, 'month');
    }

    return rtf.format(-years, 'year');
};
