import * as React from 'react';
import { uniqueId } from 'lodash';
import Colors from './Colors';
import Graphics from './Graphics';

export default class GraphicShirt extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.mask1 = uniqueId('react-mask-');
    }

    render() {
        const { path1, mask1 } = this;
        return (
            <g id="Clothing/Graphic-Shirt" transform="translate(0.00, 170.00)">
                <defs>
                    <path
                        d="M165.62,29.26 C202.76,32.13 232,63.17 232,101.05 L232,110 L32,110 L32,101.05 C32,62.83 61.77,31.57 99.39,29.19 C99.13,30.27 99,31.37 99,32.5 C99,44.37 113.99,54 132.5,54 C151.00,54 166,44.37 166,32.5 C166,31.40 165.87,30.32 165.62,29.26 Z"
                        id={path1}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <use id="Clothes" fill="#E6E6E6" fillRule="evenodd" xlinkHref={'#' + path1} />
                <Colors maskID={mask1} />
                <Graphics maskID={mask1} />
            </g>
        );
    }
}
GraphicShirt.optionValue = 'GraphicShirt';
