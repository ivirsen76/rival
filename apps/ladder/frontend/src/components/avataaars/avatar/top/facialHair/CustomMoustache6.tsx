// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import Colors from './Colors';

export default class CustomMoustache6 extends React.Component {
    constructor() {
        super(...arguments);
        this.mask1 = uniqueId();
    }

    render() {
        const { mask1 } = this;

        return (
            <g>
                <defs>
                    <mask id={mask1} fill="white">
                        <path
                            d="M 75.64 101.18 C 79 100.92 82.25 145.33 85.46 153.86 C 88.67 162.38 106.1 173.31 113.69 176.57 C 121.52 179.93 124.89 171.79 132.72 171.79 C 140.03 171.79 142.86 180.36 153.01 176.09 C 163.32 171.75 174.97 158.9 177.56 152.51 C 180.17 146.11 183.95 100.19 187.63 100.31 C 191.3 100.44 190.91 138.31 187.28 159.14 C 185.39 169.92 180.69 179.22 160.92 187.89 C 151.23 192.12 137.63 197.59 132.99 197.59 C 123.4 197.59 121.56 196.04 106.23 189.69 C 84.58 180.29 78.36 174.8 75.25 157.91 C 72.35 142.1 72.27 101.45 75.64 101.18 Z"
                            transform="translate(1, -2)"
                        />
                    </mask>
                </defs>
                <Colors maskID={mask1} />
            </g>
        );
    }
}
CustomMoustache6.optionValue = 'CustomMoustache6';
