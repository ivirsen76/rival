// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class CustomHair3 extends React.Component {
    constructor() {
        super(...arguments);
        this.mask1 = uniqueId();
    }

    render() {
        const { mask1 } = this;

        return (
            <g>
                <defs>
                    <mask id={mask1}>
                        <path
                            d="M 75.789 101.751 C 73.085 101.86 68.15 53.44 86.967 38.23 C 95.356 31.449 95.837 27.279 98.761 27.279 C 101.685 27.279 97.961 32.684 100.906 32.684 C 103.851 32.684 110.961 17.669 114.893 17.712 C 117.649 17.742 114.375 22.383 117.489 22.276 C 124.136 22.048 127.848 3.51 132.03 3.51 C 136.212 3.51 141.666 22.312 147.997 22.54 C 150.908 22.645 148.612 17.481 151.245 17.481 C 153.878 17.481 163.711 34.722 166.089 34.722 C 168.467 34.722 165.648 29.562 168.423 29.562 C 171.198 29.562 174.153 35.515 181.644 43.006 C 192.467 53.829 190.145 100.608 187.331 100.7 C 184.399 100.796 185.249 72.949 176.3 62.695 C 164.269 48.397 149.222 47.941 131.319 48.111 C 112.518 48.289 95.224 48.946 84.993 67.114 C 76.395 82.382 78.613 101.637 75.789 101.751 Z"
                            fill="white"
                        />
                    </mask>
                </defs>
                <g transform="translate(-1.00, 0.00)">
                    <FacialHair />
                    <HairColor maskID={mask1} />
                    {this.props.children}
                </g>
            </g>
        );
    }
}
CustomHair3.optionValue = 'CustomHair3';
