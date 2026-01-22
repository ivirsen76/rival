// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import Colors from './Colors';

export default class CollarSweater extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.mask1 = uniqueId('react-mask-');
    }

    render() {
        const { path1, mask1 } = this;
        return (
            <g id="Clothing/Collar-+-Sweater" transform="translate(0.00, 170.00)">
                <defs>
                    <path
                        d="M105.19,29.05 L104,29.05 L104,29.05 C64.23,29.05 32,61.28 32,101.05 L32,110 L232,110 L232,101.05 C232,61.28 199.76,29.05 160,29.05 L160,29.05 L158.80,29.05 C158.93,30.03 159,31.03 159,32.05 C159,45.85 146.91,57.05 132,57.05 C117.08,57.05 105,45.85 105,32.05 C105,31.03 105.06,30.03 105.19,29.05 Z"
                        id={path1}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <Colors maskID={mask1} />
                <path
                    d="M156,22.27 C162.18,26.83 166,33.10 166,40.02 C166,47.23 161.86,53.73 155.22,58.32 L149.57,53.87 L145,54.20 L146,51.05 L145.92,50.99 C152.02,47.85 156,42.70 156,36.87 L156,22.27 Z M108,21.57 C101.23,26.17 97,32.73 97,40.02 C97,47.42 101.36,54.08 108.30,58.69 L114.42,53.87 L119,54.20 L118,51.05 L118.07,50.99 C111.97,47.85 108,42.70 108,36.87 L108,21.57 Z"
                    id="Collar"
                    fill="#F2F2F2"
                    fillRule="evenodd"
                />
            </g>
        );
    }
}
CollarSweater.optionValue = 'CollarSweater';
