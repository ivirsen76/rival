import PropTypes from 'prop-types';
import Modal from '@/components/Modal';
import dayjs from '@/utils/dayjs';
import useCurrentWeather from '@/components/WeatherForecast/useCurrentWeather';
import WeatherForecast from '@/components/WeatherForecast';
import WeatherAtTime from '@/components/WeatherForecast/WeatherAtTime';
import style from './style.module.scss';

const Summary = (props) => {
    const { tournament, showWeather } = props;
    const { isStarted, isOver, isBreak, isFinalTournament } = tournament;
    const currentWeather = useCurrentWeather();

    const isLive = isStarted && !isOver;

    let currentWeek;
    let totalWeeks;
    if (!isOver) {
        currentWeek = Math.ceil(dayjs.tz().diff(dayjs.tz(tournament.startDate), 'week', true));
        totalWeeks = Math.ceil(
            dayjs.tz(tournament.endDate).subtract(12, 'hour').diff(dayjs.tz(tournament.startDate), 'week', true)
        );
    }

    const format = (date) => dayjs.tz(date).format('MMM D');
    const finalTournamentDates = `Starting ${format(dayjs.tz(tournament.endDate).isoWeekday(1))}`;

    return (
        <div className="clearfix">
            {(isLive || isBreak) && currentWeather && showWeather && (
                <Modal
                    title="Weather Forecast"
                    dialogClassName={style.weatherModal}
                    renderTrigger={({ show }) => (
                        <div className={style.weather} onClick={show}>
                            <WeatherAtTime />
                        </div>
                    )}
                    renderBody={() => <WeatherForecast />}
                    hasForm={false}
                />
            )}

            <div>
                {(() => {
                    if (isOver) {
                        return (
                            <span>
                                <strong>The season has ended.</strong>
                                {tournament.seasonCloseReason && (
                                    <div className="mb-1">({tournament.seasonCloseReason})</div>
                                )}
                            </span>
                        );
                    }
                    if (!isStarted) {
                        return <strong>The season is not started yet</strong>;
                    }

                    return (
                        <span>
                            <strong>Ongoing season:</strong>{' '}
                            <span data-playwright-placeholder="middle" className={style.summaryValue}>
                                Week {currentWeek} of {totalWeeks}
                            </span>
                        </span>
                    );
                })()}
            </div>
            <div>
                <strong>Dates:</strong>{' '}
                <span data-playwright-placeholder="middle" className={style.summaryValue}>
                    {format(tournament.startDate)} - {format(dayjs.tz(tournament.endDate).subtract(1, 'minute'))}
                </span>
            </div>
            {(!isOver || isFinalTournament) && (
                <div>
                    <strong>Tournament:</strong>{' '}
                    <span data-playwright-placeholder="middle" className={style.summaryValue}>
                        {finalTournamentDates}
                    </span>
                </div>
            )}
        </div>
    );
};

Summary.propTypes = {
    tournament: PropTypes.object,
    showWeather: PropTypes.bool,
};

Summary.defaultProps = {};

export default Summary;
