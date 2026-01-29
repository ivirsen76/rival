// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HatColor from './HatColor';

export default class WinterHat4 extends React.Component {
    constructor() {
        super(...arguments);
        this.filter1 = uniqueId('react-filter-');
        this.mask1 = uniqueId('react-mask-');
        this.mask2 = uniqueId('react-mask-');
        this.mask3 = uniqueId('react-mask-');
        this.mask4 = uniqueId('react-mask-');
        this.path1 = uniqueId('react-path-');
        this.path2 = uniqueId('react-path-');
        this.path3 = uniqueId('react-path-');
        this.path4 = uniqueId('react-path-');
        this.path5 = uniqueId('react-path-');
    }

    render() {
        const { filter1, mask1, mask2, mask3, mask4, path1, path2, path3, path4, path5 } = this;
        return (
            <g id="Top">
                <defs>
                    <rect id={path5} x="0" y="0" width="264" height="280" />
                    <path
                        d="M129.65,38.35 C132.45,45.35 134,52.99 134,61 L134,69 L2,69 L2,61 C2,52.97 3.54,45.31 6.36,38.29 C-0.03,24.83 -1.28,13.77 2.63,5.12 C10.14,2.84 18.83,4.64 28.71,10.53 C38.48,3.88 50.28,-4.77e-15 63,-7.10e-15 L73,-7.10e-15 C85.72,-9.44e-15 97.53,3.89 107.31,10.55 C117.20,4.65 125.90,2.84 133.41,5.12 C137.34,13.78 136.08,24.86 129.65,38.35 Z"
                        id={path1}
                    />
                    <path
                        d="M28.71,10.53 C18.75,17.31 10.91,26.96 6.36,38.29 C-0.03,24.83 -1.28,13.77 2.63,5.12 C10.14,2.84 18.83,4.64 28.71,10.53 Z M129.65,38.35 C125.12,27.01 117.27,17.34 107.31,10.55 C117.20,4.65 125.90,2.84 133.41,5.12 C137.34,13.78 136.08,24.86 129.65,38.35 Z"
                        id={path2}
                    />
                    <path
                        d="M21.86,15.95 C17.38,20.04 13.52,24.79 10.42,30.04 C7.50,21.93 7.00,16.32 8.92,13.20 C11.57,12.06 15.88,12.97 21.86,15.95 Z M125.35,29.67 C122.27,24.54 118.47,19.90 114.07,15.90 C119.88,13.05 124.08,12.18 126.68,13.31 C128.57,16.36 128.12,21.81 125.35,29.67 Z"
                        id={path3}
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
                        id={path4}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path5} />
                </mask>
                <g id="Mask" />
                <g id="Top/Accessories/Winter-Hat-4" transform="translate(-1.00, 0.00)">
                    <g id="hat" strokeWidth="1" fillRule="evenodd" transform="translate(65.00, 4.00)">
                        <mask id={mask2} fill="white">
                            <use xlinkHref={'#' + path1} />
                        </mask>
                        <use id="hat-mask" fill="#D8D8D8" xlinkHref={'#' + path1} />
                        <HatColor maskID={mask2} defaultColor="Red" />
                        <mask id={mask3} fill="white">
                            <use xlinkHref={'#' + path2} />
                        </mask>
                        <use id="shadow" fillOpacity="0.24" fill="#000000" xlinkHref={'#' + path2} />
                        <mask id={mask4} fill="white">
                            <use xlinkHref={'#' + path3} />
                        </mask>
                        <use id="light" fillOpacity="0.30" fill="#FFFFFF" xlinkHref={'#' + path3} />
                    </g>
                    <g id="hat-front">
                        <use fill="black" fillOpacity="1" filter={`url(#${path4})`} xlinkHref={'#' + path4} />
                        <use fill="#F4F4F4" fillRule="evenodd" xlinkHref={'#' + path4} />
                    </g>
                    <FacialHair />
                    {this.props.children}
                </g>
            </g>
        );
    }
}
WinterHat4.optionValue = 'WinterHat4';
