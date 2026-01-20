import * as React from 'react';

export default class Cry extends React.Component {
    render() {
        return (
            <g id="Eyes/Cry-😢" transform="translate(0.00, 8.00)">
                <circle id="Eye" fillOpacity="0.59" fill="#000000" fillRule="evenodd" cx="30" cy="22" r="6" />
                <path
                    d="M25,27 C25,27 19,34.27 19,38.27 C19,41.58 21.686,44.27 25,44.27 C28.314,44.27 31,41.58 31,38.27 C31,34.27 25,27 25,27 Z"
                    id="Drop"
                    fill="#92D9FF"
                    fillRule="nonzero"
                />
                <circle id="Eye" fillOpacity="0.59" fill="#000000" fillRule="evenodd" cx="82" cy="22" r="6" />
            </g>
        );
    }
}
Cry.optionValue = 'Cry';
