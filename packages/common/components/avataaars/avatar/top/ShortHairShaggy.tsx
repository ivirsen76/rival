// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class ShortHairShaggy extends React.Component {
    constructor() {
        super(...arguments);
        this.filter1 = uniqueId('react-filter-');
        this.mask1 = uniqueId('react-mask-');
        this.mask2 = uniqueId('react-mask-');
        this.path1 = uniqueId('react-path-');
        this.path2 = uniqueId('react-path-');
    }

    render() {
        const { filter1, mask1, mask2, path1, path2 } = this;
        return (
            <g id="Top" strokeWidth="1" fillRule="evenodd">
                <defs>
                    <rect id={path2} x="0" y="0" width="264" height="280" />
                    <filter
                        x="-0.8%"
                        y="-2.0%"
                        width="101.5%"
                        height="108.0%"
                        filterUnits="objectBoundingBox"
                        id={filter1}
                    >
                        <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
                        <feColorMatrix
                            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.16 0"
                            type="matrix"
                            in="shadowOffsetOuter1"
                            result="shadowMatrixOuter1"
                        />
                        <feMerge>
                            <feMergeNode in="shadowMatrixOuter1" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <path
                        d="M198.74,37.85 C193.60,34.02 187.52,30.73 181.18,29.47 C174.74,28.19 170.82,27.88 164.48,29.40 C162.85,29.79 162.29,30.18 160.86,29.25 C159.65,28.47 151.20,19.76 125.44,24.59 C99.40,29.48 91.67,68.67 82.01,70.16 C78.53,70.70 74.23,69.78 74.09,67.63 C70.13,73.67 69.09,81.64 70.77,88.71 C72.21,94.79 75.26,100.51 80.76,103.84 C85.48,106.71 92.02,107.96 97.48,107.43 C99.96,107.19 102.22,106.67 104.51,105.67 C107.27,104.46 109.47,102.28 112.17,101.12 C109.35,103.57 106.27,105.73 103.00,107.54 C101.36,108.45 99.69,109.07 97.88,109.57 C96.65,109.90 94.12,111.05 92.93,110.75 C100.74,112.14 108.09,110.93 115.25,107.58 C118.48,106.08 121.59,104.25 124.44,102.11 C127.27,99.98 130.53,97.80 132.75,95.00 C131.82,96.20 133.45,94.41 133.66,94.19 C134.27,93.57 134.86,92.94 135.45,92.30 C136.45,91.19 137.45,90.07 138.38,88.91 C140.37,86.42 142.23,83.82 143.89,81.10 C145.56,78.35 152.24,67.23 154.26,64.61 C152.36,70.32 150.28,76.03 147.85,81.54 C152.57,80.07 157.14,76.00 160.15,72.20 C163.54,67.92 165.55,62.93 166.26,57.53 C170.08,67.95 179.04,76.16 188.29,81.83 C186.29,78.10 183.23,74.94 181.24,71.15 C190.43,80.48 205.80,85.04 209.83,98.72 C210.86,93.97 214.18,90.14 215.18,85.29 C216.28,79.90 217.08,74.18 216.90,68.67 C216.50,56.43 208.27,44.95 198.74,37.85 Z"
                        id={path1}
                    />
                </defs>
                <mask id={mask2} fill="white">
                    <use xlinkHref={'#' + path2} />
                </mask>
                <g id="Mask" />
                <g id="Top/Short-Hair/Shaggy" mask={`url(#${mask2})`}>
                    <g transform="translate(-1.00, 0.00)">
                        <FacialHair />
                        {this.props.children}
                        <mask id={mask1} fill="white">
                            <use xlinkHref={'#' + path1} transform="scale(-1, 1)" />
                        </mask>

                        <use
                            id="Shaggy-Hair"
                            stroke="none"
                            fill="#28354B"
                            fillRule="evenodd"
                            transform="translate(143.46, 67.23) scale(-1, 1) translate(-143.46, -67.23) "
                            xlinkHref={'#' + path1}
                        />
                        <HairColor maskID={mask1} />
                    </g>
                </g>
            </g>
        );
    }
}
ShortHairShaggy.optionValue = 'ShortHairShaggy';
