import PropTypes from 'prop-types';
import ClockIcon from './Clock.svg?react';
import Avatar from '@/components/avataaars';
import UserIcon from '@/assets/user.svg?react';
import dayjs from '@/utils/dayjs';
import formatElo from '@rival/ladder.backend/src/utils/formatElo';
import style from './style.module.scss';

const minutesToTime = (minutes) => {
    const hours = `${Math.floor(minutes / 60)}`.padStart(2, '0');
    minutes = `${minutes % 60}`.padStart(2, '0');

    return `${hours}:${minutes}`;
};

const Header = (props) => {
    const { match, challenger, challengerName, acceptor, acceptorName } = props;
    const { stat } = match;

    const score = match.score.split(' ');

    return (
        <div className={style.wrapper}>
            <div className={style.challenger}>
                {challenger.avatarObject ? <Avatar {...JSON.parse(challenger.avatarObject)} /> : <UserIcon />}
                <div>
                    {challengerName}
                    <br />
                    <span className="fw-normal">TLR:</span> {formatElo(match.challengerElo - match.challengerEloChange)}
                </div>
            </div>
            <div>
                <div className={style.title}>
                    <div className={style.date}>{dayjs.tz(match.playedAt).format('MMM D, YYYY')}</div>
                    <div className={style.score}>
                        {score.map((item, index) => (
                            <span key={index}>{item}</span>
                        ))}
                    </div>
                    <div className={style.clock}>
                        <div className="me-1">
                            <ClockIcon />
                        </div>
                        <div>{minutesToTime(stat.timeTotal)}</div>
                    </div>
                </div>
            </div>
            <div className={style.acceptor}>
                <div>
                    {acceptorName}
                    <br />
                    <span className="fw-normal">TLR:</span> {formatElo(match.acceptorElo - match.acceptorEloChange)}
                </div>
                {acceptor.avatarObject ? <Avatar {...JSON.parse(acceptor.avatarObject)} /> : <UserIcon />}
            </div>
        </div>
    );
};

Header.propTypes = {
    match: PropTypes.object,
    challenger: PropTypes.object,
    acceptor: PropTypes.object,
    challengerName: PropTypes.node,
    acceptorName: PropTypes.node,
};

export default Header;
