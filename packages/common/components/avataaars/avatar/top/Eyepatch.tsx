// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';

export default class Eyepatch extends React.Component {
    constructor() {
        super(...arguments);
        this.mask1 = uniqueId('react-mask-');
        this.path1 = uniqueId('react-path-');
    }

    render() {
        const { mask1, path1 } = this;
        return (
            <g id="Top" strokeWidth="1" fillRule="evenodd">
                <defs>
                    <rect id={path1} x="0" y="0" width="264" height="280" />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <g id="Mask" />
                <g id="Top/Accesories/Eyepatch" mask={`url(#${mask1})`}>
                    <g transform="translate(-1.00, 0.00)">
                        <FacialHair />
                        <path
                            d="M160.39,39.78 C157.31,36.69 154.11,43.63 152.62,45.42 C149.01,49.74 145.54,54.18 141.86,58.45 C134.61,66.88 127.43,75.37 120.23,83.84 C119.14,85.12 119.27,85.26 117.83,85.38 C116.88,85.47 115.56,84.98 114.57,84.92 C111.82,84.77 109.11,85.23 106.43,85.82 C101.09,86.99 95.42,88.92 90.78,91.89 C89.57,92.67 88.78,93.59 87.46,93.84 C86.31,94.05 84.79,93.62 83.62,93.51 C81.54,93.32 78.53,92.47 76.49,92.91 C73.90,93.47 72.91,96.61 75.56,98.00 C77.57,99.05 81.57,98.47 83.82,98.64 C86.39,98.83 85.61,98.70 85.24,101.16 C84.72,104.69 85.59,108.64 87.08,111.87 C90.54,119.38 100.12,127.33 108.85,126.60 C116.14,125.99 122.52,119.41 125.51,113.09 C127.05,109.86 127.95,106.19 128.25,102.62 C128.43,100.36 128.33,97.95 127.68,95.76 C127.36,94.67 126.85,93.55 126.30,92.56 C125.86,91.77 123.90,89.92 123.78,89.11 C123.55,87.56 127.97,83.38 128.81,82.34 C132.78,77.42 136.78,72.53 140.72,67.58 C144.60,62.72 148.50,57.86 152.48,53.07 C154.29,50.90 163.31,42.71 160.39,39.78"
                            id="Badass-Eyepatch"
                            fill="#28354B"
                            fillRule="evenodd"
                        />
                    </g>
                </g>
            </g>
        );
    }
}
Eyepatch.optionValue = 'Eyepatch';
