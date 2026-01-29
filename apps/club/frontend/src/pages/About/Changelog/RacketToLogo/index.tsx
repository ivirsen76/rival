import classnames from 'classnames';
import Racket from './racket.svg?react';
import Logo from '@/assets/logo.svg?react';
import style from './style.module.scss';

const RacketToLogo = (props) => {
    return (
        <div className={style.wrapper}>
            <div className={classnames(style.racket, style.top)}>
                <Racket />
            </div>
            <div className={classnames(style.racket, style.right)}>
                <Racket />
            </div>
            <div className={classnames(style.racket, style.bottom)}>
                <Racket />
            </div>
            <div className={classnames(style.racket, style.left)}>
                <Racket />
            </div>
            <div className={style.logo}>
                <Logo />
            </div>
        </div>
    );
};

export default RacketToLogo;
