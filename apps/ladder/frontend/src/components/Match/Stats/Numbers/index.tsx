import PropTypes from 'prop-types';
import classnames from 'classnames';
import { defaultColors } from '../config';
import style from './style.module.scss';

const Numbers = props => {
    const { match, challengerName, acceptorName } = props;
    const { stat } = match;

    return (
        <div className={style.wrapper}>
            <div />
            <div className={style.title + ' ' + style.left}>Aces</div>
            <div className={style.title}>
                Double
                <br />
                Faults
            </div>
            <div className={style.title}>
                Break
                <br />
                Points
            </div>
            <div className={style.title}>
                Serve
                <br />
                Points Won
            </div>
            <div className={style.title + ' ' + style.right}>
                Total
                <br />
                Points Won
            </div>

            <div className={style.name} style={{ color: defaultColors[0] }}>
                {challengerName}
            </div>
            <div
                className={classnames(style.number, {
                    [style.better]: stat.challenger.aces > stat.acceptor.aces,
                })}
            >
                {stat.challenger.aces}
            </div>
            <div
                className={classnames(style.number, {
                    [style.better]: stat.challenger.serveUnforced < stat.acceptor.serveUnforced,
                })}
            >
                {stat.challenger.serveUnforced}
            </div>
            <div
                className={classnames(style.number, {
                    [style.better]: stat.challenger.breakpointsWon > stat.acceptor.breakpointsWon,
                })}
            >
                {stat.challenger.breakpointsWon}/{stat.challenger.breakpointsTotal}
            </div>
            <div
                className={classnames(style.number, {
                    [style.better]: stat.challenger.serveWon > stat.acceptor.serveWon,
                })}
            >
                {stat.challenger.serveWon}/{stat.challenger.serveTotal}
            </div>
            <div
                className={classnames(style.number, {
                    [style.better]: stat.challenger.pointsWon > stat.acceptor.pointsWon,
                })}
                data-stats-challenger-total-points
            >
                {stat.challenger.pointsWon}/{stat.pointsTotal}
            </div>

            <div className={style.name} style={{ color: defaultColors[1] }}>
                {acceptorName}
            </div>
            <div
                className={classnames(style.number, {
                    [style.better]: stat.challenger.aces < stat.acceptor.aces,
                })}
            >
                {stat.acceptor.aces}
            </div>
            <div
                className={classnames(style.number, {
                    [style.better]: stat.challenger.serveUnforced > stat.acceptor.serveUnforced,
                })}
            >
                {stat.acceptor.serveUnforced}
            </div>
            <div
                className={classnames(style.number, {
                    [style.better]: stat.challenger.breakpointsWon < stat.acceptor.breakpointsWon,
                })}
            >
                {stat.acceptor.breakpointsWon}/{stat.acceptor.breakpointsTotal}
            </div>
            <div
                className={classnames(style.number, {
                    [style.better]: stat.challenger.serveWon < stat.acceptor.serveWon,
                })}
            >
                {stat.acceptor.serveWon}/{stat.acceptor.serveTotal}
            </div>
            <div
                className={classnames(style.number, {
                    [style.better]: stat.challenger.pointsWon < stat.acceptor.pointsWon,
                })}
                data-stats-acceptor-total-points
            >
                {stat.acceptor.pointsWon}/{stat.pointsTotal}
            </div>
        </div>
    );
};

Numbers.propTypes = {
    match: PropTypes.object,
    challengerName: PropTypes.node,
    acceptorName: PropTypes.node,
};

export default Numbers;
