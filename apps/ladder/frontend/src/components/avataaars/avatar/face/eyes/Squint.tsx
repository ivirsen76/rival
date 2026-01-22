// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';

export default class Squint extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.path2 = uniqueId('react-path-');
        this.mask1 = uniqueId('react-mask-');
        this.mask2 = uniqueId('react-mask-');
    }

    render() {
        const { path1, path2, mask1, mask2 } = this;
        return (
            <g id="Eyes/Squint-😊" transform="translate(0.00, 8.00)">
                <defs>
                    <path
                        d="M14,14.04 C23.60,14.04 28,18.49 28,11.56 C28,4.62 21.73,0 14,0 C6.26,0 0,4.62 0,11.56 C0,18.49 4.39,14.04 14,14.04 Z"
                        id={path1}
                    />
                    <path
                        d="M14,14.04 C23.60,14.04 28,18.49 28,11.56 C28,4.62 21.73,0 14,0 C6.26,0 0,4.62 0,11.56 C0,18.49 4.39,14.04 14,14.04 Z"
                        id={path2}
                    />
                </defs>
                <g id="Eye" transform="translate(16.00, 13.00)">
                    <mask id={mask1} fill="white">
                        <use xlinkHref={'#' + path1} />
                    </mask>
                    <use id="The-white-stuff" fill="#FFFFFF" xlinkHref={'#' + path1} />
                    <circle fillOpacity="0.69" fill="#000000" mask={`url(#${mask1})`} cx="14" cy="10" r="6" />
                </g>
                <g id="Eye" transform="translate(68.00, 13.00)">
                    <mask id={mask2} fill="white">
                        <use xlinkHref={'#' + path2} />
                    </mask>
                    <use id="Eyeball-Mask" fill="#FFFFFF" xlinkHref={'#' + path2} />
                    <circle fillOpacity="0.69" fill="#000000" mask={`url(#${mask2})`} cx="14" cy="10" r="6" />
                </g>
            </g>
        );
    }
}
Squint.optionValue = 'Squint';
