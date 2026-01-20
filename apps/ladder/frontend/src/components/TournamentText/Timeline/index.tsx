import PropTypes from 'prop-types';
import classnames from 'classnames';
import dayjs from '@/utils/dayjs';
import style from './style.module.scss';

const Timeline = (props) => {
    const { tournament } = props;
    const startDate = dayjs(tournament.endDate).add(12, 'hour');

    const isRoundOf16 = tournament.playersBeforeDeadline >= 50;

    return (
        <div className={style.schedule}>
            <div className={classnames(style.stages, isRoundOf16 && style.hasRoundOf16)}>
                <div className={style.stage + ' ' + style.roundOf16}>
                    <div>Round of 16</div>
                </div>
                <div className={style.stage + ' ' + style.quarterfinal}>
                    <div>Quarterfinals</div>
                </div>
                <div className={style.stage + ' ' + style.semifinal}>
                    <div>{isRoundOf16 ? 'SF' : 'Semifinals'}</div>
                </div>
                <div className={style.stage + ' ' + style.final}>
                    <div>{isRoundOf16 ? 'F' : 'Final'}</div>
                </div>
            </div>
            <div className={style.timeline}>
                {new Array(14).fill(0).map((_, index) => {
                    const date = startDate.add(index, 'day');
                    const day = date.format('D');
                    const isWeekend = date.isoWeekday() >= 6;

                    return (
                        <div key={day} className={classnames(style.day, { [style.weekend]: isWeekend })}>
                            {day}
                        </div>
                    );
                })}
            </div>
            <div className={style.weeks}>
                <div className={style.week}>
                    <div className={style.bracket} />
                    <div>Week 1</div>
                </div>
                <div className={style.week}>
                    <div className={style.bracket} />
                    <div>Week 2</div>
                </div>
            </div>
        </div>
    );
};

Timeline.propTypes = {
    tournament: PropTypes.object,
};

export default Timeline;
