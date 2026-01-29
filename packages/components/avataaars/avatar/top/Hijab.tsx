// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import HatColor from './HatColor';

export default class Hijab extends React.Component {
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
                        d="M66.04,77.07 C71.67,45.20 99.51,21 133,21 L133,21 L133,21 C170.55,21 201,51.44 201,89 L201,119.75 C201.87,129.55 202.69,136.42 203.45,140.35 C204.83,147.45 209.15,145.11 209.15,155.22 C209.15,165.32 204.82,168.72 204.80,177.70 C204.78,186.69 220.20,193.83 220.20,205.24 C220.20,216.64 213.12,270.47 142.57,270.47 C127.50,270.47 114.67,266.18 104.06,257.61 C104.75,264.10 105.39,271.56 106,280 L59,280 C59.93,256.22 51.71,242.93 51.71,216.44 C51.71,189.95 65.35,151.42 65,142 C65.01,141.41 65.04,140.72 65.06,139.93 C65.02,138.95 65,137.98 65,137 L65,89 L65,89 C65,85.02 65.34,81.12 65.99,77.33 C65.99,77.22 65.99,77.11 66,77 C66.01,77.02 66.02,77.04 66.04,77.07 Z M132.5,53 L132.5,53 C102.40,53 78,77.40 78,107.5 L78,107.5 L78,130.5 C78,160.59 102.40,185 132.5,185 L133.5,185 C163.59,185 188,160.59 188,130.5 L188,107.5 C188,77.40 163.59,53 133.5,53 L133.5,53 L132.5,53 Z"
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
                <g id="Top/Accesories/Hijab" mask={`url(#${mask1})`}>
                    <g transform="translate(-1.00, 0.00)">
                        <mask id={mask2} fill="white">
                            <use xlinkHref={'#' + path2} />
                        </mask>
                        <use id="Hijab-Mask" stroke="none" fill="#3B6BAD" fillRule="evenodd" xlinkHref={'#' + path2} />
                        <HatColor maskID={mask2} defaultColor="Blue03" />
                        <path
                            d="M72.07,104.95 C71.36,101.24 71,97.41 71,93.5 C71,59.53 98.75,32 133,32 C167.24,32 195,59.53 195,93.5 C195,97.41 194.63,101.24 193.92,104.95 C192.34,72.68 165.66,47 133,47 C100.33,47 73.65,72.68 72.07,104.95 Z"
                            id="Band"
                            stroke="none"
                            fillOpacity="0.5"
                            fill="#FFFFFF"
                            fillRule="evenodd"
                            mask={`url(#${mask2})`}
                        />
                        <path
                            d="M187.92,104.69 C188.63,108.18 189,111.80 189,115.5 L189,138.5 C189,168.59 164.59,193 134.5,193 L131.5,193 C101.40,193 77,168.59 77,138.5 L77,115.5 L77,115.5 C77,111.80 77.36,108.18 78.07,104.69 C78.02,105.62 78,106.55 78,107.5 L78,107.5 L78,130.5 C78,160.59 102.40,185 132.5,185 L133.5,185 C163.59,185 188,160.59 188,130.5 L188,130.5 L188,107.5 C188,106.55 187.97,105.62 187.92,104.69 Z M114.16,206.99 C120.65,211.98 135.66,213.70 152.40,210.75 C169.14,207.80 182.66,201.04 187.04,194.14 C187.11,194.39 187.17,194.65 187.22,194.91 C188.93,204.60 173.98,215.34 153.84,218.89 C133.69,222.44 115.97,217.46 114.26,207.77 C114.22,207.51 114.18,207.25 114.16,206.99 Z M126.03,235.92 C134.22,241.57 150.42,241.84 167.10,235.77 C183.78,229.70 196.01,219.08 198.66,209.48 C198.80,209.80 198.93,210.13 199.05,210.46 C203.58,222.90 190.97,238.90 170.90,246.21 C150.83,253.52 130.88,249.36 126.36,236.92 C126.24,236.59 126.13,236.25 126.03,235.92 Z"
                            id="Shadows"
                            stroke="none"
                            fillOpacity="0.16"
                            fill="#000000"
                            fillRule="evenodd"
                            opacity="0.89"
                            mask={`url(#${mask2})`}
                        />
                        {this.props.children}
                    </g>
                </g>
            </g>
        );
    }
}
Hijab.optionValue = 'Hijab';
