import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class ShortHairShortCurly extends React.Component {
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
                        d="M94.25,52.02 C94.37,51.96 94.06,51.94 93.33,51.95 C94.22,51.95 94.53,51.97 94.25,52.02 M86.11,36.30 C86.11,36.28 86.13,36.45 86.11,36.30 M193.76,70.76 C193.50,67.44 193.03,64.15 192.24,60.91 C191.62,58.33 190.76,55.87 189.76,53.42 C189.15,51.93 187.72,49.89 187.56,48.29 C187.39,46.71 188.62,44.96 188.88,43.13 C189.14,41.34 189.10,39.46 188.73,37.69 C187.90,33.67 185.14,29.93 180.87,28.88 C179.92,28.64 177.91,28.93 177.24,28.38 C176.46,27.74 175.93,25.58 175.23,24.71 C173.24,22.23 170.13,20.64 166.86,21.19 C164.45,21.60 165.83,22.10 164.03,20.68 C163.02,19.89 162.27,18.69 161.30,17.83 C159.83,16.55 158.14,15.45 156.40,14.55 C151.85,12.19 146.65,10.48 141.56,9.64 C132.27,8.12 122.36,9.45 113.36,11.86 C108.89,13.07 104.38,14.59 100.22,16.61 C98.43,17.47 97.40,18.19 95.54,18.42 C92.62,18.77 90.14,18.75 87.36,20.00 C78.82,23.82 74.98,32.68 78.30,41.17 C78.97,42.88 79.87,44.38 81.12,45.75 C82.64,47.43 83.19,47.10 81.88,49.04 C79.92,51.93 78.27,55.01 76.93,58.21 C73.40,66.61 72.81,76.07 73.04,85.03 C73.12,88.17 73.25,91.34 73.75,94.45 C73.96,95.80 74.02,98.32 75.03,99.32 C75.54,99.83 76.27,100.11 77.00,99.91 C78.71,99.44 78.12,98.17 78.16,97.00 C78.36,91.12 78.09,85.91 79.49,80.10 C80.52,75.81 82.25,71.91 84.48,68.07 C87.32,63.18 90.38,58.89 94.28,54.71 C95.20,53.73 95.40,53.31 96.63,53.24 C97.57,53.19 98.93,53.82 99.83,54.04 C101.83,54.53 103.83,55.01 105.87,55.34 C109.61,55.94 113.31,55.98 117.09,55.87 C124.51,55.63 131.97,55.11 139.17,53.24 C143.95,52.00 148.19,49.77 152.77,48.14 C152.85,48.11 154.00,47.29 154.20,47.32 C154.48,47.37 156.18,49.15 156.47,49.37 C158.69,51.12 161.13,51.85 163.54,53.20 C166.50,54.87 163.63,52.48 165.26,54.56 C165.74,55.17 165.98,56.29 166.37,56.97 C167.58,59.16 169.27,61.07 171.30,62.60 C173.25,64.07 176.19,64.78 177.19,66.69 C177.96,68.17 178.22,70.18 178.84,71.75 C180.46,75.89 182.61,79.74 184.76,83.64 C186.49,86.78 188.39,89.52 188.58,93.11 C188.65,94.36 187.46,101.84 190.35,99.57 C190.78,99.23 191.71,95.41 191.90,94.76 C192.67,92.13 192.94,89.38 193.29,86.68 C193.99,81.30 194.21,76.18 193.76,70.76"
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
                <g id="Top/Short-Hair/Short-Curly" mask={`url(#${mask2})`}>
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
ShortHairShortCurly.optionValue = 'ShortHairShortCurly';
