import useUniqueId from '@/utils/useUniqueId';
import style from './style.module.scss';

type IconProps = {
    type: string;
    dayPart: string;
};

const Icon = (props: IconProps) => {
    const sunGradientId = useUniqueId();
    const sunGlowId = useUniqueId();

    const bigCloud = (
        <>
            <path
                d="M 220.27 153.83 C 220.27 153.83 223.4 145.62 233.3 145.78 C 242.07 145.92 245.88 152.67 246.64 157.74 C 252.25 157.67 254.3 158.67 254.24 165.91 C 254.18 173.15 250.31 175.56 241.52 175.55 C 236.64 175.54 233.19 175.55 219.31 175.56 C 205.33 175.57 206.2 153.8 220.27 153.83 Z"
                fill="#000"
                filter={`url(#${sunGlowId})`}
                fillOpacity="0.25"
            />
            <path
                className={style.dark}
                d="M 220.27 153.83 C 220.27 153.83 223.4 145.62 233.3 145.78 C 242.07 145.92 245.88 152.67 246.64 157.74 C 252.25 157.67 254.3 158.67 254.24 165.91 C 254.18 173.15 250.31 175.56 241.52 175.55 C 236.64 175.54 233.19 175.55 219.31 175.56 C 205.33 175.57 206.2 153.8 220.27 153.83 Z"
                fill="#fff"
            />
        </>
    );
    const smallCloud = (
        <>
            <path
                d="M 242.06 158.13 C 242.06 158.13 244 153.06 250.11 153.16 C 256.23 153.26 258.21 158.04 258.37 160.7 C 262.06 160.69 264.11 162.78 264.1 166.07 C 264.09 169.11 262.04 171.36 258.16 171.42 C 255.18 171.47 250.11 171.55 241.47 171.56 C 232.83 171.57 233.37 158.12 242.06 158.13 Z"
                fill="#000"
                filter={`url(#${sunGlowId})`}
                fillOpacity="0.25"
            />
            <path
                className={style.dark}
                d="M 242.06 158.13 C 242.06 158.13 244 153.06 250.11 153.16 C 256.23 153.26 258.21 158.04 258.37 160.7 C 262.06 160.69 264.11 162.78 264.1 166.07 C 264.09 169.11 262.04 171.36 258.16 171.42 C 255.18 171.47 250.11 171.55 241.47 171.56 C 232.83 171.57 233.37 158.12 242.06 158.13 Z"
                fill="#fcfcfc"
            />
        </>
    );

    return (
        <svg
            viewBox="198.2 132 77 77"
            xmlns="http://www.w3.org/2000/svg"
            data-weather={props.type}
            className={style[props.dayPart]}
        >
            <defs>
                <linearGradient id={sunGradientId} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ffe100" />
                    <stop offset="100%" stopColor="#fd7e00" />
                </linearGradient>
                <filter id={sunGlowId} x="-100" y="-100" width="200" height="200">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
                </filter>
            </defs>

            <g className={style.sun} transform="translate(0, -2)">
                <circle
                    cx="236.98"
                    cy="162.33"
                    r="16.79"
                    fill="#FFC701"
                    fillOpacity="0.35"
                    filter={`url(#${sunGlowId})`}
                />
                <circle cx="236.98" cy="162.33" r="16.79" fill={`url(#${sunGradientId})`} />
            </g>

            <g className={style.partSunGlow} transform="translate(0, -2)">
                <circle
                    cx="236.98"
                    cy="162.33"
                    r="16.79"
                    fill="#FFC701"
                    fillOpacity="0.35"
                    filter={`url(#${sunGlowId})`}
                />
            </g>

            <g className={style.moon}>
                <path
                    d="M 236.98 177.11 C 227.71 177.11 220.2 169.6 220.2 160.33 C 220.2 153.81 223.92 148.15 229.36 145.38 C 231 144.53 232.84 144.04 233.31 144.53 C 233.78 145.02 233.2 147.75 233.2 150.03 C 233.2 157.71 239.43 163.94 247.11 163.94 C 249.47 163.94 252.09 163.35 252.71 163.72 C 253.33 164.09 252.9 165.92 252.14 167.53 C 249.44 173.2 243.67 177.11 236.98 177.11 Z"
                    fill="#009ef7"
                />
                <path
                    d="M 251.2 152.11 C 251.2 152.28 251.19 152.45 251.17 152.62 C 249.26 152.73 247.72 154.21 247.53 156.1 C 247.42 156.11 247.31 156.11 247.2 156.11 C 247 156.11 246.8 156.09 246.6 156.07 C 246.46 154.22 245.04 152.73 243.22 152.5 C 243.21 152.37 243.2 152.24 243.2 152.11 C 243.2 151.95 243.21 151.79 243.23 151.63 C 245.04 151.42 246.47 149.97 246.64 148.15 C 246.82 148.12 247.01 148.11 247.2 148.11 C 247.32 148.11 247.45 148.12 247.57 148.13 C 247.67 150.09 249.23 151.66 251.19 151.79 C 251.2 151.9 251.2 152 251.2 152.11 Z"
                    fill="#f9ae00"
                />
                <path
                    d="M 244.08 141.93 C 244.08 142.03 244.08 142.13 244.07 142.23 C 242.9 142.3 241.96 143.2 241.84 144.36 C 241.78 144.36 241.71 144.36 241.65 144.36 C 241.52 144.36 241.4 144.35 241.28 144.34 C 241.19 143.21 240.32 142.3 239.21 142.16 C 239.21 142.08 239.2 142 239.2 141.93 C 239.2 141.82 239.21 141.72 239.22 141.63 C 240.32 141.5 241.2 140.61 241.3 139.5 C 241.41 139.49 241.52 139.48 241.65 139.48 C 241.72 139.48 241.8 139.49 241.87 139.49 C 241.93 140.69 242.88 141.65 244.08 141.72 C 244.08 141.79 244.08 141.85 244.08 141.93 Z"
                    fill="#f9ae00"
                />
            </g>
            <path
                className={style.smallMoon}
                d="M 254.09 161.11 C 248.36 161.11 243.71 156.46 243.71 150.73 C 243.71 146.7 246.01 143.2 249.38 141.48 C 250.39 140.96 251.53 140.65 251.82 140.96 C 252.11 141.26 251.75 142.95 251.75 144.36 C 251.75 149.11 255.61 152.96 260.36 152.96 C 261.82 152.96 263.44 152.6 263.82 152.83 C 264.21 153.06 263.94 154.19 263.47 155.18 C 261.8 158.69 258.23 161.11 254.09 161.11 Z"
                fill="#009ef7"
            />

            <path
                className={style.lightning}
                fill="#f9ae00"
                d="M 243.68 180.39 C 244.23 181.47 251.82 180.08 251.96 180.98 C 252.1 181.88 236.72 194.47 236.2 194.07 C 235.68 193.67 241.26 185.06 240.84 184.28 C 240.42 183.5 234.86 184.64 234.22 183.49 C 233.85 182.82 236.26 178.51 238 175.55 C 239.21 175.55 240.32 175.55 241.52 175.55 C 243.16 175.55 244.64 175.47 245.94 175.29 C 244.72 177.3 243.37 179.77 243.68 180.39 Z"
            />
            <g className={style.cloud}>
                {bigCloud}
                {smallCloud}
            </g>
            <g className={style.smallNightCloud} transform="translate(-22, 8)">
                {smallCloud}
            </g>
            <g className={style.smallCloud} transform="translate(0, 8)">
                {smallCloud}
            </g>
            <g className={style.bigCloud} transform="translate(0, 8)">
                {bigCloud}
                {smallCloud}
            </g>
            <g className={style.partSun}>
                <path
                    d="M 253.77 160.33 C 253.77 160.85 253.75 161.37 253.7 161.89 C 252.7 161.45 251.52 161.18 250.11 161.16 C 248.27 161.13 246.8 161.57 245.66 162.2 C 243.94 157.99 240.12 153.89 233.3 153.78 C 223.4 153.62 220.27 161.83 220.27 161.83 L 220.26 161.83 C 220.21 161.34 220.19 160.84 220.19 160.33 C 220.19 151.06 227.71 143.54 236.98 143.54 C 246.25 143.54 253.77 151.06 253.77 160.33 Z"
                    fill={`url(#${sunGradientId})`}
                />
            </g>
            <g className={style.rain}>
                <path stroke="#009ef7" strokeWidth="3.2px" strokeLinecap="round" d="M 219.74 183.18 L 215.8 189.88" />
                <path stroke="#009ef7" strokeWidth="3.2px" strokeLinecap="round" d="M 228.5 183.18 L 221.86 194.66" />
                <path
                    className={style.extraRain}
                    stroke="#009ef7"
                    strokeWidth="3.2px"
                    strokeLinecap="round"
                    d="M 237.71 183.07 L 232.44 192.17"
                />
                <path
                    className={style.extraRain}
                    stroke="#009ef7"
                    strokeWidth="3.2px"
                    strokeLinecap="round"
                    d="M 246.74 183.18 L 242.68 190.33"
                />
            </g>
            <g className={style.drizzle}>
                <path stroke="#009ef7" strokeWidth="3.2px" strokeLinecap="round" d="M 219.74 183.18 L 217.88 185.98" />
                <path stroke="#009ef7" strokeWidth="3.2px" strokeLinecap="round" d="M 228.74 183.18 L 226.88 185.98" />
                <path stroke="#009ef7" strokeWidth="3.2px" strokeLinecap="round" d="M 237.74 183.18 L 235.88 185.98" />
                <path stroke="#009ef7" strokeWidth="3.2px" strokeLinecap="round" d="M 246.74 183.18 L 244.88 185.98" />
            </g>
            <g className={style.snow}>
                <circle fill="#fff" stroke="#bbb" strokeWidth="0.7px" cx="221.96" cy="185.93" r="3.91" />
                <circle fill="#fff" stroke="#bbb" strokeWidth="0.7px" cx="244.56" cy="185.93" r="3.91" />
                <circle fill="#fff" stroke="#bbb" strokeWidth="0.7px" cx="233.77" cy="191.74" r="3.91" />
            </g>
            <g className={style.wind} transform="matrix(0.42125, 0, 0, 0.42125, 160.193222, 42.137108)">
                <circle cx="215.89" cy="256.43" r="10.04" fill="#009ef7" />
                <path stroke="#009ef7" strokeLinecap="round" strokeWidth="6px" d="M 168.81 263.47 L 215.26 263.47" />
                <circle cx="214.75" cy="306.67" r="10.04" fill="#009ef7" />
                <path stroke="#009ef7" strokeLinecap="round" strokeWidth="6px" d="M 146.89 299.64 L 213.26 299.64" />
                <circle cx="236.75" cy="288.5" r="10.04" fill="#009ef7" />
                <path stroke="#009ef7" strokeLinecap="round" strokeWidth="6px" d="M 119.62 281.47 L 235.26 281.47" />
            </g>
            <g className={style.wintryMix}>
                <path stroke="#009ef7" strokeWidth="3.2px" strokeLinecap="round" d="M 218.74 183.18 L 214.8 189.88" />
                <path stroke="#009ef7" strokeWidth="3.2px" strokeLinecap="round" d="M 227.5 183.18 L 220.86 194.66" />
                <circle fill="#fff" stroke="#bbb" strokeWidth="0.7px" cx="245.56" cy="185.93" r="3.91" />
                <circle fill="#fff" stroke="#bbb" strokeWidth="0.7px" cx="234.77" cy="191.74" r="3.91" />
            </g>
        </svg>
    );
};

Icon.defaultProps = {
    dayPart: 'day',
};

export default Icon;
