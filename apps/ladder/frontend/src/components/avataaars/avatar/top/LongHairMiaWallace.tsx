import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class LongHairMiaWallace extends React.Component {
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
                        d="M148.85,69 C148.95,70.32 149,71.65 149,73 L149,111 C149,133.33 135.91,152.62 117,161.61 L117,170.31 C135.14,171.81 152.72,174.33 163.00,177 C172.95,163.43 185.88,150.80 186.00,126 C186.08,107.01 158.32,30.42 146.00,15 C137.86,4.81 117.30,1.44 93.00,1 C68.69,0.55 48.92,6.50 41,16 C30.31,28.79 -0.08,107.01 4.92e-13,126 C0.11,150.80 13.04,163.43 23,177 C33.27,174.33 50.85,171.81 69,170.31 L69,161.61 C50.08,152.62 37,133.33 37,111 L37,73 L37,73 C37,71.65 37.04,70.32 37.14,69 L65.37,69 L69.25,47.55 L72.05,69 L148.85,69 Z"
                        id={path2}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path1} />
                </mask>
                <g id="Mask" />
                <g id="Top/Long-Hair/Mia-Wallace" mask={`url(#${mask1})`}>
                    <g transform="translate(-1.00, 0.00)">
                        <path
                            d="M69.03,76.21 C81.97,43.12 95.64,26.58 110.05,26.58 C110.59,26.58 139.31,26.34 158.11,26.22 C178.76,35.58 193,55.30 193,78.11 L193,93 L110.05,93 L107.25,69.82 L103.37,93 L69,93 L69,78.11 C69,77.47 69.01,76.84 69.03,76.21 L69.03,76.21 Z"
                            id="Shadow"
                            fillOpacity="0.16"
                            fill="#000000"
                            fillRule="evenodd"
                        />
                        <g id="Hair" strokeWidth="1" fill="none" fillRule="evenodd" transform="translate(40.00, 19.00)">
                            <mask id={mask2} fill="white">
                                <use xlinkHref={'#' + path2} />
                            </mask>
                            <use id="Combined-Shape" fill="#E6E6E6" xlinkHref={'#' + path2} />
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
LongHairMiaWallace.optionValue = 'LongHairMiaWallace';
