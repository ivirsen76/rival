// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';

export default class Prescription02 extends React.Component {
    constructor() {
        super(...arguments);
        this.filter1 = uniqueId('react-filter-');
    }

    render() {
        const { filter1 } = this;
        return (
            <g id="Top/_Resources/Prescription-02" fill="none" transform="translate(62.00, 85.00)" strokeWidth="1">
                <defs>
                    <filter
                        x="-0.8%"
                        y="-2.4%"
                        width="101.5%"
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
                </defs>
                <g id="Wayfarers" filter={`url(#${filter1})`} transform="translate(6.00, 7.00)" fill="#252C2F">
                    <path
                        d="M34,41 L31.24,41 C17.31,41 9,33.33 9,20.5 C9,10.127 10.81,0 32.52,0 L35.47,0 C57.18,0 59,10.127 59,20.5 C59,32.56 48.72,41 34,41 Z M32.38,6 C13,6 13,12.84 13,21.50 C13,28.57 16.11,37 30.97,37 L34,37 C46.36,37 55,30.62 55,21.50 C55,12.84 55,6 35.61,6 L32.38,6 Z"
                        id="Left"
                        fillRule="nonzero"
                    />
                    <path
                        d="M96,41 L93.24,41 C79.31,41 71,33.33 71,20.5 C71,10.127 72.81,0 94.52,0 L97.47,0 C119.18,0 121,10.127 121,20.5 C121,32.56 110.72,41 96,41 Z M94.38,6 C75,6 75,12.84 75,21.50 C75,28.57 78.11,37 92.97,37 L96,37 C108.36,37 117,30.62 117,21.50 C117,12.84 117,6 97.61,6 L94.38,6 Z"
                        id="Right"
                        fillRule="nonzero"
                    />
                    <path
                        d="M2.95,5.77 C3.64,5.09 11.20,0 32.5,0 C50.35,0 54.13,1.85 59.85,4.65 L60.26,4.85 C60.66,4.99 62.70,5.68 65.07,5.76 C67.24,5.67 69.10,5.08 69.64,4.89 C76.17,1.72 82.56,0 97.5,0 C118.79,0 126.35,5.09 127.04,5.77 C128.67,5.77 130,7.06 130,8.65 L130,11.54 C130,13.13 128.67,14.42 127.04,14.42 C127.04,14.42 120.14,14.42 120.14,17.31 C120.14,20.20 118.18,13.13 118.18,11.54 L118.18,8.73 C114.57,7.35 108.12,4.78 97.5,4.78 C85.65,4.78 79.76,6.88 74.70,8.97 L74.75,9.10 L74.75,11.09 L72.53,16.44 L69.80,15.36 C69.55,15.26 69.02,15.09 68.29,14.90 C66.25,14.40 64.15,14.25 62.30,14.63 C61.62,14.77 60.99,14.98 60.41,15.26 L57.77,16.55 L55.12,11.39 L55.24,9.10 L55.32,8.90 C50.96,6.87 46.93,4.78 32.5,4.78 C21.87,4.78 15.42,7.35 11.81,8.73 L11.81,11.54 C11.81,13.13 8.86,20.20 8.86,17.31 C8.86,14.42 2.95,14.42 2.95,14.42 C1.32,14.42 0,13.13 0,11.54 L0,8.65 C0,7.06 1.32,5.77 2.95,5.77 Z"
                        id="Stuff"
                        fillRule="nonzero"
                    />
                </g>
            </g>
        );
    }
}
Prescription02.optionValue = 'Prescription02';
