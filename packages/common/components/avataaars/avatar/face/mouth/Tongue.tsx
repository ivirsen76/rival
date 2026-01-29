// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';

export default class Tongue extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.mask1 = uniqueId('react-mask-');
    }

    render() {
        const { path1, mask1 } = this;
        return (
            <g id="Mouth/Tongue" transform="translate(2.00, 52.00)">
                <defs>
                    <path
                        d="M29,15.60 C30.41,25.23 41.06,33 54,33 C66.96,33 77.64,25.18 79,14.73 C79.10,14.33 78.77,13 76.82,13 C56.83,13 41.73,13 31.17,13 C29.38,13 28.87,14.24 29,15.60 Z"
                        id={path1}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <use id="Mouth" fillOpacity="0.69" fill="#000000" fillRule="evenodd" xlinkHref={'#' + path1} />
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
                <path
                    d="M65.98,23.74 C65.99,23.82 66,23.91 66,24 L66,33 C66,39.07 61.07,44 55,44 L54,44 C47.92,44 43,39.07 43,33 L43,24 L43,24 C43,23.91 43.00,23.82 43.01,23.74 C43.00,23.66 43,23.58 43,23.5 C43,21.56 45.91,20 49.5,20 C51.51,20 53.30,20.49 54.5,21.26 C55.69,20.49 57.48,20 59.5,20 C63.08,20 66,21.56 66,23.5 C66,23.58 65.99,23.66 65.98,23.74 Z"
                    id="Tongue"
                    fill="#FF4F6D"
                    fillRule="evenodd"
                />
            </g>
        );
    }
}
Tongue.optionValue = 'Tongue';
