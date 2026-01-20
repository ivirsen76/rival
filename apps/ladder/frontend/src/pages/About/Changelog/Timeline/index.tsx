import PropTypes from 'prop-types';
import classnames from 'classnames';
import style from './style.module.scss';

const Timeline = props => {
    const isRoundOf16 = props.totalPlayers >= 50;
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W', 'T', 'F', 'S', 'S'];

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
                {days.map((day, index) => (
                    <div key={index} className={classnames(style.day, { [style.weekend]: day === 'S' })}>
                        {day}
                    </div>
                ))}
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
    totalPlayers: PropTypes.number,
};

export default Timeline;
