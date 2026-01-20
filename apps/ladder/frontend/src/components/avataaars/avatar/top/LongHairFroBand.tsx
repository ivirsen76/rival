import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class LongHairFroBand extends React.Component {
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
                        d="M80.02,73.81 C78.06,79.51 77,85.63 77,92 L77,92 L77,98.16 C71.32,99.11 67,104.05 67,110 L67,123 C67,129.01 71.43,134.00 77.20,134.86 C78.95,155.11 91.46,172.28 109,180.61 L109,191.55 C104.29,193.76 99.04,195 93.5,195 C84.69,195 76.61,191.88 70.31,186.68 C68.40,186.89 66.46,187 64.5,187 C43.40,187 25.16,174.79 16.45,157.05 C8.93,151.92 4,143.28 4,133.5 C4,131.38 4.23,129.32 4.66,127.34 C2.29,121.01 1,114.15 1,107 C1,94.24 5.11,82.44 12.09,72.87 C12.03,72.09 12,71.29 12,70.5 C12,59.20 18.57,49.44 28.10,44.82 C36.53,26.70 54.55,13.93 75.65,13.04 C80.78,8.06 87.78,5 95.5,5 C97.82,5 100.08,5.27 102.25,5.80 C111.77,2.05 122.14,0 133,0 C143.34,0 153.25,1.87 162.40,5.29 C163.74,5.09 165.11,5 166.5,5 C174.21,5 181.21,8.06 186.34,13.04 C207.44,13.93 225.46,26.70 233.89,44.82 C243.42,49.44 250,59.20 250,70.5 C250,71.29 249.96,72.09 249.90,72.87 C256.88,82.44 261,94.24 261,107 C261,114.15 259.70,121.01 257.33,127.34 C257.76,129.32 258,131.38 258,133.5 C258,143.28 253.06,151.92 245.54,157.05 C236.83,174.79 218.59,187 197.5,187 C195.53,187 193.59,186.89 191.68,186.68 C185.38,191.88 177.30,195 168.5,195 C164.48,195 160.61,194.35 157,193.15 L157,180.61 C174.53,172.28 187.04,155.11 188.79,134.86 C194.56,134.00 199,129.01 199,123 L199,110 C199,104.05 194.67,99.11 189,98.16 L189,92 C189,86.55 188.22,81.29 186.77,76.32 L188.15,89.19 L176.81,65.19 L131.67,45.67 L101.56,56.22 L80.06,76.41 L80.02,73.81 Z"
                        id={path2}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <g id="Mask" />
                <g id="Top/Long-Hair/Fro-+-Band" mask={`url(#${mask1})`}>
                    <g transform="translate(-1.00, 0.00)">
                        <mask id={mask2} fill="white">
                            <use xlinkHref={'#' + path2} />
                        </mask>
                        <use id="Hair" stroke="none" fill="#314756" fillRule="evenodd" xlinkHref={'#' + path2} />
                        <HairColor maskID={mask2} />
                        <path
                            d="M76.63,98.975 C76.21,96.42 76,93.81 76,91.15 C76,62.34 101.29,39 132.5,39 C163.70,39 189,62.34 189,91.15 C189,93.81 188.78,96.42 188.36,98.975 C184.27,73.88 160.82,54.64 132.5,54.64 C104.17,54.64 80.72,73.88 76.63,98.975 Z"
                            id="Band"
                            stroke="none"
                            fill="#92D9FF"
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
LongHairFroBand.optionValue = 'LongHairFroBand';
