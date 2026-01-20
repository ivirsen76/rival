import * as React from 'react';
import { uniqueId } from 'lodash';
import Colors from './Colors';

export default class CustomMoustache4 extends React.Component {
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
                        <path d="M 125.28 165.94 C 125.8 164.59 139.4 164.77 140.34 165.81 C 141.28 166.85 134.49 176.98 132.94 176.97 C 131.39 176.96 124.77 167.3 125.28 165.94 Z" />
                    </mask>
                </defs>
                <Colors maskID={mask1} />
            </g>
        );
    }
}
CustomMoustache4.optionValue = 'CustomMoustache4';
