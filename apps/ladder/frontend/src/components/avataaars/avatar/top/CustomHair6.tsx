import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class CustomHair6 extends React.Component {
    constructor() {
        super(...arguments);
        this.gradient1 = uniqueId();
        this.mask1 = uniqueId();
        this.mask2 = uniqueId();
        this.mask3 = uniqueId();
        this.path1 = uniqueId();
        this.path2 = uniqueId();
    }

    render() {
        const { gradient1, mask1, mask2, mask3, path1, path2 } = this;

        return (
            <g>
                <defs>
                    <linearGradient id={gradient1} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#000" />
                        <stop offset="100%" stopColor="#666" />
                    </linearGradient>
                    <path
                        d="M 105.03 76.44 C 102.22 76.85 88.95 80.25 80.48 82.08 C 76.84 82.86 73.96 83.76 73.39 83.34 C 71.5 81.95 74.03 62.42 78.71 51.42 C 83.39 40.42 97.52 25.55 131.37 25.55 C 165.21 25.55 179.18 43.19 182.45 52.94 C 185.72 62.69 189.04 82.51 186.86 84.46 C 186.23 85.02 184.1 84.08 181.06 83.37 C 173.52 81.6 161.23 77.85 158.64 77.22 C 157.99 73.48 159.96 45.71 131.58 45.57 C 103.2 45.43 105.39 72.33 105.03 76.44 Z"
                        id={path1}
                    />
                    <path
                        d="M 105.03 76.27 C 108.99 75.91 120.23 74.23 131.59 74.32 C 142.5 74.4 153.52 76.22 158.52 76.94 C 158.69 74.92 157.95 66.61 156.76 63.88 C 152 62.47 142.09 60.5 131.71 60.34 C 122.57 60.21 113.05 61.7 106.56 63.03 C 105.34 66.08 105.02 74.04 105.03 76.27 Z"
                        id={path2}
                    />
                    <mask id={mask1}>
                        <use xlinkHref={'#' + path1} fill="white" />
                        <use xlinkHref={'#' + path2} fill="white" />
                    </mask>
                    <mask id={mask2}>
                        <use xlinkHref={'#' + path1} fill={`url(#${gradient1})`} />
                    </mask>
                    <mask id={mask3}>
                        <use xlinkHref={'#' + path2} fill="white" />
                    </mask>
                </defs>
                <g transform="translate(-1, 0)">
                    <FacialHair />
                    <g transform="translate(3, 0)">
                        <HairColor maskID={mask1} />
                        <rect x="0" y="0" width="100%" height="100%" fill="black" mask={`url(#${mask2})`} />
                        <g>
                            <circle fill="#000" fillOpacity="0.5" cx="127.07" cy="67.45" r="1.8" />
                            <circle fill="#000" fillOpacity="0.5" cx="137.4" cy="67.57" r="1.8" />
                            <circle fill="#000" fillOpacity="0.5" cx="148.19" cy="68.76" r="1.8" />
                        </g>
                        <path
                            fill="#000"
                            fillOpacity="0.5"
                            d="M 123.91 58.81 C 121.05 58.94 113.35 62.75 113.4 68.15 C 113.45 73.55 119.66 76.61 122.01 77.05 L 124.13 77.2 C 123.64 74.99 116.14 73.39 115.88 68.45 C 115.62 63.51 125.58 59.76 126.33 58.24 L 123.91 58.81 Z"
                            mask={`url(#${mask3})`}
                        />
                    </g>
                    {this.props.children}
                </g>
            </g>
        );
    }
}
CustomHair6.optionValue = 'CustomHair6';
