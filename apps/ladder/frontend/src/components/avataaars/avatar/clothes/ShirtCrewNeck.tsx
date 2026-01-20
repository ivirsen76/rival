import * as React from 'react';
import { uniqueId } from 'lodash';
import Colors from './Colors';

export default class ShirtCrewNeck extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.mask1 = uniqueId('react-mask-');
    }

    render() {
        const { path1, mask1 } = this;
        return (
            <g id="Clothing/Shirt-Crew-Neck" transform="translate(0.00, 170.00)">
                <defs>
                    <path
                        d="M165.96,29.29 C202.93,32.32 232,63.29 232,101.05 L232,110 L32,110 L32,101.05 C32,62.95 61.59,31.76 99.04,29.21 C99.01,29.59 99,29.96 99,30.34 C99,42.21 113.99,51.82 132.5,51.82 C151.00,51.82 166,42.21 166,30.34 C166,29.99 165.98,29.64 165.96,29.29 Z"
                        id={path1}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <Colors maskID={mask1} />
                <g
                    id="Shadowy"
                    opacity="0.59"
                    strokeWidth="1"
                    fillRule="evenodd"
                    mask={`url(#${mask1})`}
                    fillOpacity="0.16"
                    fill="#000000"
                >
                    <g transform="translate(92.00, 4.00)" id="Hola-👋🏼">
                        <ellipse cx="40.5" cy="27.84" rx="39.63" ry="26.91" />
                    </g>
                </g>
            </g>
        );
    }
}
ShirtCrewNeck.optionValue = 'ShirtCrewNeck';
