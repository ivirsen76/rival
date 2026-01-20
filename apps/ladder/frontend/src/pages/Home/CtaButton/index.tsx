import { Squircle } from 'corner-smoothing';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addHistoryEventAndSave } from '@/reducers/auth';
import style from './style.module.scss';

const CtaButton = () => {
    const dispatch = useDispatch();

    return (
        <Link
            to="/register"
            data-hero-register-button
            onClick={() => {
                dispatch(addHistoryEventAndSave({ type: 'clickHeroRegisterButton' }));
            }}
        >
            <Squircle className={style.cta} cornerRadius={15}>
                Register
            </Squircle>
        </Link>
    );
};

export default CtaButton;
