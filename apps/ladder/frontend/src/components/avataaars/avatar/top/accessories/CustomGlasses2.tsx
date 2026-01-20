import * as React from 'react';

export default class CustomGlasses2 extends React.Component {
    constructor() {
        super(...arguments);
    }

    render() {
        return (
            <g fill="#ebe5d9">
                <ellipse
                    style={{ stroke: 'rgba(0, 0, 0, 0.1)', fill: 'none', strokeWidth: '5px' }}
                    cx="99.75"
                    cy="112.33"
                    rx="25.12"
                    ry="23.16"
                />
                <ellipse
                    style={{ stroke: 'rgba(0, 0, 0, 0.1)', fill: 'none', strokeWidth: '5px' }}
                    cx="163.94"
                    cy="112.33"
                    rx="25.12"
                    ry="23.16"
                />

                <ellipse
                    style={{ stroke: '#ebe5d9', fill: 'rgba(75, 40, 0, 0.85)', strokeWidth: '5px' }}
                    cx="99.75"
                    cy="108.33"
                    rx="25.12"
                    ry="23.16"
                />
                <ellipse
                    style={{ stroke: '#ebe5d9', fill: 'rgba(75, 40, 0, 0.85)', strokeWidth: '5px' }}
                    cx="163.94"
                    cy="108.33"
                    rx="25.12"
                    ry="23.16"
                />
                <path d="M 141.91 100.42 C 141.93 100.48 138.75 100.77 138.21 100.23 C 137.67 99.69 137.82 97.95 137.05 97.18 C 136.27 96.4 127.24 96.59 126.65 97.18 C 126.06 97.77 125.65 100.04 125.22 100.48 C 124.79 100.9 122.34 100.9 122.33 100.83 L 123.68 113.79 C 123.68 113.79 126.38 104.1 126.97 103.5 C 127.57 102.9 136.2 103.1 136.91 103.39 C 137.62 103.69 140.24 114.47 140.24 114.47 L 141.91 100.42 Z" />
                <path d="M 191.22 106.58 C 191.22 106.58 196.5 107.07 197.28 106.29 C 198.06 105.52 198.31 102.39 197.44 101.65 C 196.57 100.92 190.64 101.63 190.64 101.63 L 191.22 106.58 Z" />
                <path d="M 73.13 106.58 C 73.13 106.58 67.85 107.07 67.07 106.29 C 66.3 105.51 66.05 102.39 66.91 101.65 C 67.78 100.91 73.71 101.62 73.71 101.62 L 73.13 106.58 Z" />
            </g>
        );
    }
}
CustomGlasses2.optionValue = 'CustomGlasses2';
