import * as React from 'react';
import { uniqueId } from 'lodash';
import Colors from './Colors';

export default class CustomMoustache3 extends React.Component {
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
                            d="M 132.27 138.5 C 128.4 138.44 119.73 137.1 113.48 138.77 C 105.53 140.89 102.84 150.08 101.99 158.71 C 101.14 167.34 105.57 175.04 110.36 179.47 C 115.14 183.9 123.18 187.37 132.04 187.37 C 140.89 187.37 151.65 183.47 155.86 179.29 C 160.06 175.12 162.67 171.91 162.34 159.59 C 162 147.26 156.44 140.98 151.93 139.16 C 147.42 137.35 136.14 138.56 132.27 138.5 Z"
                            fill="white"
                        />
                        <path
                            d="M 131.33 145.39 C 136.06 145.27 143.25 145.36 147.45 145.76 C 151.65 146.16 158.21 153.7 155.73 161.51 C 153.1 169.84 143.84 177.34 138.82 171.08 C 137.87 169.88 136.79 168.69 132.11 168.69 C 130.4 168.69 127.85 168.89 125.04 171.77 C 117.83 178.38 108.82 163.94 108.34 160.07 C 107.66 154.53 110.8 147.85 115.14 146.33 C 119.57 144.79 126.6 145.51 131.33 145.39 Z"
                            fill="black"
                        />
                    </mask>
                </defs>
                <Colors maskID={mask1} />
            </g>
        );
    }
}
CustomMoustache3.optionValue = 'CustomMoustache3';
