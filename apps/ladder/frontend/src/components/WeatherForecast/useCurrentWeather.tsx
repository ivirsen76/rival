import dayjs from '@/utils/dayjs';
import useSettings from '@/utils/useSettings';

export default () => {
    const { settings } = useSettings();
    const weather = settings.settings.weather?.hours || [];

    const currentTime = dayjs.tz().add(30, 'minute').minute(0).second(0).format('YYYY-MM-DD HH:mm:ss');
    return weather.find((item) => item.datetime === currentTime);
};
