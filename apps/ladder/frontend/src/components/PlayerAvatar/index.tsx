import UserIcon from '@/assets/user.svg?react';
import PossibleUserIcon from '@/assets/possibleUser.svg?react';
import classnames from 'classnames';
import Avatar from '@/components/avataaars';
import style from './style.module.scss';

type SingleAvatarProps = {
    player: object;
    highQuality: boolean;
    isWinner: boolean;
};

const SingleAvatar = ({ player, highQuality, isWinner, ...props }: SingleAvatarProps) => {
    if (!player) {
        return <UserIcon {...props} />;
    }
    if (!player.id) {
        return <PossibleUserIcon {...props} />;
    }

    if (highQuality) {
        if (!player.avatarObject) {
            return <UserIcon {...props} />;
        }

        return <Avatar {...JSON.parse(player.avatarObject)} isWinner={isWinner} {...props} />;
    }

    if (!player.avatar) {
        return <UserIcon {...props} />;
    }

    return <img src={player.avatar} alt="" {...props} />;
};

type PlayerAvatarProps = {
    className: string;
    player1: object;
    player2: object;
    player3: object;
    player4: object;
    player5: object;
    isWinner: boolean;
    highQuality: boolean;
    showTeamAvatar: boolean;
};

const PlayerAvatar = (props: PlayerAvatarProps) => {
    const isTeamAvatar = props.player1.partners && (props.showTeamAvatar || !props.player2);

    const adjustedProps = { ...props };
    if (isTeamAvatar) {
        props.player1.partners.forEach((item, index) => {
            adjustedProps[`player${index + 1}`] = item;
        });
    }
    const { className, player1, player2, player3, player4, player5 } = adjustedProps;
    const totalAvatars = [player1, player2, player3, player4, player5].filter(Boolean).length;

    const avatar = (() => {
        return [player1, player2, player3, player4, player5]
            .filter(Boolean)
            .map((player, index, arr) => (
                <SingleAvatar
                    key={player.id + ' ' + index}
                    player={player}
                    highQuality={props.highQuality}
                    isWinner={props.isWinner}
                    {...(arr.length > 1 ? { style: { position: 'relative', zIndex: 4 - index } } : {})}
                />
            ));
    })();

    return (
        <div
            className={classnames(
                style.avatarWrapper,
                className,
                isTeamAvatar && style.teamAvatar,
                totalAvatars > 1 && style.multiple
            )}
        >
            {avatar}
        </div>
    );
};

PlayerAvatar.defaultProps = {
    showTeamAvatar: true,
};

export default PlayerAvatar;
