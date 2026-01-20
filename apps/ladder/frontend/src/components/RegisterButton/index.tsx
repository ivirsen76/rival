import { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addHistoryEventAndSave } from '@/reducers/auth';
import style from './style.module.scss';

const RegisterButton = props => {
    const [show, setShow] = useState(false);
    const [animateClassName, setAnimateClassName] = useState('animate__animated animate__bounceIn');
    const history = useHistory();
    const location = useLocation();
    const currentUser = useSelector(state => state.auth.user);
    const dispatch = useDispatch();

    useEffect(() => {
        (async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setShow(true);

            if (currentUser) {
                // Don't animate it when rendering for the second time
                await new Promise(resolve => setTimeout(resolve, 1000));
                setAnimateClassName('');
            } else {
                // 1 minute
                await new Promise(resolve => setTimeout(resolve, 60 * 1000));
                setAnimateClassName('animate__animated animate__heartBeat');

                // another 1 minute
                await new Promise(resolve => setTimeout(resolve, 60 * 1000));
                setAnimateClassName('');
                await new Promise(resolve => setTimeout(resolve, 0));
                setAnimateClassName('animate__animated animate__heartBeat');
            }
        })();
    }, []);

    const goToRegisterPage = () => {
        dispatch(addHistoryEventAndSave({ type: 'clickFancyRegisterButton' }));
        history.push('/register');
    };

    if ([/^\/register$/, /^\/login$/, /^\/action\//].some(regex => regex.test(location.pathname))) {
        return null;
    }
    if (currentUser && location.pathname !== '/') {
        return null;
    }
    if (!show) {
        return null;
    }

    return (
        <div className={style.wrapper}>
            <div id="registerButton" className={style.registerButton} onClick={goToRegisterPage}>
                <svg
                    className={animateClassName}
                    viewBox="25 89 398 137"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        style={{ fill: 'rgb(70, 117, 195)', fillOpacity: 0.9 }}
                        d="M 75.01 132.32 C 103.07 133.12 357.14 124.46 400.87 123.84 C 416.37 122.97 425.14 138.94 421.06 150.41 C 418.36 161.11 411.25 186.74 405.45 204.26 C 401.58 218.31 394.19 223.41 377.54 222.25 C 353.01 221.81 113.33 215.33 89.86 214.27 C 73.85 213.55 69.37 208.76 66.98 199.7 C 63.98 189.22 58.91 171.66 56.07 156.58 C 53.72 144.11 62.29 131.96 75.01 132.32 Z"
                    />
                    <path
                        style={{ fill: '#becc3f', fillOpacity: 0.9 }}
                        d="M 50.49 113.45 C 78.51 115.25 332.72 115.79 376.45 116.75 C 391.97 116.44 400.15 132.71 395.66 144.02 C 392.58 154.62 384.55 179.98 378.11 197.28 C 373.74 211.18 366.18 216.01 349.57 214.24 C 325.08 212.92 85.79 197.79 62.37 195.89 C 46.4 194.58 42.1 189.63 40.03 180.5 C 37.41 169.92 32.98 152.18 30.69 137.01 C 28.79 124.47 37.79 112.63 50.49 113.45 Z"
                    />
                    <path
                        style={{ fill: 'rgb(195, 70, 165)', fillOpacity: 0.9 }}
                        d="M 43.89 145.44 C 74.3 142.24 347.17 97.55 394.26 90.71 C 410.84 87.65 422.79 102.21 420.16 114.14 C 418.92 125.11 415.2 151.49 411.67 169.66 C 409.67 184.12 402.49 190.22 384.33 191.44 C 357.8 194.49 98.11 222.16 72.6 224.45 C 55.23 226.01 49.66 221.9 45.66 213.28 C 40.81 203.33 32.61 186.67 27.2 172.15 C 22.74 160.14 30.09 146.89 43.89 145.44 Z"
                    />
                    <path
                        className={style.background}
                        style={{ stroke: 'currentColor', strokeWidth: '5px' }}
                        d="M 60.54 131.7 C 88.61 131.23 342.03 111.14 385.69 108.55 C 401.13 106.98 410.61 122.54 407.05 134.18 C 404.84 144.99 398.89 170.91 393.88 188.68 C 390.65 202.89 383.5 208.32 366.81 207.91 C 342.29 208.57 102.56 212.9 79.06 212.9 C 63.04 212.9 58.35 208.31 55.55 199.37 C 52.08 189.04 46.23 171.72 42.71 156.79 C 39.8 144.44 47.81 131.91 60.54 131.7 Z"
                    />

                    <text
                        transform="matrix(0.99882, -0.048558, 0.048558, 0.99882, 136.951035, -5.366832)"
                        style={{
                            fill: 'currentColor',
                            fontFamily: 'Poppins, Helvetica',
                            fontSize: '40px',
                            fontWeight: 'bold',
                            textAnchor: 'middle',
                        }}
                        y="186.54"
                        x="82.56"
                    >
                        Register Now
                    </text>
                </svg>
            </div>
        </div>
    );
};

export default RegisterButton;
