import { Squircle } from 'corner-smoothing';
import { Link } from 'react-router-dom';
import style from './style.module.scss';

const CtaButton = () => {
    return (
        <Link to="/register" data-hero-register-button>
            <Squircle className={style.cta} cornerRadius={15}>
                Join Ladder
            </Squircle>
        </Link>
    );
};

export default CtaButton;
