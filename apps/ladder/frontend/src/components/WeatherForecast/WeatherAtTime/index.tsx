import Icon from '../Icon';
import useSettings from '@/utils/useSettings';
import dayjs from '@/utils/dayjs';
import style from './style.module.scss';

type WeatherAtTimeProps = {
    time?: string;
};

const WeatherAtTime = (props: WeatherAtTimeProps) => {
    const { settings } = useSettings();
    const hours = settings.settings.weather?.hours || [];
    const time = dayjs.tz(props.time);
    const timeAsString = time.format('YYYY-MM-DD HH:mm:ss');
    const index = hours.findIndex((item) => item.datetime > timeAsString);

    if (index === -1) {
        return null;
    }

    let timeWeather = hours[index];
    let temp = timeWeather.temp;

    if (index > 0) {
        const prevHourWeather = hours[index - 1];
        const part = time.diff(dayjs.tz(prevHourWeather.datetime), 'hour', true);
        const prevTemp = prevHourWeather.temp;

        temp = prevTemp + (temp - prevTemp) * part;
        if (part < 0.5) {
            timeWeather = prevHourWeather;
        }
    }

    return (
        <div className={style.weather}>
            <Icon type={timeWeather.condition} dayPart={timeWeather.dayPart} />
            <div className={style.temp} data-weather={timeWeather.condition}>
                {Math.round(temp)}&deg;
            </div>
        </div>
    );
};

export default WeatherAtTime;
