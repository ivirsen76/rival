import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class WinterHat3 extends React.Component {
    constructor() {
        super(...arguments);
        this.filter1 = uniqueId('react-filter-');
        this.mask1 = uniqueId('react-mask-');
        this.mask2 = uniqueId('react-mask-');
        this.path1 = uniqueId('react-path-');
        this.path2 = uniqueId('react-path-');
        this.path3 = uniqueId('react-path-');
    }

    render() {
        const { filter1, mask1, mask2, path1, path2, path3 } = this;
        return (
            <g id="Top">
                <defs>
                    <rect id={path3} x="0" y="0" width="264" height="280" />
                    <path
                        d="M66,0 L66,0 C102.45,-6.69e-15 132,29.54 132,66 L132,71 L0,71 L0,66 C-4.46e-15,29.54 29.54,6.69e-15 66,0 Z"
                        id={path1}
                    />
                    <filter
                        x="-0.7%"
                        y="-1.7%"
                        width="101.4%"
                        height="106.8%"
                        filterUnits="objectBoundingBox"
                        id={filter1}
                    >
                        <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
                        <feColorMatrix
                            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.1 0"
                            type="matrix"
                            in="shadowOffsetOuter1"
                        />
                    </filter>
                    <path
                        d="M67.28,61.45 C83.22,49.81 105.15,44 133.07,44 C160.98,44 182.87,49.81 198.73,61.44 L198.73,61.44 C200.78,62.95 202.00,65.35 202.00,67.90 L202.00,98.36 C202.00,100.57 200.20,102.36 198.00,102.36 C197.24,102.36 196.50,102.15 195.86,101.75 C179.22,91.25 158.53,86 133.80,86 C108.88,86 87.64,91.33 70.07,101.99 L70.07,101.99 C68.18,103.14 65.72,102.53 64.58,100.65 C64.20,100.02 64.00,99.30 64.00,98.57 L64,67.91 C64,65.35 65.22,62.95 67.28,61.45 Z"
                        id={path2}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path3} />
                </mask>
                <g id="Mask" />
                <g id="Top/Accessories/Winter-Hat-3" transform="translate(-1.00, 0.00)">
                    <g id="hat" strokeWidth="1" fillRule="evenodd" transform="translate(67.00, 12.00)">
                        <circle id="puff" fill="#eee" cx="66" cy="8" r="20" stroke="#ccc" strokeWidth="1.5" />
                        <mask id={mask2} fill="white">
                            <use xlinkHref={'#' + path1} />
                        </mask>
                        <use id="hat-mask" fill="#D8D8D8" xlinkHref={'#' + path1} />
                        <HairColor maskID={mask2} defaultColor="Red" />
                    </g>
                    <g id="hat-front">
                        <use fill="black" fillOpacity="1" filter={`url(#${path2})`} xlinkHref={'#' + path2} />
                        <use fill="#eee" fillRule="evenodd" xlinkHref={'#' + path2} stroke="#ccc" strokeWidth="1.5" />
                    </g>
                    <FacialHair />
                    {this.props.children}
                </g>
            </g>
        );
    }
}
WinterHat3.optionValue = 'WinterHat3';
