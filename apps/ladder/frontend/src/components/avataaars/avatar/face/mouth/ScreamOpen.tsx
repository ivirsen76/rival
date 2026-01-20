import * as React from 'react';
import { uniqueId } from 'lodash';

export default class ScreamOpen extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.mask1 = uniqueId('react-mask-');
    }

    render() {
        const { path1, mask1 } = this;
        return (
            <g id="Mouth/Scream-Open" transform="translate(2.00, 52.00)">
                <defs>
                    <path
                        d="M34.00,15.13 C35.12,29.12 38.23,40.99 53.99,40.99 C69.75,41.00 72.91,29.05 73.99,15.00 C74.08,13.87 73.17,12.99 72.03,12.99 C65.35,12.99 62.67,14.99 53.98,14.99 C45.30,15.00 40.75,12.99 36.09,12.99 C34.94,12.99 33.89,13.73 34.00,15.13 Z"
                        id={path1}
                    />
                </defs>
                <mask id={mask1} fill="white">
                    <use
                        xlinkHref={'#' + path1}
                        transform="translate(54.00, 26.99) scale(1, -1) translate(-54.00, -26.99) "
                    />
                </mask>
                <use
                    id="Mouth"
                    fillOpacity="0.69"
                    fill="#000000"
                    fillRule="evenodd"
                    transform="translate(54.00, 26.99) scale(1, -1) translate(-54.00, -26.99) "
                    xlinkHref={'#' + path1}
                />
                <rect
                    id="Teeth"
                    fill="#FFFFFF"
                    fillRule="evenodd"
                    mask={`url(#${mask1})`}
                    x="39"
                    y="2"
                    width="31"
                    height="16"
                    rx="5"
                />
                <g id="Tongue" strokeWidth="1" fillRule="evenodd" mask={`url(#${mask1})`} fill="#FF4F6D">
                    <g transform="translate(38.00, 32.00)" id="Say-ahhhh">
                        <circle cx="11" cy="11" r="11" />
                        <circle cx="21" cy="11" r="11" />
                    </g>
                </g>
            </g>
        );
    }
}
ScreamOpen.optionValue = 'ScreamOpen';
