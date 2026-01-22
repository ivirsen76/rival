import Header from './Header';
import Graph from './Graph';
import Numbers from './Numbers';
import Winners from './Winners';
import PlayerName from '@/components/PlayerName';
import ScaleToFit from '@/components/ScaleToFit';
import { defaultColors } from './config';
import style from './style.module.scss';

type StatsProps = {
    match: object;
    challenger: object;
    acceptor: object;
    scaleToFit: boolean;
};

const Stats = (props: StatsProps) => {
    const { match, challenger, acceptor, scaleToFit } = props;
    const { stat } = match;

    const challengerName = (
        <PlayerName player1={challenger} isShort={(challenger.firstName + challenger.lastName).length > 16} />
    );
    const acceptorName = (
        <PlayerName player1={acceptor} isShort={(acceptor.firstName + acceptor.lastName).length > 16} />
    );

    const isExtendedStats = stat.challenger.normal + stat.acceptor.normal === 0;

    const children = (
        <div className={style.wrapper}>
            <Header
                match={match}
                challenger={challenger}
                acceptor={acceptor}
                challengerName={challengerName}
                acceptorName={acceptorName}
            />
            {isExtendedStats && (
                <div className={style.winnersWrapper}>
                    <div className={style.players}>
                        <div style={{ color: defaultColors[0] }}>{challengerName}</div>
                        <div style={{ color: defaultColors[1] }}>{acceptorName}</div>
                    </div>
                    <Winners
                        title="Winners"
                        data={[
                            { label: 'FH', nums: [stat.challenger.forehandWinners, stat.acceptor.forehandWinners] },
                            { label: 'BH', nums: [stat.challenger.backhandWinners, stat.acceptor.backhandWinners] },
                            { label: 'SRV', nums: [stat.challenger.aces, stat.acceptor.aces] },
                        ]}
                        isGrowing
                    />
                    <div className={style.divider} />
                    <Winners
                        title="Unforced Errors"
                        data={[
                            { label: 'FH', nums: [stat.challenger.forehandUnforced, stat.acceptor.forehandUnforced] },
                            { label: 'BH', nums: [stat.challenger.backhandUnforced, stat.acceptor.backhandUnforced] },
                            { label: 'SRV', nums: [stat.challenger.serveUnforced, stat.acceptor.serveUnforced] },
                        ]}
                        isGrowing={false}
                    />
                    <div className={style.divider} />
                    <Winners
                        title="Forced Errors"
                        data={[
                            { label: 'FH', nums: [stat.challenger.forehandForced, stat.acceptor.forehandForced] },
                            { label: 'BH', nums: [stat.challenger.backhandForced, stat.acceptor.backhandForced] },
                        ]}
                        isGrowing={false}
                    />
                </div>
            )}
            <div className={style.serveStat}>
                <div className={style.players}>
                    <div style={{ color: defaultColors[0] }}>{challengerName}</div>
                    <div style={{ color: defaultColors[1] }}>{acceptorName}</div>
                </div>
                <div>
                    <div className={style.serveTitle}>1st serve in</div>
                    <Graph
                        list={[
                            { percent: stat.challenger.firstServeInPercent },
                            { percent: stat.acceptor.firstServeInPercent },
                        ]}
                    />
                </div>
                <div className={style.divider} />
                <div>
                    <div className={style.serveTitle}>1st serve won</div>
                    <Graph
                        list={[
                            { percent: stat.challenger.firstServeWonPercent },
                            { percent: stat.acceptor.firstServeWonPercent },
                        ]}
                    />
                </div>
                <div className={style.divider} />
                <div>
                    <div className={style.serveTitle}>2nd serve won</div>
                    <Graph
                        list={[
                            { percent: stat.challenger.secondServeWonPercent },
                            { percent: stat.acceptor.secondServeWonPercent },
                        ]}
                    />
                </div>
            </div>
            <Numbers match={match} challengerName={challengerName} acceptorName={acceptorName} />
        </div>
    );

    return scaleToFit ? <ScaleToFit width={1098}>{children}</ScaleToFit> : children;
};

Stats.defaultProps = {
    scaleToFit: true,
};

export default Stats;
