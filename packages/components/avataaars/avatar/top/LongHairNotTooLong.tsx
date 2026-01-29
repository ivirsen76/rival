// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class LongHairNotTooLong extends React.Component {
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
                        d="M59,102.34 C59,118.92 59,145.47 59,182 C59,186.41 62.58,190 67,190 L109,190 L109,180.61 C91.46,172.28 78.95,155.11 77.20,134.86 C71.43,134.00 67,129.01 67,123 L67,110 C67,106.50 68.49,103.36 70.86,101.17 C82.40,98.55 94.97,93.63 107.34,86.49 C119.47,79.49 129.84,71.25 137.82,62.75 C134.39,70.66 130.24,77.58 125.37,83.53 C138.04,78.01 146.67,69.13 151.26,56.89 C151.64,57.81 152.03,58.73 152.44,59.65 C162.69,82.69 180.31,99.01 198.20,104.40 C198.71,106.51 199,108.48 199,110 L199,123 C199,129.01 194.56,134.00 188.79,134.86 C187.04,155.11 174.53,172.28 157,180.61 L157,190 L175,190 C192.67,190 207,175.67 207,158 C207,133.94 207,115.90 207,103.87 C207,103.80 206.99,103.72 206.97,103.61 C206.82,91.35 206.62,84.22 206.36,82.22 C201.57,45.97 170.55,18 133,18 C96.91,18 66.86,43.82 60,78 C54.47,78 50,83.59 50,90.5 C50,95.05 51.69,99.14 54.85,101.27 C55.75,101.88 57.32,102.19 58.99,102.34 Z"
                        id={path2}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <g id="Mask" />
                <g id="Top/Long-Hair/Long-but-not-too-long" mask={`url(#${mask1})`}>
                    <g transform="translate(-1.00, 0.00)">
                        <g id="Behind" strokeWidth="1" fillRule="evenodd">
                            <mask id={mask2} fill="white">
                                <use xlinkHref={'#' + path2} />
                            </mask>
                            <use id="Combined-Shape" fill="#944F23" xlinkHref={'#' + path2} />
                            <HairColor maskID={mask2} />
                        </g>
                        <g
                            id="Top"
                            opacity="0.43"
                            strokeWidth="1"
                            fillRule="evenodd"
                            transform="translate(50.00, 18.00)"
                            fillOpacity="0.15"
                        >
                            <path
                                d="M11.89,84.77 C25.71,83.01 41.67,77.53 57.34,68.49 C69.47,61.49 79.84,53.25 87.82,44.75 C84.39,52.66 80.24,59.58 75.37,65.53 C88.04,60.01 96.67,51.13 101.26,38.89 C101.64,39.81 102.03,40.73 102.44,41.65 C114.38,68.47 136.29,86.19 157,88.15 L157,88.15 L157,74 C157,33.13 123.86,-7.50e-15 83,0 C46.91,6.62e-15 16.86,25.82 10.32,60.00 C10.21,60.00 10.10,60 10,60 C4.47,60 0,65.59 0,72.5 C0,78.98 3.94,84.31 8.99,84.93 L8.99,85.09 C9.31,85.06 9.63,85.03 9.95,84.99 C9.96,84.99 9.98,85 10,85 C10.64,85 11.28,84.92 11.89,84.77 Z"
                                id="Combined-Shape"
                                fill="#FFFFFF"
                            />
                        </g>
                        <FacialHair />
                        {this.props.children}
                    </g>
                </g>
            </g>
        );
    }
}
LongHairNotTooLong.optionValue = 'LongHairNotTooLong';
