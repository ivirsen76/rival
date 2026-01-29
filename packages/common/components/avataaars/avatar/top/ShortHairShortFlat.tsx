// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class ShortHairShortFlat extends React.Component {
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
                        d="M180.14,39.92 C177.39,37.10 174.18,34.70 171.06,32.30 C170.38,31.77 169.68,31.26 169.01,30.71 C168.85,30.58 167.29,29.46 167.10,29.05 C166.65,28.06 166.91,28.83 166.97,27.64 C167.05,26.15 170.11,21.91 167.83,20.94 C166.82,20.52 165.03,21.65 164.07,22.03 C162.19,22.76 160.29,23.39 158.34,23.93 C159.27,22.07 161.05,18.35 157.71,19.35 C155.11,20.12 152.69,22.12 150.07,23.05 C150.94,21.64 154.39,17.24 151.27,17.00 C150.30,16.92 147.47,18.75 146.42,19.13 C143.28,20.30 140.08,21.05 136.78,21.65 C125.59,23.67 112.49,23.09 102.13,28.19 C94.14,32.12 86.26,38.22 81.64,45.98 C77.20,53.47 75.53,61.66 74.60,70.24 C73.92,76.53 73.86,83.04 74.18,89.35 C74.29,91.42 74.52,100.97 77.53,98.08 C79.03,96.64 79.01,90.82 79.39,88.86 C80.14,84.94 80.87,81.01 82.12,77.22 C84.32,70.54 86.93,63.42 92.42,58.82 C95.95,55.87 98.43,51.88 101.80,48.91 C103.32,47.57 102.16,47.71 104.60,47.88 C106.24,48.00 107.88,48.05 109.52,48.09 C113.32,48.19 117.12,48.16 120.92,48.18 C128.56,48.20 136.17,48.31 143.81,47.91 C147.21,47.73 150.61,47.64 154.00,47.32 C155.89,47.15 159.25,45.94 160.80,46.86 C162.23,47.71 163.71,50.48 164.73,51.61 C167.15,54.29 170.03,56.33 172.86,58.53 C178.75,63.11 181.73,68.86 183.52,76.02 C185.30,83.15 184.80,89.76 187.01,96.78 C187.40,98.01 188.42,100.14 189.69,98.23 C189.93,97.88 189.86,95.93 189.86,94.81 C189.86,90.29 191.01,86.90 190.99,82.35 C190.94,68.52 190.49,50.49 180.14,39.92 Z"
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
                <g id="Top/Short-Hair/Short-Flat" mask={`url(#${mask2})`}>
                    <g transform="translate(-1.00, 0.00)">
                        <FacialHair />
                        <mask id={mask1} fill="white">
                            <use xlinkHref={'#' + path1} />
                        </mask>
                        <use id="Short-Hair" stroke="none" fill="#1F3140" fillRule="evenodd" xlinkHref={'#' + path1} />
                        <HairColor maskID={mask1} />
                        {this.props.children}
                    </g>
                </g>
            </g>
        );
    }
}
ShortHairShortFlat.optionValue = 'ShortHairShortFlat';
