import * as React from 'react';
import { ClotheColorOption, Selector } from '../../options';

export const colors = {
    Black: '#262E33',
    Blue01: '#65C9FF',
    Blue02: '#5199E4',
    Blue03: '#25557C',
    Gray01: '#E6E6E6',
    Gray02: '#929598',
    Heather: '#3C4F5C',
    PastelBlue: '#B1E2FF',
    PastelGreen: '#228B22',
    PastelOrange: '#FFA500',
    PastelRed: '#FFAFB9',
    PastelYellow: '#FFD700',
    TennisBall: '#d1e625',
    Pink: '#FF488E',
    Red: '#c93305',
    White: '#FFFFFF',
};

function makeColor(name) {
    class ColorComponent extends React.Component {
        render() {
            return (
                <g
                    id="Color/Palette/Gray-01"
                    mask={`url(#${this.props.maskID})`}
                    fillRule="evenodd"
                    fill={colors[name]}
                >
                    <rect id="🖍Color" x="0" y="0" width="264" height="110" />
                </g>
            );
        }
    }
    const anyComponent = ColorComponent;
    anyComponent.displayName = name;
    anyComponent.optionValue = name;
    return anyComponent;
}
const Black = makeColor('Black');
const Blue01 = makeColor('Blue01');
const Blue02 = makeColor('Blue02');
const Blue03 = makeColor('Blue03');
const Gray01 = makeColor('Gray01');
const Gray02 = makeColor('Gray02');
const Heather = makeColor('Heather');
const PastelBlue = makeColor('PastelBlue');
const PastelGreen = makeColor('PastelGreen');
const PastelOrange = makeColor('PastelOrange');
const PastelRed = makeColor('PastelRed');
const PastelYellow = makeColor('PastelYellow');
const TennisBall = makeColor('TennisBall');
const Pink = makeColor('Pink');
const Red = makeColor('Red');
const White = makeColor('White');

export default class Colors extends React.Component {
    render() {
        return (
            <Selector option={ClotheColorOption} defaultOption={Gray01}>
                <Black maskID={this.props.maskID} />
                <Blue01 maskID={this.props.maskID} />
                <Blue02 maskID={this.props.maskID} />
                <Blue03 maskID={this.props.maskID} />
                <Gray01 maskID={this.props.maskID} />
                <Gray02 maskID={this.props.maskID} />
                <Heather maskID={this.props.maskID} />
                <PastelBlue maskID={this.props.maskID} />
                <PastelGreen maskID={this.props.maskID} />
                <PastelOrange maskID={this.props.maskID} />
                <PastelRed maskID={this.props.maskID} />
                <PastelYellow maskID={this.props.maskID} />
                <TennisBall maskID={this.props.maskID} />
                <Pink maskID={this.props.maskID} />
                <Red maskID={this.props.maskID} />
                <White maskID={this.props.maskID} />
            </Selector>
        );
    }
}
