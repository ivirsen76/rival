import * as React from 'react';
import { uniqueId } from 'lodash';
import Colors from './Colors';

export default class ShirtScoopNeck extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.mask1 = uniqueId('react-mask-');
    }

    render() {
        const { path1, mask1 } = this;
        return (
            <g id="Clothing/Shirt-Scoop-Neck" transform="translate(0.00, 170.00)">
                <defs>
                    <path
                        d="M181.54,32.33 C210.78,41.48 232,68.79 232,101.05 L232,110 L32,110 L32,101.05 C32,68.39 53.73,40.81 83.53,32.00 C83.18,33.42 83,34.87 83,36.34 C83,52.62 105.16,65.82 132.5,65.82 C159.83,65.82 182,52.62 182,36.34 C182,34.98 181.84,33.64 181.54,32.33 Z"
                        id={path1}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <Colors maskID={mask1} />
            </g>
        );
    }
}
ShirtScoopNeck.optionValue = 'ShirtScoopNeck';
