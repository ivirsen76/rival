// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';

export default class Concerned extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.mask1 = uniqueId('react-mask-');
    }

    render() {
        const { path1, mask1 } = this;
        return (
            <g id="Mouth/Concerned" transform="translate(2.00, 52.00)">
                <defs>
                    <path
                        d="M35.11,15.12 C36.17,24.61 44.22,32 54,32 C63.80,32 71.87,24.57 72.89,15.04 C72.97,14.27 72.11,13 71.04,13 C56.14,13 44.73,13 37.08,13 C36.00,13 35.01,14.17 35.11,15.12 Z"
                        id={path1}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use
                        xlinkHref={'#' + path1}
                        transform="translate(54.00, 22.50) scale(1, -1) translate(-54.00, -22.50) "
                    />
                </mask>
                <use
                    id="Mouth"
                    fillOpacity="0.69"
                    fill="#000000"
                    fillRule="evenodd"
                    transform="translate(54.00, 22.50) scale(1, -1) translate(-54.00, -22.50) "
                    xlinkHref={'#' + path1}
                />
                <rect
                    id="Teeth"
                    fill="#FFFFFF"
                    fillRule="evenodd"
                    mask={`url(#${mask1})`}
                    x="39"
                    y="2"
                    width="31"
                    height="16"
                    rx="5"
                />
                <g id="Tongue" strokeWidth="1" fillRule="evenodd" mask={`url(#${mask1})`} fill="#FF4F6D">
                    <g transform="translate(38.00, 24.00)">
                        <circle id="friend?" cx="11" cy="11" r="11" />
                        <circle id="How-you-doing" cx="21" cy="11" r="11" />
                    </g>
                </g>
            </g>
        );
    }
}
Concerned.optionValue = 'Concerned';
