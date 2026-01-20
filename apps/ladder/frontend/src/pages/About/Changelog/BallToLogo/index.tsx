import classnames from 'classnames';
import Ball from './ball.svg?react';
import Logo from '@/assets/logo.svg?react';
import style from './style.module.scss';

const BallToLogo = props => {
    return (
        <div className={style.wrapper}>
            <div className={classnames(style.ball, style.left)}>
                <Ball />
            </div>
            <div className={classnames(style.ball, style.right)}>
                <Ball />
            </div>
            <div className={style.logo}>
                <Logo />
            </div>
        </div>
    );
};

export default BallToLogo;
