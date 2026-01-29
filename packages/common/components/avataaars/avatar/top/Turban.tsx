// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class Turban extends React.Component {
    constructor() {
        super(...arguments);
        this.filter1 = uniqueId('react-filter-');
        this.mask1 = uniqueId('react-mask-');
        this.mask2 = uniqueId('react-mask-');
        this.mask3 = uniqueId('react-mask-');
        this.path1 = uniqueId('react-path-');
        this.path2 = uniqueId('react-path-');
        this.path3 = uniqueId('react-path-');
    }

    render() {
        const { filter1, mask1, mask2, mask3, path1, path2, path3 } = this;
        return (
            <g id="Top" strokeWidth="1" fillRule="evenodd">
                <defs>
                    <rect id={path1} x="0" y="0" width="264" height="280" />
                    <path
                        d="M156,180.61 C173.53,172.28 186.04,155.11 187.79,134.86 C193.56,134.00 198,129.01 198,123 L198,110 C198,104.05 193.67,99.11 188,98.16 L188,92 C188,61.07 162.92,36 132,36 C101.07,36 76,61.07 76,92 L76,92 L76,98.16 C70.32,99.11 66,104.05 66,110 L66,123 C66,129.01 70.43,134.00 76.20,134.86 C77.95,155.11 90.46,172.28 108,180.61 L108,199 L104,199 L104,199 C64.23,199 32,231.23 32,271 L32,280 L232,280 L232,271 C232,231.23 199.76,199 160,199 L156,199 L156,180.61 Z M0,5.68e-14 L264,5.68e-14 L264,280 L0,280 L0,5.68e-14 Z"
                        id={path2}
                    />
                    <path
                        d="M83.97,55.81 C107.40,69.41 145.11,82.11 139,138 C158.37,132.36 168.04,116.80 168,91.32 C167.91,44.14 115.85,6.80e-15 86,0 C85.32,0 84.65,0.02 83.99,0.08 C83.33,0.02 82.66,0 82.00,0 C52.07,6.80e-15 0.08,44.14 0.00,91.32 C-0.04,117.44 9.62,132.99 29.00,138 C22.86,82.11 60.51,69.41 83.97,55.81 Z"
                        id={path3}
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
                <g id="Top/Accesories/Turban" mask={`url(#${mask1})`}>
                    <g transform="translate(-1.00, 0.00)">
                        <FacialHair />
                        <g id="Behind" strokeWidth="1" fillRule="evenodd" transform="translate(1.00, 0.00)">
                            <mask id={mask2} fill="white">
                                <use xlinkHref={'#' + path2} />
                            </mask>
                            <g id="Mask-Hair" />
                        </g>
                        <g id="Turban" strokeWidth="1" fillRule="evenodd" transform="translate(1.00, 0.00)">
                            <path
                                d="M74.53,97.5 C73.52,95.09 73,92.57 73,90 C73,71.77 99.41,57 132,57 C164.58,57 191,71.77 191,90 C191,92.57 190.47,95.09 189.46,97.5 C183.39,82.88 159.97,72 132,72 C104.02,72 80.60,82.88 74.53,97.5 Z"
                                id="Band"
                                fill="#EDECE3"
                            />
                            <g transform="translate(48.00, 3.00)">
                                <mask id={mask3} fill="white">
                                    <use xlinkHref={'#' + path3} />
                                </mask>
                                <use id="Turban-Mask" fill="#124C74" xlinkHref={'#' + path3} />
                                <HairColor maskID={mask3} defaultColor="Blue03" />
                            </g>
                            <path
                                d="M48.01,96.01 C48.38,121.11 58.04,136.10 77.00,141 C57.62,136.28 47.95,121.63 48.00,97.02 C48.00,96.69 48.00,96.35 48.01,96.01 Z M152.64,30.46 C153.39,36.19 152.12,42.88 148.00,50.13 C136.84,71.56 76.56,72.00 76.33,129.67 C76.10,67.76 136.80,67.37 148.00,44.54 C150.66,39.56 152.14,34.83 152.64,30.46 Z"
                                id="Shadow"
                                fillOpacity="0.16"
                                fill="#000000"
                            />
                        </g>
                        {this.props.children}
                    </g>
                </g>
            </g>
        );
    }
}
Turban.optionValue = 'Turban';
