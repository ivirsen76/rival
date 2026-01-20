import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';
import Skin from '../Skin';

export default class CustomHair7 extends React.Component {
    constructor() {
        super(...arguments);
        this.gradient1 = uniqueId();
        this.mask1 = uniqueId();
        this.mask2 = uniqueId();
        this.mask3 = uniqueId();
        this.path1 = uniqueId();
    }

    render() {
        const { gradient1, mask1, mask2, mask3, path1 } = this;

        return (
            <g>
                <defs>
                    <linearGradient id={gradient1}>
                        <stop offset="0%" stopColor="#444" />
                        <stop offset="40%" stopColor="#000" />
                        <stop offset="60%" stopColor="#000" />
                        <stop offset="100%" stopColor="#444" />
                    </linearGradient>
                    <path
                        d="M 76.78 87.6 C 112.28 80.55 153.08 79.43 188.07 88.43 C 188.91 77.07 185.62 60.87 179.52 53.85 C 144.36 46.34 119.28 48.5 85.58 53.24 C 79.8 60.58 77.46 76.26 76.78 87.6 Z"
                        id={path1}
                    />
                    <mask id={mask1}>
                        <use xlinkHref={'#' + path1} fill="white" />
                    </mask>
                    <mask id={mask2}>
                        <use xlinkHref={'#' + path1} fill={`url(#${gradient1})`} />
                    </mask>
                    <mask id={mask3}>
                        <path
                            d="M 84.73 54.24 C 84.73 54.24 100.07 31.59 133.85 31.59 C 167.63 31.59 179.87 54.88 179.77 54.87 L 84.73 54.24 Z"
                            fill="white"
                        />
                    </mask>
                </defs>
                <g transform="translate(-1, 0)">
                    <FacialHair />
                    <Skin maskID={mask3} />
                    <HairColor maskID={mask1} />
                    <rect x="0" y="0" width="100%" height="100%" fill="black" mask={`url(#${mask2})`} />

                    <path
                        transform="translate(2, 21)"
                        fill="#fff"
                        d="M125.5 52.68a.8.8 0 0 1-1.09.01l-1.32-1.32a.8.8 0 0 1-.22-.55c0-.24.1-.45.26-.6a8.62 8.62 0 0 0 2.1-5.84 8.6 8.6 0 0 0-2.21-5.96.8.8 0 0 1-.17-.48c0-.2.08-.4.22-.53l.03-.04.02-.02 1.27-1.28a.78.78 0 0 1 1.14.04 13.06 13.06 0 0 1 3.11 8.27c0 3.07-1.25 6.13-3.14 8.3Zm11.72-16.57a.79.79 0 0 1 1.14-.04l1.28 1.28.02.02.04.04a.78.78 0 0 1 .04 1.02 8.62 8.62 0 0 0-2.2 5.95c0 2.34.72 4.23 2.09 5.83.15.16.27.37.27.6a.8.8 0 0 1-.23.56l-1.32 1.32a.79.79 0 0 1-1.09 0v-.01a12.98 12.98 0 0 1-3.14-8.3c0-3.04 1.24-6.1 3.1-8.27Zm-3.7 11.9c.2.8.52 1.57.88 2.3.14.3-.13.64-.44.56a9.44 9.44 0 0 0-2.56-.34h-.07c-.9 0-1.74.12-2.52.34-.3.08-.58-.27-.44-.56.36-.73.68-1.5.88-2.3.16-.68.34-.78.93-.84.4-.03.8-.06 1.2-.06h.03c.4 0 .79.03 1.18.06.6.06.77.16.94.84Zm-.93-6.43c-.39.03-.78.06-1.18.06h-.04c-.4 0-.8-.02-1.19-.06-.59-.06-.77-.16-.94-.84-.2-.8-.5-1.57-.87-2.3-.14-.3.13-.64.44-.55a9.4 9.4 0 0 0 2.52.33h.07c.92 0 1.77-.11 2.56-.34.3-.08.58.27.44.56-.36.73-.68 1.5-.87 2.3-.17.68-.35.78-.94.84Z"
                    />

                    {this.props.children}
                </g>
            </g>
        );
    }
}
CustomHair7.optionValue = 'CustomHair7';
