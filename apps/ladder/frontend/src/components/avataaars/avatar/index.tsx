import * as React from 'react';
import { uniqueId } from 'lodash';
import Accessories from './top/accessories';
import Clothe from './clothes';
import Face from './face';
import Skin from './Skin';
import Top from './top';
import Medal from './Medal';

export var AvatarStyle;
(function (AvatarStyle) {
    AvatarStyle.Circle = 'Circle';
    AvatarStyle.Transparent = 'Transparent';
})(AvatarStyle || (AvatarStyle = {}));
export default class Avatar extends React.Component {
    constructor() {
        super(...arguments);
        this.path1 = uniqueId('react-path-');
        this.path2 = uniqueId('react-path-');
        this.path3 = uniqueId('react-path-');
        this.mask1 = uniqueId('react-mask-');
        this.mask2 = uniqueId('react-mask-');
        this.mask3 = uniqueId('react-mask-');
    }

    render() {
        const { path1, path2, path3, mask1, mask2, mask3 } = this;
        const { avatarStyle, isWinner, anonymous } = this.props;
        const circle = avatarStyle === AvatarStyle.Circle;
        return (
            <svg
                style={this.props.style}
                width="244px"
                height="280px"
                viewBox="10 0 244 280"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
            >
                <defs>
                    <circle id={path1} cx="120" cy="120" r="120" />
                    <path
                        d="M12,160 C12,226.27 65.72,280 132,280 C198.27,280 252,226.27 252,160 L264,160 L264,-1.42e-14 L-3.19e-14,-1.42e-14 L-3.19e-14,160 L12,160 Z"
                        id={path2}
                    />
                    <path
                        d="M 124 144.61 L 124 163.5 L 128 163.5 C 167.76 163.5 199.5 195.23 199.5 235 L 199.5 243.5 L 1.5 243.5 L 1.5 235 C 1 195.23 32.23 163.5 72 163.5 L 76 163.5 L 76 144.61 C 58.76 136.42 46.37 119.68 44.3 99.88 C 38.48 99.05 34 94.05 34 88 L 34 74 C 34 68.05 38.32 63.11 44 62.16 L 44 56 C 44 25.07 69.07 0 100 0 C 130.92 0 156 25.07 156 56 L 156 62.16 C 161.67 63.11 166 68.05 166 74 L 166 88 C 166 94.05 161.51 99.05 155.69 99.88 C 153.62 119.68 141.23 136.42 124 144.61 Z"
                        id={path3}
                    />
                </defs>
                <g id="Avataaar" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                    <g transform="translate(-825.00, -1100.00)" id="Avataaar/Circle">
                        <g transform="translate(825.00, 1100.00)">
                            {circle ? (
                                <g id="Circle" strokeWidth="1" fillRule="evenodd" transform="translate(12.00, 40.00)">
                                    <mask id={mask1} fill="white">
                                        <use xlinkHref={'#' + path1} />
                                    </mask>
                                    <use id="Circle-Background" fill="#E6E6E6" xlinkHref={'#' + path1} />
                                    <g id="Color/Palette/Blue-01" mask={'url(#' + mask1 + ')'} fill="#65C9FF">
                                        <rect id="🖍Color" x="0" y="0" width="240" height="240" />
                                    </g>
                                </g>
                            ) : null}
                            {circle ? (
                                <mask id={mask2} fill="white">
                                    <use xlinkHref={'#' + path2} />
                                </mask>
                            ) : null}
                            <g id="Mask" />
                            <g id="Avataaar" strokeWidth="1" fillRule="evenodd" mask={'url(#' + mask2 + ')'}>
                                <g id="Body" transform="translate(32.00, 36.00)">
                                    <mask id={mask3} fill="white">
                                        <use xlinkHref={'#' + path3} />
                                    </mask>
                                    <use fill="#D0C6AC" xlinkHref={'#' + path3} />
                                    <Skin maskID={mask3} />
                                    <path
                                        d="M156,79 L156,102 C156,132.92 130.92,158 100,158 C69.07,158 44,132.92 44,102 L44,79 L44,94 C44,124.92 69.07,150 100,150 C130.92,150 156,124.92 156,94 L156,79 Z"
                                        id="Neck-Shadow"
                                        fillOpacity="0.10"
                                        fill="#000000"
                                        mask={'url(#' + mask3 + ')'}
                                    />
                                </g>
                                <Clothe />
                                {!anonymous && <Face />}
                                {isWinner && <Medal />}
                                <Top>
                                    <Accessories />
                                </Top>
                            </g>
                        </g>
                    </g>
                </g>
            </svg>
        );
    }
}
