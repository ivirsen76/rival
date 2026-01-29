// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class ShortHairFrizzle extends React.Component {
    constructor() {
        super(...arguments);
        this.filter1 = uniqueId('react-filter-');
        this.mask1 = uniqueId('react-mask-');
        this.mask2 = uniqueId('react-mask-');
        this.path1 = uniqueId('react-path-');
        this.path2 = uniqueId('react-path-');
    }

    render() {
        const { filter1, mask1, mask2, path1, path2 } = this;
        return (
            <g id="Top" strokeWidth="1" fillRule="evenodd">
                <defs>
                    <rect id={path2} x="0" y="0" width="264" height="280" />
                    <path
                        d="M90.91,55.36 L175.08,55.36 C193.33,44.83 196.75,26.15 183.84,9.92 C180.63,5.88 175.08,21.67 158.02,22.65 C140.97,23.62 142.60,16.34 124.45,19.07 C106.30,21.79 108.31,36.37 96.46,39.87 C88.57,42.20 86.71,47.37 90.91,55.36 Z"
                        id={path1}
                    />
                    <filter
                        x="-0.8%"
                        y="-2.0%"
                        width="101.5%"
                        height="108.0%"
                        filterUnits="objectBoundingBox"
                        id={filter1}
                    >
                        <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
                        <feColorMatrix
                            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.16 0"
                            type="matrix"
                            in="shadowOffsetOuter1"
                            result="shadowMatrixOuter1"
                        />
                        <feMerge>
                            <feMergeNode in="shadowMatrixOuter1" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <mask id={mask2} fill="white">
                    <use xlinkHref={'#' + path2} />
                </mask>
                <g id="Mask" />
                <g id="Top/Short-Hair/Frizzle" mask={`url(#${mask2})`}>
                    <g transform="translate(-1.00, 0.00)">
                        <FacialHair />
                        <mask id={mask1} fill="white">
                            <use xlinkHref={'#' + path1} />
                        </mask>
                        <use id="Hair-Maks" stroke="none" fill="#252E32" fillRule="evenodd" xlinkHref={'#' + path1} />
                        <HairColor maskID={mask1} />
                        {this.props.children}
                    </g>
                </g>
            </g>
        );
    }
}
ShortHairFrizzle.optionValue = 'ShortHairFrizzle';
