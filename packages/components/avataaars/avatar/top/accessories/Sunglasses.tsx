// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';

export default class Sunglasses extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.path2 = uniqueId('react-path-');
        this.filter1 = uniqueId('react-filter-');
        this.linearGradient1 = uniqueId('react-linear-gradient-');
        this.linearGradient2 = uniqueId('react-linear-gradient-');
    }

    render() {
        const { path1, path2, filter1, linearGradient1, linearGradient2 } = this;
        return (
            <g id="Top/_Resources/Sunglasses" fill="none" transform="translate(62.00, 85.00)" strokeWidth="1">
                <defs>
                    <filter
                        x="-0.8%"
                        y="-2.6%"
                        width="101.6%"
                        height="110.5%"
                        filterUnits="objectBoundingBox"
                        id={filter1}
                    >
                        <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
                        <feColorMatrix
                            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.1 0"
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
                        d="M47.01,6.27 C49.52,6.30 50.70,6.72 51.13,9.39 C51.56,12.09 51.14,15.12 50.64,17.78 C49.88,21.84 48.61,25.82 45.66,28.79 C44.10,30.35 42.21,31.60 40.19,32.45 C39.12,32.90 37.99,33.23 36.85,33.47 C36.52,33.55 33.70,33.94 35.43,33.74 C31.39,34.21 27.01,34.19 23.63,31.57 C19.89,28.67 17.33,24.08 16.21,19.51 C15.55,16.83 14.16,10.43 16.69,8.29 C19.59,5.84 47.01,6.27 47.01,6.27 L47.01,6.27 Z"
                        id={path1}
                    />
                    <path
                        d="M78.91,6.27 C76.40,6.29 75.22,6.72 74.79,9.38 C74.36,12.08 74.78,15.12 75.28,17.78 C76.04,21.84 77.31,25.82 80.26,28.79 C81.82,30.35 83.71,31.60 85.73,32.45 C86.80,32.90 87.93,33.22 89.06,33.47 C89.40,33.54 92.22,33.94 90.49,33.74 C94.53,34.21 98.91,34.19 102.29,31.57 C106.03,28.67 108.59,24.08 109.71,19.51 C110.37,16.83 111.76,10.43 109.23,8.29 C106.33,5.84 78.91,6.27 78.91,6.27 L78.91,6.27 Z"
                        id={path2}
                    />
                    <linearGradient x1="50%" y1="0%" x2="50%" y2="70.50%" id={linearGradient1}>
                        <stop stopColor="#FFFFFF" stopOpacity="0.5" offset="0%" />
                        <stop stopColor="#000000" stopOpacity="0.5" offset="100%" />
                    </linearGradient>
                    <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id={linearGradient2}>
                        <stop stopColor="#FFFFFF" stopOpacity="0.5" offset="0%" />
                        <stop stopColor="#000000" stopOpacity="0.5" offset="70.50%" />
                    </linearGradient>
                </defs>
                <g id="Sunglasses" filter={`url(#${filter1})`} transform="translate(8.00, 8.00)">
                    <g id="shades">
                        <use fillOpacity="0.70" fill="#000000" xlinkHref={'#' + path1} />
                        <use
                            fill={`url(#${linearGradient1})`}
                            style={{ mixBlendMode: 'screen' }}
                            xlinkHref={'#' + path1}
                        />
                    </g>
                    <g id="shades">
                        <use fillOpacity="0.70" fill="#000000" xlinkHref={'#' + path2} />
                        <use
                            fill={`url(#${linearGradient2})`}
                            style={{ mixBlendMode: 'screen' }}
                            xlinkHref={'#' + path2}
                        />
                    </g>
                    <g id="Glasses" fill="#252C2F">
                        <path
                            d="M46.24,7.27 C48.62,7.29 49.74,7.69 50.14,10.16 C50.55,12.67 50.15,15.48 49.68,17.95 C48.96,21.72 47.76,25.41 44.97,28.16 C43.50,29.61 41.71,30.77 39.81,31.56 C38.79,31.98 37.72,32.28 36.66,32.51 C36.34,32.58 33.68,32.95 35.31,32.76 C31.50,33.19 27.36,33.18 24.17,30.75 C20.63,28.06 18.22,23.79 17.15,19.55 C16.53,17.07 15.22,11.13 17.61,9.14 C20.35,6.87 46.24,7.27 46.24,7.27 L46.24,7.27 Z M22.21,0.49 C16.77,0.67 13.14,1.63 10.46,7.06 C5.54,17.03 13.96,31.96 23.35,36.03 C34.32,40.79 46.59,35.53 52.39,26.00 C55.46,20.96 57.02,13.32 56.92,7.50 C56.79,0.07 51.60,-0.12 45.50,0.03 L22.21,0.49 Z"
                            id="Frame"
                        />
                        <path
                            d="M79.68,7.27 C77.30,7.29 76.18,7.68 75.78,10.16 C75.37,12.66 75.77,15.48 76.24,17.95 C76.96,21.72 78.16,25.41 80.95,28.16 C82.42,29.61 84.21,30.77 86.11,31.56 C87.13,31.98 88.19,32.28 89.26,32.51 C89.58,32.58 92.24,32.94 90.61,32.76 C94.42,33.19 98.56,33.17 101.75,30.74 C105.29,28.05 107.70,23.79 108.77,19.55 C109.39,17.07 110.70,11.13 108.31,9.14 C105.57,6.87 79.68,7.27 79.68,7.27 L79.68,7.27 Z M103.71,0.48 C109.15,0.67 112.78,1.63 115.46,7.06 C120.38,17.02 111.96,31.96 102.57,36.03 C91.60,40.79 79.33,35.52 73.53,26.00 C70.46,20.95 68.90,13.32 69.00,7.50 C69.13,0.07 74.32,-0.13 80.42,0.03 L103.71,0.48 Z"
                            id="Frame"
                        />
                        <path
                            d="M13.19,4.92 C9.78,5.11 5.88,5.16 2.69,6.63 C-0.69,8.20 -1.21,11.73 3.04,12.22 C4.97,12.44 6.89,12.08 8.78,11.74 C10.33,11.46 12.44,11.55 13.90,10.96 C16.63,9.86 16.46,4.74 13.19,4.92"
                            id="Frame"
                        />
                        <path
                            d="M112.73,4.92 C116.14,5.11 120.04,5.16 123.24,6.63 C126.62,8.20 127.14,11.73 122.88,12.22 C120.96,12.44 119.03,12.08 117.14,11.74 C115.59,11.46 113.48,11.55 112.02,10.96 C109.29,9.86 109.47,4.74 112.73,4.92"
                            id="Frame"
                        />
                        <path
                            d="M73.10,7.01 C71.16,4.71 66.09,3.38 62.89,3.38 C59.69,3.38 54.76,4.71 52.82,7.01 C51.84,8.17 51.80,9.72 53.50,10.45 C55.62,11.35 57.51,9.71 59.21,8.85 C61.38,7.75 64.71,7.87 66.71,8.85 C68.42,9.68 70.30,11.35 72.42,10.45 C74.12,9.72 74.09,8.17 73.10,7.01"
                            id="Frame"
                        />
                    </g>
                </g>
            </g>
        );
    }
}
Sunglasses.optionValue = 'Sunglasses';
