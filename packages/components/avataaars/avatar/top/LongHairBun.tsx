// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class LongHairBun extends React.Component {
    constructor() {
        super(...arguments);
        this.mask1 = uniqueId('react-mask-');
        this.mask2 = uniqueId('react-mask-');
        this.path1 = uniqueId('react-path-');
        this.path2 = uniqueId('react-path-');
    }

    render() {
        const { mask1, mask2, path1, path2 } = this;
        return (
            <g id="Top" strokeWidth="1" fillRule="evenodd">
                <defs>
                    <rect id={path2} x="0" y="0" width="264" height="280" />
                    <path
                        d="M114.93,28.33 C113.95,28.55 112.98,28.79 112.03,29.02 C96.94,32.83 88.01,43.65 80.35,59.64 C76.59,67.50 74.36,76.79 74.02,85.48 C73.88,88.89 74.34,92.41 75.26,95.70 C75.60,96.90 77.42,101.08 77.92,97.70 C78.08,96.58 77.48,95.03 77.42,93.83 C77.34,92.26 77.42,90.68 77.53,89.11 C77.73,86.18 78.25,83.31 79.18,80.52 C80.51,76.53 82.20,72.21 84.78,68.84 C91.18,60.52 95.76,43.20 133,41.67 C170.23,40.13 181.74,67.46 185.18,73.30 C189.24,80.21 187.37,88.70 188.61,96.20 C189.09,99.05 190.16,98.98 190.75,96.43 C191.74,92.10 192.21,87.61 191.90,83.15 C191.18,73.11 187.49,46.70 167.30,35.00 C161.86,31.85 156.43,29.68 151.11,28.28 C154.17,25.31 156,21.56 156,17.5 C156,7.83 145.70,0 133,0 C120.29,0 110,7.83 110,17.5 C110,21.59 111.84,25.35 114.93,28.33 Z"
                        id={path1}
                    />
                </defs>
                <mask id={mask2} fill="white">
                    <use xlinkHref={'#' + path2} />
                </mask>
                <g id="Mask" />
                <g id="Top/Long-Hair/Bun" mask={`url(#${mask2})`}>
                    <g transform="translate(-1.00, 0.00)">
                        <FacialHair />
                        <mask id={mask1} fill="white">
                            <use xlinkHref={'#' + path1} />
                        </mask>
                        <use id="Short-Hair" stroke="none" fill="#28354B" fillRule="evenodd" xlinkHref={'#' + path1} />
                        <HairColor maskID={mask1} />
                        {this.props.children}
                    </g>
                </g>
            </g>
        );
    }
}
LongHairBun.optionValue = 'LongHairBun';
