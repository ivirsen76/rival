// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class LongHairStraight extends React.Component {
    constructor() {
        super(...arguments);
        this.mask1 = uniqueId('react-mask-');
        this.mask2 = uniqueId('react-mask-');
        this.path1 = uniqueId('react-path-');
        this.path2 = uniqueId('react-path-');
    }

    render() {
        const { mask1, mask2, path1, path2 } = this;
        return (
            <g id="Top" strokeWidth="1" fillRule="evenodd">
                <defs>
                    <rect id={path1} x="0" y="0" width="264" height="280" />
                    <path
                        d="M133.50,81.33 C137.36,83.33 140,87.35 140,92 L140,105 C140,111.01 135.56,116.00 129.79,116.86 C128.04,137.11 115.53,154.28 98,162.61 L98,162.61 L98,181 L102,181 C119.49,181 135.52,187.23 148,197.60 L148,74 C148,53.56 139.71,35.06 126.32,21.67 C112.93,8.28 94.43,-3.55e-15 74,0 C33.13,7.10e-15 -7.10e-15,33.13 0,74 L0,257.71 C13.56,255.77 24,244.10 24,230 L24,184.42 C30.93,182.20 38.32,181 46,181 L50,181 L50,162.61 C38.77,157.27 29.60,148.31 24,137.24 L24,75.26 C33.14,72.29 42.77,68.01 52.34,62.49 C67.74,53.60 80.43,42.94 89.06,32.39 C90.83,37.59 93.17,42.80 96.11,47.88 C104.87,63.07 117.22,74.23 130,79.91 L130,80.16 C130.40,80.23 130.79,80.32 131.18,80.42 C131.95,80.74 132.73,81.05 133.50,81.33 Z"
                        id={path2}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <g id="Mask" />
                <g id="Top/Long-Hair/Straight" mask={`url(#${mask1})`}>
                    <g transform="translate(-1.00, 0.00)">
                        <g id="Hair" strokeWidth="1" fill="none" fillRule="evenodd" transform="translate(59.00, 18.00)">
                            <mask id={mask2} fill="white">
                                <use xlinkHref={'#' + path2} />
                            </mask>
                            <use id="Mask-Hair" fill="#944F23" xlinkHref={'#' + path2} />
                            <HairColor maskID={mask2} />
                        </g>
                        <path
                            d="M192.50,99.33 C197.37,101.10 202.26,102.07 207,102.14 L207,102.14 L207,92 C207,71.56 198.71,53.06 185.32,39.67 C198.71,53.06 207,71.56 207,92 L207,215.60 C194.52,205.23 178.49,199 161,199 L157,199 L157,180.61 L157,180.61 C174.53,172.28 187.04,155.11 188.79,134.86 C194.56,134.00 199,129.01 199,123 L199,110 C199,105.35 196.36,101.33 192.50,99.33 Z M190.18,98.42 C189.79,98.32 189.40,98.23 189,98.16 L189,97.91 C189.39,98.09 189.78,98.26 190.18,98.42 Z M83,155.24 C88.60,166.31 97.77,175.27 109,180.61 L109,199 L105,199 C97.32,199 89.93,200.20 83,202.42 L83,155.24 Z"
                            id="Shadow"
                            fillOpacity="0.24"
                            fill="#000000"
                            fillRule="evenodd"
                        />
                        <FacialHair />
                        {this.props.children}
                    </g>
                </g>
            </g>
        );
    }
}
LongHairStraight.optionValue = 'LongHairStraight';
