import AvatarComponent from '@/components/avataaars';
import UserIcon from '@/assets/user.svg?react';
import style from './style.module.scss';

const Avatar = props => {
    const search = window.location.search;

    if (!search) {
        return (
            <div id="tl-image-wrapper" className={style.wrapper}>
                <UserIcon />
            </div>
        );
    }

    const searchParams = new URLSearchParams(search);
    const obj = {};
    for (const [key, value] of searchParams.entries()) {
        obj[key] = value;
    }

    return (
        <div id="tl-image-wrapper" className={style.wrapper}>
            <AvatarComponent {...obj} />
        </div>
    );
};

export default Avatar;
