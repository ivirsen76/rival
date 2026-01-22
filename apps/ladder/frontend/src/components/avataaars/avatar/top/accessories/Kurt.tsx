// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';

export default class Kurt extends React.Component {
    constructor() {
        super(...arguments);
        this.filter1 = uniqueId('react-filter-');
    }

    render() {
        const { filter1 } = this;
        return (
            <g id="Top/_Resources/Kurt" fill="none" transform="translate(62.00, 85.00)" strokeWidth="1">
                <defs>
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
                <g id="Kurts" filter={`url(#${filter1})`} transform="translate(5.00, 2.00)">
                    <path
                        d="M66,11.11 C54.96,11.11 53.37,2.02 30.67,0.74 C7.98,-0.28 0.81,6.44 0.77,11.11 C0.81,15.40 -0.35,26.56 14.36,39.62 C29.13,55.14 44.27,49.88 49.69,44.81 C55.13,42.47 61.34,21.45 66,21.48 C70.65,21.50 76.86,42.47 82.30,44.81 C87.72,49.88 102.86,55.14 117.63,39.62 C132.35,26.56 131.18,15.40 131.22,11.11 C131.18,6.44 124.01,-0.28 101.32,0.74 C78.62,2.02 77.03,11.11 66,11.11 Z"
                        id="It!"
                        fill="#F4F4F4"
                        fillRule="nonzero"
                    />
                    <path
                        d="M55.12,21.48 C55.51,13.82 42.21,5.64 27.95,5.92 C13.69,6.22 11.84,15.37 11.64,18.88 C11.29,27.02 20.01,45.30 36.10,44.81 C52.19,44.30 54.90,26.53 55.12,21.48 Z"
                        id="Did"
                        fill="#2F383B"
                        fillRule="nonzero"
                    />
                    <path
                        d="M120.35,21.48 C120.73,13.82 107.43,5.64 93.17,5.92 C78.92,6.22 77.06,15.37 76.87,18.88 C76.52,27.02 85.23,45.30 101.32,44.81 C117.42,44.30 120.13,26.53 120.35,21.48 Z"
                        id="Courtney"
                        fill="#2F383B"
                        fillRule="nonzero"
                        transform="translate(98.61, 25.37) scale(-1, 1) translate(-98.61, -25.37) "
                    />
                </g>
            </g>
        );
    }
}
Kurt.optionValue = 'Kurt';
