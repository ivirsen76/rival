// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';

export default class BlazerShirt extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.mask1 = uniqueId('react-mask-');
    }

    render() {
        const { path1, mask1 } = this;
        return (
            <g id="Clothing/Blazer-+-Shirt" transform="translate(0.00, 170.00)">
                <defs>
                    <path
                        d="M133.96,0.29 C170.93,3.32 200,34.29 200,72.05 L200,81 L0,81 L0,72.05 C1.22e-14,33.95 29.59,2.76 67.04,0.21 C67.01,0.59 67,0.96 67,1.34 C67,13.21 81.99,22.82 100.5,22.82 C119.00,22.82 134,13.21 134,1.34 C134,0.99 133.98,0.64 133.96,0.29 Z"
                        id={path1}
                    />
                </defs>
                <g id="Shirt" transform="translate(32.00, 29.00)">
                    <mask id={mask1} fill="white">
                        <use xlinkHref={'#' + path1} />
                    </mask>
                    <use id="Clothes" fill="#E6E6E6" xlinkHref={'#' + path1} />
                    <g id="Color/Palette/Black" mask={`url(#${mask1})`} fill="#262E33">
                        <g transform="translate(-32.00, -29.00)" id="🖍Color">
                            <rect x="0" y="0" width="264" height="110" />
                        </g>
                    </g>
                    <g id="Shadowy" opacity="0.59" mask={`url(#${mask1})`} fillOpacity="0.16" fill="#000000">
                        <g transform="translate(60.00, -25.00)" id="Hola-👋🏼">
                            <ellipse cx="40.5" cy="27.84" rx="39.63" ry="26.91" />
                        </g>
                    </g>
                </g>
                <g id="Blazer" transform="translate(32.00, 28.00)">
                    <path
                        d="M68.78,1.12 C30.51,2.80 -1.89e-14,34.36 -1.42e-14,73.05 L0,73.05 L0,82 L69.36,82 C65.96,69.91 64,55.70 64,40.5 C64,26.17 65.73,12.73 68.78,1.12 Z M131.63,82 L200,82 L200,73.05 C200,34.70 170.02,3.36 132.22,1.17 C135.26,12.77 137,26.19 137,40.5 C137,55.70 135.03,69.91 131.63,82 Z"
                        id="Saco"
                        fill="#3A4C5A"
                    />
                    <path
                        d="M149,58 L158.55,50.83 L158.55,50.83 C159.99,49.75 161.98,49.76 163.41,50.87 L170,56 L149,58 Z"
                        id="Pocket-hanky"
                        fill="#E6E6E6"
                    />
                    <path
                        d="M69,1.13e-13 C65,19.33 66.66,46.66 74,82 L58,82 L44,46 L50,37 L44,31 L63,1 C65.02,0.36 67.02,0.03 69,1.13e-13 Z"
                        id="Wing"
                        fill="#2F4351"
                    />
                    <path
                        d="M151,1.13e-13 C147,19.33 148.66,46.66 156,82 L140,82 L126,46 L132,37 L126,31 L145,1 C147.02,0.36 149.02,0.03 151,1.13e-13 Z"
                        id="Wing"
                        fill="#2F4351"
                        transform="translate(141.00, 41.00) scale(-1, 1) translate(-141.00, -41.00) "
                    />
                </g>
            </g>
        );
    }
}
BlazerShirt.optionValue = 'BlazerShirt';
