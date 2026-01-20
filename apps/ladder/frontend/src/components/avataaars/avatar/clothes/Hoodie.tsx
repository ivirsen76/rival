import * as React from 'react';
import { uniqueId } from 'lodash';
import Colors from './Colors';

export default class Hoodie extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.mask1 = uniqueId('react-mask-');
    }

    render() {
        const { path1, mask1 } = this;
        return (
            <g id="Clothing/Hoodie" transform="translate(0.00, 170.00)">
                <defs>
                    <path
                        d="M108,13.07 C90.08,15.07 76.27,20.55 76.00,34.64 C50.14,45.56 32,71.16 32,100.99 L32,100.99 L32,110 L232,110 L232,100.99 C232,71.16 213.85,45.56 187.99,34.64 C187.72,20.55 173.91,15.07 156,13.07 L156,32 L156,32 C156,45.25 145.25,56 132,56 L132,56 C118.74,56 108,45.25 108,32 L108,13.07 Z"
                        id={path1}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <Colors maskID={mask1} />
                <path
                    d="M102,61.73 L102,110 L95,110 L95,58.15 C97.20,59.46 99.54,60.66 102,61.73 Z M169,58.15 L169,98.5 C169,100.43 167.43,102 165.5,102 C163.56,102 162,100.43 162,98.5 L162,61.73 C164.45,60.66 166.79,59.46 169,58.15 Z"
                    id="Straps"
                    fill="#F4F4F4"
                    fillRule="evenodd"
                    mask={`url(#${mask1})`}
                />
                <path
                    d="M90.96,12.72 C75.90,15.57 65.5,21.24 65.5,32.30 C65.5,52.02 98.53,68 132,68 C165.46,68 198.5,52.02 198.5,32.30 C198.5,21.24 188.09,15.57 173.03,12.72 C182.12,16.07 188,21.70 188,31.07 C188,51.46 160.17,68 132,68 C103.82,68 76,51.46 76,31.07 C76,21.70 81.87,16.07 90.96,12.72 Z"
                    id="Shadow"
                    fillOpacity="0.16"
                    fill="#000000"
                    fillRule="evenodd"
                    mask={`url(#${mask1})`}
                />
            </g>
        );
    }
}
Hoodie.optionValue = 'Hoodie';
