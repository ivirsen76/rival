// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import Colors from './Colors';

export default class BlazerSweater extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.mask1 = uniqueId('react-mask-');
    }

    render() {
        const { path1, mask1 } = this;
        return (
            <>
                <g id="Clothing/Blazer-+-Sweater" transform="translate(0.00, 170.00)">
                    <defs>
                        <g id={path1}>
                            <path d="M105.19,29.05 L104,29.05 L104,29.05 C64.23,29.05 32,61.28 32,101.05 L32,110 L232,110 L232,101.05 C232,61.28 199.76,29.05 160,29.05 L160,29.05 L158.80,29.05 C158.93,30.03 159,31.03 159,32.05 C159,45.85 146.91,57.05 132,57.05 C117.08,57.05 105,45.85 105,32.05 C105,31.03 105.06,30.03 105.19,29.05 Z" />
                        </g>
                    </defs>
                    <mask id={mask1} fill="white">
                        <use xlinkHref={'#' + path1} />
                    </mask>
                    <Colors maskID={mask1} />

                    <g id="Blazer" strokeWidth="1" fillRule="evenodd" transform="translate(32.00, 28.00)">
                        <path
                            d="M69,1.13e-13 C65,19.33 66.66,46.66 74,82 L58,82 L44,46 L50,37 L44,31 L63,1 C65.02,0.36 67.02,0.03 69,1.13e-13 Z"
                            id="Wing"
                            fill="#000"
                            fillOpacity="0.15"
                        />
                        <path
                            d="M151,1.13e-13 C147,19.33 148.66,46.66 156,82 L140,82 L126,46 L132,37 L126,31 L145,1 C147.02,0.36 149.02,0.03 151,1.13e-13 Z"
                            id="Wing"
                            fill="#000"
                            fillOpacity="0.15"
                            transform="translate(141.00, 41.00) scale(-1, 1) translate(-141.00, -41.00) "
                        />
                    </g>
                    <path
                        d="M 105.81 279.08 L 157.66 279.07 C 163.41 258.36 165.09 226.79 164.89 217.72 C 154.07 218.56 140.92 226.28 132.59 226.51 C 124.26 226.74 112.4 220.15 99.15 218.01 C 98.54 241.97 104 268.01 105.81 279.08 Z"
                        fill="#000"
                        fillOpacity="0.5"
                        transform="translate(0.00, -170.00)"
                    ></path>
                    <path
                        d="M149,58 L158.55,50.83 L158.55,50.83 C159.99,49.75 161.98,49.76 163.41,50.87 L170,56 L149,58 Z"
                        id="Pocket-hanky"
                        fill="#E6E6E6"
                        transform="translate(32.00, 28.00)"
                    />
                    <path
                        d="M156,21.53 C162.77,26.13 167,32.65 167,39.88 C167,47.28 162.57,53.94 155.52,58.55 L149.57,53.87 L145,54.20 L146,51.05 L145.92,50.99 C152.02,47.85 156,42.70 156,36.87 L156,21.53 Z M108,21.53 C101.22,26.13 97,32.65 97,39.88 C97,47.28 101.42,53.94 108.47,58.55 L114.42,53.87 L119,54.20 L118,51.05 L118.07,50.99 C111.97,47.85 108,42.70 108,36.87 L108,21.53 Z"
                        id="Collar"
                        fill="#F2F2F2"
                        fillRule="evenodd"
                    />
                </g>
            </>
        );
    }
}
BlazerSweater.optionValue = 'BlazerSweater';
