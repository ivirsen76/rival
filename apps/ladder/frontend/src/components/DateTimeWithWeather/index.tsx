import PropTypes from 'prop-types';
import { Field, useFormikContext } from '@/components/formik';
import TimePicker from '@/components/formik/TimePicker';
import Modal from '@/components/Modal';
import WeatherAtTime from '@/components/WeatherForecast/WeatherAtTime';
import WeatherForecast from '@/components/WeatherForecast';
import style from './style.module.scss';

const DateTimeWithWeather = props => {
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

DateTimeWithWeather.propTypes = {
    minDate: PropTypes.object,
    maxDate: PropTypes.object,
};

export default DateTimeWithWeather;
