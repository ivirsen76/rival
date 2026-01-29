// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';

export default class Round extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.filter1 = uniqueId('react-filter-');
    }

    render() {
        const { path1, filter1 } = this;
        return (
            <g id="Top/_Resources/Round" fill="none" transform="translate(62.00, 85.00)">
                <defs>
                    <path
                        d="M80.46,16.39 C84.38,8.45 92.55,3 102,3 C110.91,3 118.70,7.86 122.83,15.08 C123.05,15.03 123.27,15 123.5,15 L131.5,15 C132.88,15 134,16.11 134,17.5 C134,18.88 132.88,20 131.5,20 L124.96,20 C125.63,22.21 126,24.56 126,27 C126,40.25 115.25,51 102,51 C88.74,51 78,40.25 78,27 C78,25.57 78.12,24.18 78.36,22.83 C78.27,18.45 74.91,15 70.86,15 C67.12,15 63.97,17.93 63.44,21.83 C63.80,23.49 64,25.22 64,27 C64,40.25 53.25,51 40,51 C26.74,51 16,40.25 16,27 C16,24.56 16.36,22.21 17.03,20 L10.5,20 C9.11,20 8,18.88 8,17.5 C8,16.11 9.11,15 10.5,15 L10.5,15 L18.5,15 C18.72,15 18.94,15.03 19.16,15.08 C23.29,7.86 31.08,3 40,3 C49.35,3 57.45,8.34 61.41,16.15 C63.49,13.03 66.94,11 70.86,11 C74.87,11 78.40,13.14 80.46,16.39 Z M40,47 C51.04,47 60,38.04 60,27 C60,15.95 51.04,7 40,7 C28.95,7 20,15.95 20,27 C20,38.04 28.95,47 40,47 Z M102,47 C113.04,47 122,38.04 122,27 C122,15.95 113.04,7 102,7 C90.95,7 82,15.95 82,27 C82,38.04 90.95,47 102,47 Z"
                        id={path1}
                    />
                    <filter
                        x="-0.8%"
                        y="-2.1%"
                        width="101.6%"
                        height="108.3%"
                        filterUnits="objectBoundingBox"
                        id={filter1}
                    >
                        <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
                        <feColorMatrix
                            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.1 0"
                            type="matrix"
                            in="shadowOffsetOuter1"
                        />
                    </filter>
                </defs>
                <g id="Lennon-Glasses">
                    <use fill="black" fillOpacity="1" filter={`url(#${filter1})`} xlinkHref={'#' + path1} />
                    <use fill="#252C2F" fillRule="evenodd" xlinkHref={'#' + path1} />
                </g>
            </g>
        );
    }
}
Round.optionValue = 'Round';
