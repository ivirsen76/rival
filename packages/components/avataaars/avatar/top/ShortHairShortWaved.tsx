// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class ShortHairShortWaved extends React.Component {
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
                        d="M183.67,38.94 C189.08,33.99 190.38,23.96 187.31,17.44 C183.54,9.45 175.90,8.45 168.57,11.96 C161.66,15.28 155.51,16.38 147.95,14.78 C140.69,13.24 133.80,10.52 126.30,10.07 C113.97,9.34 102.00,13.91 93.60,23.12 C92.00,24.88 90.70,26.89 89.48,28.93 C88.51,30.56 87.41,32.31 86.99,34.19 C86.79,35.08 87.16,37.28 86.72,38.02 C86.23,38.81 84.42,39.53 83.65,40.12 C82.08,41.31 80.72,42.65 79.47,44.17 C76.80,47.39 75.33,50.75 74.10,54.74 C70.00,67.98 69.65,83.74 74.95,96.74 C75.66,98.48 77.85,102.09 79.14,98.38 C79.39,97.65 78.80,95.19 78.80,94.45 C78.81,91.73 80.31,73.72 86.85,63.63 C88.98,60.34 98.82,48.05 100.84,47.95 C101.90,49.64 112.72,60.46 140.78,59.19 C153.44,58.62 163.18,52.93 165.52,50.46 C166.54,56.00 178.51,64.28 180.33,67.69 C185.60,77.53 186.77,97.99 188.78,97.95 C190.79,97.91 192.23,92.71 192.64,91.72 C195.71,84.35 196.24,75.09 195.91,67.16 C195.48,56.96 191.27,45.94 183.67,38.94 Z"
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
                <g id="Top/Short-Hair/Short-Waved" mask={`url(#${mask2})`}>
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
ShortHairShortWaved.optionValue = 'ShortHairShortWaved';
