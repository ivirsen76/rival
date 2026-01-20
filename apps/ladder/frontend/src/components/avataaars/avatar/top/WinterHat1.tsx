import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HatColor from './HatColor';

export default class WinterHat1 extends React.Component {
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
                        d="M120,54 L20,54 L20,155 C20,160.52 15.52,165 10,165 C4.47,165 6.76e-16,160.52 0,155 L0,54 L0,44 C-2.97e-15,19.69 19.69,4.46e-15 44,0 L96,0 C120.30,-4.46e-15 140,19.69 140,44 L140,54 L140,155 C140,160.52 135.52,165 130,165 C124.47,165 120,160.52 120,155 L120,54 Z"
                        id={path1}
                    />
                    <filter
                        x="-0.8%"
                        y="-2.8%"
                        width="101.7%"
                        height="111.1%"
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
                    <rect id={path2} x="74" y="50" width="118" height="36" rx="8" />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path3} />
                </mask>
                <g id="Mask" />
                <g id="Top/Accessories/Winter-Hat-1" transform="translate(-1.00, 0.00)">
                    <g id="hat" strokeWidth="1" fillRule="evenodd" transform="translate(63.00, 20.00)">
                        <path
                            d="M1,48 L23.67,48 L23.67,153.66 C23.67,159.92 18.59,165 12.33,165 C6.07,165 1,159.92 1,153.66 L1,48 Z M116.32,48 L139,48 L139,153.66 C139,159.92 133.92,165 127.66,165 C121.40,165 116.32,159.92 116.32,153.66 L116.32,48 Z"
                            id="inside"
                            fill="#F4F4F4"
                        />
                        <mask id={mask2} fill="white">
                            <use xlinkHref={'#' + path1} />
                        </mask>
                        <use id="hat-mask" fill="#D8D8D8" xlinkHref={'#' + path1} />
                        <HatColor maskID={mask2} defaultColor="Red" />
                    </g>
                    <g id="hat-front">
                        <use fill="black" fillOpacity="1" filter={`url(#${path2})`} xlinkHref={'#' + path2} />
                        <use fill="#F4F4F4" fillRule="evenodd" xlinkHref={'#' + path2} />
                    </g>
                    <FacialHair />
                    {this.props.children}
                </g>
            </g>
        );
    }
}
WinterHat1.optionValue = 'WinterHat1';
