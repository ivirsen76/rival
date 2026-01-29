// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import Colors from './Colors';

export default class CustomMoustache2 extends React.Component {
    constructor() {
        super(...arguments);
        this.mask1 = uniqueId('react-mask-');
    }

    render() {
        const { mask1 } = this;

        return (
            <g>
                <defs>
                    <mask id={mask1} fill="white">
                        <path d="M 163.35 160.93 C 164.21 162.2 178.7 160.06 180.41 158.83 C 182.11 157.6 187.76 145.79 188.32 136.84 C 188.61 132.03 188.64 120.09 188.94 110.08 C 189.2 101.47 189.89 94.29 188.49 94.29 C 185.8 94.29 185.4 104.11 183.97 114.41 C 182.4 125.62 180.38 137.95 178.66 142.12 C 175.34 150.12 162.49 159.67 163.35 160.93 Z" />
                        <path d="M 100.73 160.93 C 99.87 162.2 85.38 160.06 83.67 158.83 C 81.97 157.6 76.32 145.79 75.76 136.84 C 75.47 132.03 75.44 120.09 75.14 110.08 C 74.88 101.47 74.19 94.29 75.59 94.29 C 78.28 94.29 78.68 104.11 80.11 114.41 C 81.68 125.62 83.7 137.95 85.42 142.12 C 88.74 150.12 101.59 159.67 100.73 160.93 Z" />
                    </mask>
                </defs>
                <Colors maskID={mask1} />
            </g>
        );
    }
}
CustomMoustache2.optionValue = 'CustomMoustache2';
