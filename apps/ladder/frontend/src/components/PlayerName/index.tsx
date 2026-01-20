import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import formatElo from '@rival/ladder.backend/src/utils/formatElo';
import _omit from 'lodash/omit';
import PlayerAvatar from '@/components/PlayerAvatar';
import Tooltip from '@/components/Tooltip';
import classnames from 'classnames';
import style from './style.module.scss';

const DoublesName = props => {
    const { player1, player2, rank1, isLink, highlight, showContactBadge } = props;
    const captain = player1.partners[0];

    const partners = (player2 ? [player1, player2] : player1.partners).map(item => _omit(item, ['partners']));

    if (!isLink) {
        return (
            <span>
                <span className={highlight ? 'fw-semibold' : ''}>{captain.teamName}</span>
                {rank1 && rank1 > 0 ? <span className={style.badge}>{rank1}</span> : null}
            </span>
        );
    }

    return (
        <Tooltip
            interactive
            trigger="click"
            theme="light"
            content={
                <div className="p-1 d-grid gap-1">
                    {partners.map((partner, index) => (
                        <div key={partner.id} className="d-flex gap-2 align-items-center">
                            <PlayerAvatar player1={partner} />
                            <div className="text-nowrap">
                                <PlayerName player1={partner} isLink />
                            </div>
                            {showContactBadge && index === 0 && <div className="badge badge-secondary">contact</div>}
                        </div>
                    ))}
                </div>
            }
        >
            <span>
                <a className={highlight ? 'fw-semibold' : ''} href="" onClick={e => e.preventDefault()}>
                    {captain.teamName}
                </a>
                {rank1 && rank1 > 0 ? <span className={style.badge}>{rank1}</span> : null}
            </span>
        </Tooltip>
    );
};

DoublesName.propTypes = {
    player1: PropTypes.object,
    player2: PropTypes.object,
    rank1: PropTypes.number,
    isLink: PropTypes.bool,
    highlight: PropTypes.bool,
    showContactBadge: PropTypes.bool,
};

const PlayerName = props => {
    if (props.showTeamName && props.player1.partners?.length > 1) {
        return <DoublesName {...props} />;
    }

    const adjustedProps = { ...props };
    if (!props.showTeamName && !props.player2 && !props.ignorePartners && props.player1.partners) {
        props.player1.partners.forEach((item, index) => {
            adjustedProps[`player${index + 1}`] = item;
            adjustedProps[`rank${index + 1}`] = props.rank1;
        });
    }
    const { player1, player2, player3, player4, className, isLink, isShort, rank1, rank2, elo1 } = adjustedProps;

    const getInitial = str => str.slice(0, 1).toUpperCase() + '.';

    const getName = (player, isInitial) => {
        if (!player.firstName && !player.lastName) {
            return <span className={style.open}>open</span>;
        }

        let name =
            !player.firstName || !player.lastName ? (
                `${player.firstName}${player.lastName}`
            ) : isInitial || player.deletedAt ? (
                <span className="text-nowrap">
                    {player.firstName} {getInitial(player.lastName)}
                </span>
            ) : (
                `${player.firstName} ${player.lastName}`
            );

        const actualSlug = player.userSlug || player.slug;
        if (isLink && actualSlug) {
            name = (
                <Link className={props.highlight ? 'fw-semibold' : ''} to={`/player/${actualSlug}`}>
                    {name}
                </Link>
            );
        }

        return name;
    };

    let result;
    if (player2) {
        result = [player1, player2, player3, player4].filter(Boolean).map((player, index) => (
            <span key={`${player.id}-${index}`}>
                {index > 0 && <span className={style.separator}> / </span>}
                {getName(player, true)}
            </span>
        ));
    } else {
        result = getName(player1, isShort);
    }

    let rank;
    if (player2) {
        if (rank1 && rank2) {
            rank = Math.floor((rank1 + rank2) / 2);
        }
    } else if (rank1) {
        rank = rank1;
    }

    result = (
        <span className={classnames(style.name, className)}>
            {result}
            {rank && rank > 0 ? <span className={style.badge}>{rank}</span> : null}
            {elo1 ? (
                <span title="TLR" className={classnames('badge badge-secondary', style.elo, !rank && style.noRank)}>
                    {formatElo(elo1)}
                </span>
            ) : null}
        </span>
    );

    return result;
};

PlayerName.propTypes = {
    player1: PropTypes.object,
    player2: PropTypes.object,
    player3: PropTypes.object,
    player4: PropTypes.object,
    isLink: PropTypes.bool,
    highlight: PropTypes.bool,
    className: PropTypes.string,
    rank1: PropTypes.number,
    rank2: PropTypes.number,
    elo1: PropTypes.number,
    ignorePartners: PropTypes.bool,
    showTeamName: PropTypes.bool,
    showContactBadge: PropTypes.bool,
};
PlayerName.defaultProps = {
    showTeamName: true,
    highlight: true,
};

export default PlayerName;
