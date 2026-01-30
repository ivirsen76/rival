import { Field, useFormikContext } from '../formik';
import TimePicker from '../formik/TimePicker';
import Modal from '../Modal';
import WeatherAtTime from '../WeatherForecast/WeatherAtTime';
import WeatherForecast from '../WeatherForecast';
import style from './style.module.scss';

type DateTimeWithWeatherProps = {
    minDate: object;
    maxDate: object;
};

const DateTimeWithWeather = (props: DateTimeWithWeatherProps) => {
    const { minDate, maxDate } = props;
    const { values } = useFormikContext();

    return (
        <div className="d-flex align-items-start gap-2">
            <Field name="playedAt" label="Start date" component={TimePicker} options={{ minDate, maxDate }} />
            {values.playedAt ? (
                <Modal
                    title="Weather Forecast"
                    size="xl"
                    dialogClassName={style.weatherModal}
                    renderTrigger={({ show }) => (
                        <div onClick={show} className={style.weatherWrapper}>
                            <WeatherAtTime time={values.playedAt} />
                        </div>
                    )}
                    renderBody={() => <WeatherForecast />}
                />
            ) : null}
        </div>
    );
};

export default DateTimeWithWeather;
