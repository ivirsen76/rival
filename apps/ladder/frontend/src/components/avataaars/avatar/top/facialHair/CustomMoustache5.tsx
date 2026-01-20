import * as React from 'react';
import { uniqueId } from 'lodash';
import Colors from './Colors';

export default class CustomMoustache5 extends React.Component {
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
                            d="M 113.26 172.57 C 115.14 170.69 123.74 175.48 132.54 175.59 C 140.96 175.7 149.6 171.04 151.45 172.57 C 155.24 175.7 147.66 192.33 141.68 196.55 C 135.7 200.77 128.56 200.14 123.6 196.56 C 118.64 192.98 109.39 175.72 113.26 172.57 Z"
                            transform="translate(1, 0)"
                        />
                    </mask>
                </defs>
                <Colors maskID={mask1} />
            </g>
        );
    }
}
CustomMoustache5.optionValue = 'CustomMoustache5';
