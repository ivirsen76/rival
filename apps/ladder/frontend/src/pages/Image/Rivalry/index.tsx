import AvatarComponent from '@rival/packages/components/avataaars';
import UserIcon from '@/assets/user.svg?react';
import style from './style.module.scss';

const Rivalry = (props) => {
    const searchParams = new URLSearchParams(window.location.search);
    const { avatar1, avatar2 } = JSON.parse(searchParams.get('props'));

    return (
        <div id="tl-image-wrapper" className={style.wrapper}>
            <div>{avatar1 ? <AvatarComponent {...avatar1} /> : <UserIcon />}</div>
            <div className={style.vs}>vs</div>
            <div>{avatar2 ? <AvatarComponent {...avatar2} /> : <UserIcon />}</div>
        </div>
    );
};

export default Rivalry;
