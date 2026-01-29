// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class ShortHairShortRound extends React.Component {
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
                    <path
                        d="M167.30,35.00 C147.12,23.30 127.12,25.22 112.03,29.02 C96.94,32.83 88.01,43.65 80.35,59.64 C76.59,67.50 74.36,76.79 74.02,85.48 C73.88,88.89 74.34,92.41 75.26,95.70 C75.60,96.90 77.42,101.08 77.92,97.70 C78.08,96.58 77.48,95.03 77.42,93.83 C77.34,92.26 77.42,90.68 77.53,89.11 C77.73,86.18 78.25,83.31 79.18,80.52 C80.51,76.53 82.20,72.21 84.78,68.84 C91.18,60.52 102.26,60.04 111.06,55.46 C110.30,56.86 107.35,59.14 108.37,60.72 C109.08,61.82 111.74,61.48 113.02,61.45 C116.37,61.36 119.73,60.77 123.04,60.30 C128.25,59.56 133.14,58.05 138.04,56.21 C142.06,54.71 146.65,53.32 149.66,50.14 C154.53,55.18 160.80,59.93 167.07,63.14 C172.68,66.02 181.74,67.46 185.18,73.30 C189.24,80.21 187.37,88.70 188.61,96.20 C189.09,99.05 190.16,98.98 190.75,96.43 C191.74,92.10 192.21,87.61 191.90,83.15 C191.18,73.11 187.49,46.70 167.30,35.00 Z"
                        id={path1}
                    />
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
                </defs>
                <mask id={mask2} fill="white">
                    <use xlinkHref={'#' + path2} />
                </mask>
                <g id="Mask" />
                <g id="Top/Short-Hair/Short-Round" mask={`url(#${mask2})`}>
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
ShortHairShortRound.optionValue = 'ShortHairShortRound';
