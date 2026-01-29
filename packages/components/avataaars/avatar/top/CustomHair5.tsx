// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class CustomHair5 extends React.Component {
    constructor() {
        super(...arguments);
        this.gradient1 = uniqueId();
        this.mask1 = uniqueId();
        this.mask2 = uniqueId();
        this.mask3 = uniqueId();
        this.mask4 = uniqueId();
        this.path1 = uniqueId();
        this.path2 = uniqueId();
    }

    render() {
        const { gradient1, mask1, mask2, mask3, mask4, path1, path2 } = this;

        return (
            <g>
                <defs>
                    <linearGradient id={gradient1} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#000" />
                        <stop offset="100%" stopColor="#666" />
                    </linearGradient>
                    <path
                        d="M 110.19 62.47 C 101.43 64.42 79.35 75.78 73.06 83.34 C 73.13 78.16 74.03 62.42 78.71 51.42 C 83.39 40.42 97.52 25.55 131.37 25.55 C 165.21 25.55 179.18 43.19 182.45 52.94 C 185.72 62.69 187.57 78.91 187.19 84.62 C 182.59 78.61 170.97 69.85 157.83 64.21 C 144.69 58.57 118.95 60.52 110.19 62.47 Z"
                        id={path1}
                    />
                    <path
                        d="M 76.27 96.11 C 81.07 98.12 86.16 85.31 103.48 79.07 C 120.8 72.82 140.09 71.59 158.26 80.01 C 176.44 88.43 178.36 99.71 183.51 97.77 C 188.66 95.83 186.76 89.03 187.01 84.3 C 184.33 81.21 168.95 59.88 130.93 60.01 C 92.91 60.13 76.7 79.96 73.11 82.99 C 73.4 87.66 71.47 94.1 76.27 96.11 Z"
                        id={path2}
                    />
                    <mask id={mask1}>
                        <use xlinkHref={`#${path1}`} fill="white" />
                    </mask>
                    <mask id={mask2}>
                        <use xlinkHref={`#${path1}`} fill={`url(#${gradient1})`} />
                    </mask>
                    <mask id={mask3}>
                        <use xlinkHref={`#${path2}`} fill="white" />
                    </mask>
                    <mask id={mask4}>
                        <ellipse cx="131.34" cy="26.93" rx="6.93" ry="4.47" fill="white" />
                    </mask>
                </defs>
                <g transform="translate(-1, 0)">
                    <FacialHair />
                    {this.props.children}
                    <g transform="translate(3, 0)">
                        <rect
                            x="0"
                            y="0"
                            width="100%"
                            height="100%"
                            fill="black"
                            fillOpacity="0.2"
                            mask={`url(#${mask3})`}
                            transform="translate(0, 15)"
                        />
                        <HairColor maskID={mask1} />
                        <rect x="0" y="0" width="100%" height="100%" fill="black" mask={`url(#${mask2})`} />
                        <HairColor maskID={mask3} />
                        <HairColor maskID={mask4} />
                        <rect
                            x="0"
                            y="0"
                            width="100%"
                            height="100%"
                            fill="black"
                            fillOpacity="0.4"
                            mask={`url(#${mask4})`}
                        />
                        <path
                            d="M 189.55 83.17 C 189.55 83.17 189.17 101.27 187.01 101.62 C 185.76 101.83 178.73 90.11 165.51 81.8 C 156.05 75.84 142.1 72.54 130.77 72.47 C 118.69 72.38 105.33 74.58 95.05 80.68 C 82.17 88.36 73.63 100.29 72.72 99.92 C 71.09 99.3 71.42 89.57 70.53 82.07"
                            strokeWidth="5px"
                            stroke="#fff"
                        />
                        <path
                            fill="#fff"
                            d="M125.5 52.68a.8.8 0 0 1-1.09.01l-1.32-1.32a.8.8 0 0 1-.22-.55c0-.24.1-.45.26-.6a8.62 8.62 0 0 0 2.1-5.84 8.6 8.6 0 0 0-2.21-5.96.8.8 0 0 1-.17-.48c0-.2.08-.4.22-.53l.03-.04.02-.02 1.27-1.28a.78.78 0 0 1 1.14.04 13.06 13.06 0 0 1 3.11 8.27c0 3.07-1.25 6.13-3.14 8.3Zm11.72-16.57a.79.79 0 0 1 1.14-.04l1.28 1.28.02.02.04.04a.78.78 0 0 1 .04 1.02 8.62 8.62 0 0 0-2.2 5.95c0 2.34.72 4.23 2.09 5.83.15.16.27.37.27.6a.8.8 0 0 1-.23.56l-1.32 1.32a.79.79 0 0 1-1.09 0v-.01a12.98 12.98 0 0 1-3.14-8.3c0-3.04 1.24-6.1 3.1-8.27Zm-3.7 11.9c.2.8.52 1.57.88 2.3.14.3-.13.64-.44.56a9.44 9.44 0 0 0-2.56-.34h-.07c-.9 0-1.74.12-2.52.34-.3.08-.58-.27-.44-.56.36-.73.68-1.5.88-2.3.16-.68.34-.78.93-.84.4-.03.8-.06 1.2-.06h.03c.4 0 .79.03 1.18.06.6.06.77.16.94.84Zm-.93-6.43c-.39.03-.78.06-1.18.06h-.04c-.4 0-.8-.02-1.19-.06-.59-.06-.77-.16-.94-.84-.2-.8-.5-1.57-.87-2.3-.14-.3.13-.64.44-.55a9.4 9.4 0 0 0 2.52.33h.07c.92 0 1.77-.11 2.56-.34.3-.08.58.27.44.56-.36.73-.68 1.5-.87 2.3-.17.68-.35.78-.94.84Z"
                        />
                    </g>
                </g>
            </g>
        );
    }
}
CustomHair5.optionValue = 'CustomHair5';
