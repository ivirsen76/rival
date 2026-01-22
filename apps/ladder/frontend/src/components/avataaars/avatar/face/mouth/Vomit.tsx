// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';

export default class Vomit extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.path2 = uniqueId('react-path-');
        this.mask1 = uniqueId('react-mask-');
        this.filter1 = uniqueId('react-filter-');
    }

    render() {
        const { path1, path2, filter1, mask1 } = this;
        return (
            <g id="Mouth/Vomit" transform="translate(2.00, 52.00)">
                <defs>
                    <path
                        d="M34.00,12.60 C35.12,23.09 38.23,31.99 53.99,31.99 C69.75,32.00 72.91,23.04 73.99,12.50 C74.08,11.65 73.17,10.99 72.03,10.99 C65.35,10.99 62.67,12.49 53.98,12.49 C45.30,12.50 40.75,10.99 36.09,10.99 C34.94,10.99 33.89,11.55 34.00,12.60 Z"
                        id={path1}
                    />
                    <path
                        d="M59.91,36 L60,36 C60,39.31 62.68,42 66,42 C69.31,42 72,39.31 72,36 L72,35 L72,31 C72,27.68 69.31,25 66,25 L66,25 L42,25 L42,25 C38.68,25 36,27.68 36,31 L36,31 L36,35 L36,38 C36,41.31 38.68,44 42,44 C45.31,44 48,41.31 48,38 L48,36 L48.08,36 C48.55,33.16 51.02,31 54,31 C56.97,31 59.44,33.16 59.91,36 Z"
                        id={path2}
                    />
                    <filter
                        x="-1.4%"
                        y="-2.6%"
                        width="102.8%"
                        height="105.3%"
                        filterUnits="objectBoundingBox"
                        id={filter1}
                    >
                        <feOffset dx="0" dy="-1" in="SourceAlpha" result="shadowOffsetInner1" />
                        <feComposite
                            in="shadowOffsetInner1"
                            in2="SourceAlpha"
                            operator="arithmetic"
                            k2="-1"
                            k3="1"
                            result="shadowInnerInner1"
                        />
                        <feColorMatrix
                            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.1 0"
                            type="matrix"
                            in="shadowInnerInner1"
                        />
                    </filter>
                </defs>
                <mask id={mask1} fill="white">
                    <use
                        xlinkHref={'#' + path1}
                        transform="translate(54.00, 21.49) scale(1, -1) translate(-54.00, -21.49) "
                    />
                </mask>
                <use
                    id="Mouth"
                    fillOpacity="0.69"
                    fill="#000000"
                    fillRule="evenodd"
                    transform="translate(54.00, 21.49) scale(1, -1) translate(-54.00, -21.49) "
                    xlinkHref={'#' + path1}
                />
                <rect
                    id="Teeth"
                    fill="#FFFFFF"
                    fillRule="evenodd"
                    mask={`url(#${mask1})`}
                    x="39"
                    y="0"
                    width="31"
                    height="16"
                    rx="5"
                />
                <g id="Vomit-Stuff">
                    <use fill="#88C553" fillRule="evenodd" xlinkHref={'#' + path2} />
                    <use fill="black" fillOpacity="1" filter={`url(#${filter1})`} xlinkHref={'#' + path2} />
                </g>
            </g>
        );
    }
}
Vomit.optionValue = 'Vomit';
