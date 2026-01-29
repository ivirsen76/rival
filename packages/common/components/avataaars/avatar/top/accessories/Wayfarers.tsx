// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';

export default class Wayfarers extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.path2 = uniqueId('react-path-');
        this.filter1 = uniqueId('react-filter-');
        this.linearGradient1 = uniqueId('react-linear-gradient-');
    }

    render() {
        const { path1, path2, filter1, linearGradient1 } = this;
        return (
            <g id="Top/_Resources/Wayfarers" fill="none" transform="translate(62.00, 85.00)" strokeWidth="1">
                <defs>
                    <filter
                        x="-0.8%"
                        y="-2.4%"
                        width="101.6%"
                        height="109.8%"
                        filterUnits="objectBoundingBox"
                        id={filter1}
                    >
                        <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
                        <feColorMatrix
                            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.2 0"
                            type="matrix"
                            in="shadowOffsetOuter1"
                            result="shadowMatrixOuter1"
                        />
                        <feMerge>
                            <feMergeNode in="shadowMatrixOuter1" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id={linearGradient1}>
                        <stop stopColor="#FFFFFF" stopOpacity="0.5" offset="0%" />
                        <stop stopColor="#000000" stopOpacity="0.5" offset="70.50%" />
                    </linearGradient>
                    <path
                        d="M44.91,17.57 C44.91,27.27 36.66,35.14 22.92,35.14 L20.17,35.14 C6.42,35.14 0.92,27.27 0.92,17.57 L0.92,17.57 C0.92,7.86 2.20,0 21.45,0 L24.38,0 C43.63,0 44.91,7.86 44.91,17.57 L44.91,17.57 Z"
                        id={path1}
                    />
                    <path
                        d="M106.48,17.57 C106.48,27.27 98.23,35.14 84.48,35.14 L81.73,35.14 C67.99,35.14 62.49,27.27 62.49,17.57 L62.49,17.57 C62.49,7.86 63.77,0 83.02,0 L85.95,0 C105.199,0 106.48,7.86 106.48,17.57 L106.48,17.57 Z"
                        id={path2}
                    />
                </defs>
                <g id="Wayfarers" filter={`url(#${filter1})`} transform="translate(7.00, 7.00)">
                    <g id="Shades" transform="translate(10.79, 2.92)" fillRule="nonzero">
                        <g id="Shade">
                            <use fillOpacity="0.70" fill="#000000" fillRule="evenodd" xlinkHref={'#' + path1} />
                            <use
                                fill={`url(#${linearGradient1})`}
                                fillRule="evenodd"
                                style={{ mixBlendMode: 'screen' }}
                                xlinkHref={'#' + path1}
                            />
                        </g>
                        <g id="Shade">
                            <use fillOpacity="0.70" fill="#000000" fillRule="evenodd" xlinkHref={'#' + path2} />
                            <use
                                fill={`url(#${linearGradient1})`}
                                fillRule="evenodd"
                                style={{ mixBlendMode: 'screen' }}
                                xlinkHref={'#' + path2}
                            />
                        </g>
                    </g>
                    <path
                        d="M33.71,41 L30.96,41 C17.07,41 8.78,33.33 8.78,20.5 C8.78,10.127 10.59,0 32.25,0 L35.18,0 C56.83,0 58.64,10.127 58.64,20.5 C58.64,32.56 48.39,41 33.71,41 Z M32.25,5.85 C14.65,5.85 14.65,12.31 14.65,20.5 C14.65,27.18 17.47,35.14 30.96,35.14 L33.71,35.14 C44.94,35.14 52.78,29.12 52.78,20.5 C52.78,12.31 52.78,5.85 35.18,5.85 L32.25,5.85 Z"
                        id="Left"
                        fill="#252C2F"
                        fillRule="nonzero"
                    />
                    <path
                        d="M95.28,41 L92.53,41 C78.64,41 70.35,33.33 70.35,20.5 C70.35,10.127 72.16,0 93.81,0 L96.75,0 C118.40,0 120.21,10.127 120.21,20.5 C120.21,32.56 109.96,41 95.28,41 Z M93.81,5.85 C76.21,5.85 76.21,12.31 76.21,20.5 C76.21,27.18 79.05,35.14 92.53,35.14 L95.28,35.14 C106.51,35.14 114.34,29.12 114.34,20.5 C114.34,12.31 114.34,5.85 96.75,5.85 L93.81,5.85 Z"
                        id="Right"
                        fill="#252C2F"
                        fillRule="nonzero"
                    />
                    <path
                        d="M2.93,5.85 C3.61,5.17 11.12,0 32.25,0 C49.96,0 53.71,1.88 59.38,4.72 L59.80,4.93 C60.19,5.07 62.21,5.77 64.57,5.85 C66.72,5.75 68.56,5.16 69.10,4.96 C75.58,1.74 81.92,0 96.75,0 C117.87,0 125.38,5.17 126.06,5.85 C127.68,5.85 129,7.16 129,8.78 L129,11.71 C129,13.33 127.68,14.64 126.06,14.64 C126.06,14.64 120.20,14.64 120.20,17.57 C120.20,20.5 117.27,13.33 117.27,11.71 L117.27,8.86 C113.69,7.46 107.29,5.85 96.75,5.85 C84.99,5.85 79.14,6.98 74.12,9.10 L74.18,9.24 L71.68,10.25 L74.18,11.25 L71.98,16.68 L69.26,15.58 C69.02,15.49 68.49,15.31 67.77,15.13 C65.74,14.62 63.66,14.46 61.82,14.85 C61.14,14.99 60.52,15.20 59.94,15.49 L57.32,16.80 L54.70,11.56 L57.32,10.25 L57.33,10.25 L54.81,9.23 L54.89,9.03 C50.57,6.97 46.57,5.85 32.25,5.85 C21.70,5.85 15.30,7.46 11.72,8.86 L11.72,11.71 C11.72,13.33 8.79,20.5 8.79,17.57 C8.79,14.64 2.93,14.64 2.93,14.64 C1.31,14.64 0,13.33 0,11.71 L0,8.78 C0,7.16 1.31,5.85 2.93,5.85 Z"
                        id="Stuff"
                        fill="#252C2F"
                        fillRule="nonzero"
                    />
                </g>
            </g>
        );
    }
}
Wayfarers.optionValue = 'Wayfarers';
