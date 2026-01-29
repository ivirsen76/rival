// @ts-nocheck
import * as React from 'react';
import Eyebrow from './eyebrow';
import Eyes from './eyes';
import Mouth from './mouth';
import Nose from './nose/Default';

export default class Face extends React.Component {
    render() {
        return (
            <g id="Face" transform="translate(76.00, 82.00)" fill="#000000">
                <Mouth />
                <Nose />
                <Eyes />
                <Eyebrow />
            </g>
        );
    }
}
