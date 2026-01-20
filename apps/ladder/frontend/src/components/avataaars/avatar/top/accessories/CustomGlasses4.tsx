import * as React from 'react';
import { uniqueId } from 'lodash';

export default class CustomGlasses4 extends React.Component {
    constructor() {
        super(...arguments);
        this.gradient1 = uniqueId();
    }

    render() {
        const { gradient1 } = this;

        return (
            <g transform="translate(1, 0)">
                <defs>
                    <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id={gradient1}>
                        <stop stopColor="#000" stopOpacity="0.9" offset="0%" />
                        <stop stopColor="#666" stopOpacity="0.8" offset="70.50%" />
                    </linearGradient>
                </defs>

                <g transform="matrix(0.691948, 0, 0, 0.691948, 38.792244, -2.014983)" fill={`url(#${gradient1})`}>
                    <path d="M 56.41 139.97 C 64.95 134.25 94.28 133.48 105.39 135.11 C 123.56 137.9 126.12 147.3 125.63 151.1 C 123.39 173.79 110.36 189.87 97.5 198.27 C 88.29 203.84 67.24 207.5 56.4 191.38 C 48.12 179.08 42.12 148.47 56.41 139.97 Z" />
                    <path d="M 212.07 139.97 C 203.53 134.25 174.2 133.48 163.09 135.11 C 144.92 137.9 142.36 147.3 142.85 151.1 C 145.09 173.79 158.12 189.87 170.98 198.27 C 180.19 203.84 201.24 207.5 212.08 191.38 C 220.36 179.08 226.36 148.47 212.07 139.97 Z" />
                </g>
                <g
                    transform="matrix(0.691948, 0, 0, 0.691948, 38.792244, -2.014983), translate(0, 1)"
                    strokeWidth="4"
                    stroke="#333"
                >
                    <path d="M 94.26 135.2 L 179.27 135.2" />
                    <path d="M 124.98 149.09 C 130.79 147.18 137.75 147.37 143.41 148.88" />
                </g>
            </g>
        );
    }
}
CustomGlasses4.optionValue = 'CustomGlasses4';
