// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import Colors from './Colors';

export default class Overall extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.mask1 = uniqueId('react-mask-');
    }

    render() {
        const { path1, mask1 } = this;
        return (
            <g id="Clothing/Overall" transform="translate(0.00, 170.00)">
                <defs>
                    <path
                        d="M94,29.68 L94,74 L170,74 L170,29.68 C179.36,30.98 188.14,34.09 196.00,38.63 L196,110 L187,110 L77,110 L68,110 L68,38.63 C75.85,34.09 84.63,30.98 94,29.68 Z"
                        id={path1}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <Colors maskID={mask1} />
                <circle id="Button" fill="#F4F4F4" fillRule="evenodd" cx="81" cy="83" r="5" />
                <circle id="Button" fill="#F4F4F4" fillRule="evenodd" cx="183" cy="83" r="5" />
            </g>
        );
    }
}
Overall.optionValue = 'Overall';
