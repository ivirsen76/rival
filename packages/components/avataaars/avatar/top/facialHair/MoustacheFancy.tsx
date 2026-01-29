// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import Colors from './Colors';

export default class MoustacheFancy extends React.Component {
    constructor() {
        super(...arguments);
        this.mask1 = uniqueId('react-mask-');
        this.path1 = uniqueId('react-path-');
    }

    render() {
        const { mask1, path1 } = this;
        return (
            <g id="Facial-Hair/Moustache-Fancy" transform="translate(49.00, 72.00)">
                <defs>
                    <path
                        d="M84.00,69.29 C77.20,65.71 67.57,65.14 62.38,67.13 C56.61,69.33 51.50,75.58 42.63,72.82 C42.26,72.71 41.90,73.04 42.02,73.40 C43.39,77.91 51.02,81.00 53.62,81.10 C64.96,81.54 74.09,72.83 84.00,72.16 C93.90,72.83 103.03,81.54 114.37,81.10 C116.97,81.00 124.60,77.91 125.98,73.40 C126.09,73.04 125.73,72.71 125.36,72.82 C116.49,75.58 111.38,69.33 105.61,67.13 C100.42,65.14 90.79,65.71 84.00,69.29 Z"
                        id={path1}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <use id="Moustache-U-a-Question" fill="#28354B" fillRule="evenodd" xlinkHref={'#' + path1} />
                <Colors maskID={mask1} />
            </g>
        );
    }
}
MoustacheFancy.optionValue = 'MoustacheFancy';
