import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class LongHairCurly extends React.Component {
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
                        d="M48.72,89.21 C44.74,91.17 42,95.26 42,100 L42,113 C42,119.01 46.43,124.00 52.20,124.86 C53.95,145.11 66.46,162.28 84,170.61 L84,189 L80,189 L80,189 C78.41,189 76.83,189.05 75.27,189.15 C70.36,186.63 65.77,183.57 61.59,180.04 C57.28,181.31 52.72,182 48,182 C21.49,182 0,160.50 0,134 C0,119.59 6.34,106.66 16.40,97.86 C11.11,90.60 8,81.66 8,72 C8,50.16 23.91,32.03 44.77,28.59 C51.01,11.89 67.12,0 86,0 C94.01,0 101.52,2.14 108,5.88 C114.47,2.14 121.98,0 130,0 C148.87,0 164.98,11.89 171.22,28.59 C192.08,32.03 208,50.16 208,72 C208,81.66 204.88,90.60 199.59,97.86 C209.65,106.66 216,119.59 216,134 C216,160.50 194.50,182 168,182 C163.27,182 158.71,181.31 154.40,180.04 C150.22,183.57 145.63,186.63 140.72,189.15 C139.16,189.05 137.58,189 136,189 L136,189 L132,189 L132,170.61 C149.53,162.28 162.04,145.11 163.79,124.86 C169.56,124.00 174,119.01 174,113 L174,100 C174,95.77 171.82,92.06 168.52,89.92 C167.45,89.53 166.37,89.04 165.28,88.45 C164.86,88.33 164.43,88.23 164,88.16 L164,87.71 C155.31,82.41 146.76,71.17 141.44,56.79 C131.31,58.83 119.54,60 107,60 C95.03,60 83.78,58.94 73.98,57.07 C68.75,71.06 60.46,82.04 52,87.42 L52,88.16 C50.97,88.33 49.99,88.63 49.08,89.05 C48.96,89.10 48.84,89.16 48.72,89.21 Z"
                        id={path2}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <g id="Mask" />
                <g id="Top/Long-Hair/Curly" mask={`url(#${mask1})`}>
                    <g transform="translate(-1.00, 0.00)">
                        <path
                            d="M105.98,27.76 C114.01,26.62 122.79,26 132,26 C142.35,26 152.18,26.79 160.99,28.21 C183.45,38.74 199,61.55 199,88 L199,105.04 C187.46,104.67 173.83,90.76 166.44,70.79 C156.31,72.83 144.54,74 132,74 C120.03,74 108.78,72.94 98.98,71.07 C91.67,90.62 78.38,104.30 67,105.02 L67,88 L67,88 C67,61.17 83.00,38.08 105.98,27.76 Z"
                            id="Shadow"
                            fillOpacity="0.16"
                            fill="#000000"
                            fillRule="evenodd"
                        />
                        <g id="Hair" strokeWidth="1" fill="none" fillRule="evenodd" transform="translate(25.00, 10.00)">
                            <mask id={mask2} fill="white">
                                <use xlinkHref={'#' + path2} />
                            </mask>
                            <use id="Curly!" fill="#314756" xlinkHref={'#' + path2} />
                            <HairColor maskID={mask2} />
                        </g>
                        <FacialHair />
                        {this.props.children}
                    </g>
                </g>
            </g>
        );
    }
}
LongHairCurly.optionValue = 'LongHairCurly';
