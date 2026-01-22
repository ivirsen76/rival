import style from './style.module.scss';
import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerName from '@/components/PlayerName';
import UpsetMatch from '@/components/UpsetMatch';
import classnames from 'classnames';
import { formatDate } from '@/utils/dayjs';
import useBreakpoints from '@/utils/useBreakpoints';

const reverseScore = (score) =>
    score
        .split(' ')
        .map((set) => set.replace(/^(\d+)-(\d+)$/, '$2-$1'))
        .join(' ');

type InlineMatchProps = {
    challenger: object;
    acceptor: object;
    challenger2: object;
    acceptor2: object;
    match: object;
    columnClassName: string;
    extraColumn: React.ReactNode;
};

const InlineMatch = (props: InlineMatchProps) => {
    const { challenger, acceptor, challenger2, acceptor2, match, columnClassName, extraColumn } = props;
    const size = useBreakpoints();
    const isSmall = ['xs', 'sm', 'md'].includes(size);

    if (isSmall) {
        return <UpsetMatch {...props} extraData={props.extraColumn} />;
    }

    const challengerName = (
        <span className={style.player}>
            <PlayerAvatar player1={challenger} player2={challenger2} />
            <PlayerName
                player1={challenger}
                player2={challenger2}
                elo1={match.challengerElo - match.challengerEloChange}
            />
        </span>
    );
    const acceptorName = (
        <span className={style.player}>
            <PlayerAvatar player1={acceptor} player2={acceptor2} />
            <PlayerName player1={acceptor} player2={acceptor2} elo1={match.acceptorElo - match.acceptorEloChange} />
        </span>
    );

    const winner = match.challengerId === match.winner ? challengerName : acceptorName;
    const looser = match.challengerId === match.winner ? acceptorName : challengerName;

    return (
        <>
            <div className={columnClassName}>{match.playedAt ? formatDate(match.playedAt) : null}</div>
            <div className={classnames(style.player, columnClassName)}>{winner}</div>
            <div className={columnClassName}>beat</div>
            <div className={classnames(style.player, columnClassName)}>{looser}</div>
            <div className={classnames(style.score, columnClassName)}>
                {match.challengerId === match.winner ? match.score : reverseScore(match.score)}
            </div>
            {extraColumn && <div className={columnClassName}>{extraColumn}</div>}
        </>
    );
};

export default InlineMatch;
