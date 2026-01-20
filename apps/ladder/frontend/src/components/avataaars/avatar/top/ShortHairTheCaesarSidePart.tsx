import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class ShortHairTheCaesarSidePart extends React.Component {
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
                    <rect id={path1} x="0" y="0" width="264" height="280" />
                    <path
                        d="M82.01,24.37 C74.98,23.68 66.65,23.25 58.31,23.24 C39.00,23.23 19.61,25.48 16,28 C6.29,35.24 2.53,62.44 3,64 C2.67,65.22 1.34,65.48 1,64 C0.28,53.70 1,1.72 58,1 C115,0.27 115.71,53.70 115,64 C114.65,65.48 113.32,65.22 113,64 C113.46,62.44 109.70,35.24 100,28 C98.24,26.77 92.75,25.61 85.35,24.73 L89,16 L82.01,24.37 Z"
                        id={path2}
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
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <g id="Mask" />
                <g id="Top/Short-Hair/The-Caesar-+-Side-Part" mask={`url(#${mask1})`}>
                    <g transform="translate(-1.00, 0.00)">
                        <FacialHair />
                        <g id="Hair" strokeWidth="1" fillRule="evenodd" transform="translate(75.00, 34.00)">
                            <mask id={mask2} fill="white">
                                <use xlinkHref={'#' + path2} />
                            </mask>
                            <use id="Caesar" fill="#28354B" xlinkHref={'#' + path2} />
                            <HairColor maskID={mask2} />
                        </g>
                        {this.props.children}
                    </g>
                </g>
            </g>
        );
    }
}
ShortHairTheCaesarSidePart.optionValue = 'ShortHairTheCaesarSidePart';
