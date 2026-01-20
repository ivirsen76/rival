import * as React from 'react';
import { uniqueId } from 'lodash';
import Colors from './Colors';

export default class MoustacheMagnum extends React.Component {
    constructor() {
        super(...arguments);
        this.mask1 = uniqueId('react-mask-');
        this.path1 = uniqueId('react-path-');
    }

    render() {
        const { mask1, path1 } = this;
        return (
            <g id="Facial-Hair/Moustache-Magnum" transform="translate(49.00, 72.00)">
                <defs>
                    <path
                        d="M83.99,74.83 C83.45,75.60 82.76,76.24 81.94,76.68 C73.04,81.51 63.87,77.33 58.87,77.62 C56.45,77.77 53.34,79.41 52.21,77.67 C50.97,75.76 55.06,65.22 64.72,63.46 C71.73,62.18 81.49,63.60 83.99,66.93 C86.49,63.60 96.26,62.18 103.27,63.46 C112.92,65.22 117.01,75.76 115.78,77.67 C114.65,79.41 111.53,77.77 109.11,77.62 C104.11,77.33 94.94,81.51 86.04,76.68 C85.23,76.24 84.53,75.60 83.99,74.83 Z"
                        id={path1}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <use id="Hey..." fill="#28354B" fillRule="evenodd" xlinkHref={'#' + path1} />
                <Colors maskID={mask1} />
            </g>
        );
    }
}
MoustacheMagnum.optionValue = 'MoustacheMagnum';
