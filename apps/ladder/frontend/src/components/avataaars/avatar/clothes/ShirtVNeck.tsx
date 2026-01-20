import * as React from 'react';
import { uniqueId } from 'lodash';
import Colors from './Colors';

export default class ShirtVNeck extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.mask1 = uniqueId('react-mask-');
    }

    render() {
        const { path1, mask1 } = this;
        return (
            <g id="Clothing/Shirt-V-Neck" transform="translate(0.00, 170.00)">
                <defs>
                    <path
                        d="M171.31,29.93 C205.70,35.36 232,65.13 232,101.05 L232,110 L32,110 L32,101.05 C32,65.13 58.29,35.36 92.68,29.93 C93.58,35.00 96.11,39.82 100.23,43.53 L100.23,43.53 L129.32,69.76 C130.84,71.14 133.15,71.14 134.67,69.76 L134.67,69.76 L163.76,43.53 C164.18,43.15 164.60,42.75 164.99,42.34 C168.41,38.78 170.51,34.45 171.31,29.93 Z"
                        id={path1}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <Colors maskID={mask1} />
            </g>
        );
    }
}
ShirtVNeck.optionValue = 'ShirtVNeck';
