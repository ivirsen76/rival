// @ts-nocheck
import * as React from 'react';
import { uniqueId } from 'lodash';
import FacialHair from './facialHair';
import HairColor from './HairColor';

export default class WinterHat2 extends React.Component {
    constructor() {
        super(...arguments);
        this.mask1 = uniqueId('react-mask-');
        this.mask2 = uniqueId('react-mask-');
        this.path1 = uniqueId('react-path-');
        this.path2 = uniqueId('react-path-');
        this.path3 = uniqueId('react-path-');
    }

    render() {
        const { mask1, mask2, path1, path2, path3 } = this;
        return (
            <g id="Top">
                <defs>
                    <rect id={path3} x="0" y="0" width="264" height="280" />
                    <path
                        d="M72,21 C126.77,21 144,68.80 144,103.04 L144,176.91 C144,196.40 121.36,196.44 121.36,165.98 L121.36,86.53 C121.36,80.45 117.63,77.53 111.55,77.53 L72,77.53 L32.44,77.53 C26.36,77.53 22.63,80.45 22.63,86.53 L22.63,165.98 C22.63,196.44 -1.41e-14,196.40 0,176.91 L0,103.04 C-7.11e-15,68.80 17.22,21 72,21 Z"
                        id={path1}
                    />
                    <path
                        d="M101.42,98.16 C98.91,100.46 96.23,101.49 92.85,100.77 C92.27,100.64 89.89,96.23 83.99,96.23 C78.10,96.23 75.72,100.64 75.14,100.77 C71.76,101.49 69.08,100.46 66.57,98.16 C61.84,93.85 57.91,87.90 60.27,81.41 C61.50,78.03 63.50,74.32 67.15,73.24 C71.03,72.09 76.49,73.24 80.41,72.45 C81.68,72.20 83.07,71.75 83.99,71 C84.92,71.75 86.31,72.20 87.58,72.45 C91.50,73.24 96.96,72.09 100.84,73.24 C104.48,74.32 106.49,78.03 107.72,81.41 C110.08,87.90 106.15,93.85 101.42,98.16 M140.08,26 C136.67,34.40 137.98,44.85 137.35,53.67 C136.84,60.84 135.33,71.58 128.97,76.21 C125.71,78.58 119.79,82.55 115.54,81.45 C112.61,80.68 112.30,72.29 108.45,69.14 C104.09,65.58 98.64,64.01 93.14,64.25 C90.77,64.36 85.98,64.33 83.99,66.16 C82.01,64.33 77.22,64.36 74.85,64.25 C69.35,64.01 63.90,65.58 59.54,69.14 C55.69,72.29 55.38,80.68 52.45,81.45 C48.20,82.55 42.28,78.58 39.02,76.21 C32.66,71.58 31.15,60.84 30.64,53.67 C30.01,44.85 31.32,34.40 27.91,26 C26.25,26 27.35,42.12 27.35,42.12 L27.35,62.48 C27.38,77.77 36.93,100.65 58.10,109.39 C63.28,111.52 75.01,115 83.99,115 C92.98,115 104.71,111.86 109.89,109.72 C131.06,100.98 140.61,77.77 140.64,62.48 L140.64,42.12 C140.64,42.12 141.74,26 140.08,26"
                        id={path2}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use xlinkHref={'#' + path3} />
                </mask>
                <g id="Mask" />
                <g id="Top/Accessories/Winter-Hat-2" transform="translate(-1.00, 0.00)">
                    <g id="hat" strokeWidth="1" fillRule="evenodd" transform="translate(61.00, 0.00)">
                        <g id="string" transform="translate(0.00, 176.00)" fill="#F4F4F4">
                            <circle id="puff" cx="9" cy="65" r="9" />
                            <rect x="8" y="0" width="2" height="58" />
                        </g>
                        <g id="string" transform="translate(126.00, 168.00)" fill="#F4F4F4">
                            <circle id="puff" cx="9" cy="65" r="9" />
                            <rect x="8" y="0" width="2" height="58" />
                        </g>
                        <circle id="puff" fill="#F4F4F4" cx="72" cy="20" r="20" />
                        <mask id={mask2} fill="white">
                            <use xlinkHref={'#' + path1} />
                        </mask>
                        <use id="Combined-Shape" fill="#F4F4F4" xlinkHref={'#' + path1} />
                        <HairColor maskID={mask2} defaultColor="Blue01" />
                        <rect
                            id="color-dark"
                            fillOpacity="0.2"
                            fill="#000000"
                            x="-1"
                            y="21"
                            width="146"
                            height="46"
                            mask={`url(#${mask2})`}
                        />
                        <g id="light-triangles" transform="translate(29.00, 32.00)" fill="#FFFFFF" fillOpacity="0.5">
                            <polygon
                                id="Triangle"
                                transform="translate(12.50, 9.00) rotate(180.00) translate(-12.50, -9.00) "
                                points="12.5 0 25 18 0 18"
                            />
                            <polygon
                                id="Triangle"
                                transform="translate(43.50, 9.00) rotate(180.00) translate(-43.50, -9.00) "
                                points="43.5 0 56 18 31 18"
                            />
                            <polygon
                                id="Triangle"
                                transform="translate(74.50, 9.00) rotate(180.00) translate(-74.50, -9.00) "
                                points="74.5 0 87 18 62 18"
                            />
                        </g>
                        <g id="dark-triangles" transform="translate(13.00, 41.00)" fill="#000000" fillOpacity="0.5">
                            <polygon id="Triangle" points="12.5 0 25 18 0 18" />
                            <polygon id="Triangle" points="43.5 0 56 18 31 18" />
                            <polygon id="Triangle" points="74.5 0 87 18 62 18" />
                            <polygon id="Triangle" points="105.5 0 118 18 93 18" />
                        </g>
                    </g>
                    <FacialHair />
                    {this.props.children}
                </g>
            </g>
        );
    }
}
WinterHat2.optionValue = 'WinterHat2';
