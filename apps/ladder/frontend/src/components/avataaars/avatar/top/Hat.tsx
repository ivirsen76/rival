import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';

export default class Hat extends React.Component {
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
                        d="M156,180.61 C173.53,172.28 186.04,155.11 187.79,134.86 C193.56,134.00 198,129.01 198,123 L198,110 C198,104.05 193.67,99.11 188,98.16 L188,92 C188,84.05 186.34,76.49 183.36,69.64 C173.43,53 89.31,53.80 80.70,69.48 C77.68,76.37 76,83.99 76,92 L76,98.16 C70.32,99.11 66,104.05 66,110 L66,123 C66,129.01 70.43,134.00 76.20,134.86 C77.95,155.11 90.46,172.28 108,180.61 L108,199 L104,199 L104,199 C64.23,199 32,231.23 32,271 L32,280 L232,280 L232,271 C232,231.23 199.76,199 160,199 L156,199 L156,180.61 Z M0,5.68e-14 L264,5.68e-14 L264,280 L0,280 L0,5.68e-14 Z"
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
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path2} />
                </mask>
                <g id="Mask" />
                <g id="Top/Accesories/Hat" mask={`url(#${mask1})`}>
                    <g transform="translate(-1.00, 0.00)">
                        <g id="Hat" strokeWidth="1" fillRule="evenodd" transform="translate(1.00, 0.00)">
                            <mask id={mask2} fill="white">
                                <use xlinkHref={'#' + path1} />
                            </mask>
                            <g id="Mask-Hair" />
                            <path
                                d="M123.18,2 L141.81,2 L141.81,2 C160.60,2 176.86,15.08 180.89,33.43 L190,75 L75,75 L84.10,33.43 L84.10,33.43 C88.13,15.08 104.39,2 123.18,2 Z"
                                fill="#1F333C"
                                mask={`url(#${mask2})`}
                            />
                            <ellipse
                                id="Hipster"
                                fill="#1F333C"
                                mask={`url(#${mask2})`}
                                cx="132"
                                cy="87.5"
                                rx="122"
                                ry="57.5"
                            />
                            <ellipse
                                id="Very"
                                fill="#15232A"
                                mask={`url(#${mask2})`}
                                cx="132"
                                cy="82"
                                rx="62"
                                ry="25"
                            />
                        </g>
                        <FacialHair />
                        {this.props.children}
                    </g>
                </g>
            </g>
        );
    }
}
Hat.optionValue = 'Hat';
