// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class LongHairBob extends React.Component {
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
                    <rect id={path1} x="0" y="0" width="264" height="280" />
                    <path
                        d="M38,79.35 L38,111 C38,133.33 51.08,152.62 70,161.61 L70,174.74 C50.36,177.43 34.64,182.16 23.38,181.00 C9.16,179.53 1.49,150.79 1,126 C0.38,95.16 29.31,30.79 40,18 C47.92,8.50 69.69,0.55 94.00,1 C118.30,1.44 140.86,6.81 149.00,17 C161.32,32.42 186.86,91.07 187.00,126 C187.09,150.80 177.46,175.65 164.00,177 C152.92,178.10 137.47,175.51 118,173.99 L118,161.61 C136.91,152.62 150,133.33 150,111 L150,82.98 C140.47,78.13 131.86,72.24 124.15,65.34 C127.36,70.63 130.84,75.14 134.61,78.87 C107.59,71.29 86.10,58.45 70.14,40.34 C62.15,56.80 51.44,69.81 38.00,79.35 Z"
                        id={path2}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <g id="Mask" />
                <g id="Top/Long-Hair/Bob" mask={`url(#${mask1})`}>
                    <g transform="translate(-1.00, 0.00)">
                        <g id="Hair" strokeWidth="1" fillRule="evenodd" transform="translate(39.00, 19.00)">
                            <mask id={mask2} fill="white">
                                <use xlinkHref={'#' + path2} />
                            </mask>
                            <use id="Combined-Shape" fill="#E6E6E6" xlinkHref={'#' + path2} />
                            <HairColor maskID={mask2} />
                        </g>
                        <FacialHair />
                        {this.props.children}
                    </g>
                </g>
            </g>
        );
    }
}
LongHairBob.optionValue = 'LongHairBob';
