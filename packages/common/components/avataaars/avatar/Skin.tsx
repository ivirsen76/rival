// @ts-nocheck
import * as React from 'react';
import { Selector, SkinOption } from '../options';

function makeColor(name, color) {
    class ColorComponent extends React.Component {
        render() {
            return (
                <g id="Skin/👶🏽-03-Brown" mask={`url(#${this.props.maskID})`} fill={color}>
                    <g transform="translate(0.00, 0.00)" id="Color">
                        <rect x="0" y="0" width="264" height="280" />
                    </g>
                </g>
            );
        }
    }
    const anyComponent = ColorComponent;
    anyComponent.displayName = name;
    anyComponent.optionValue = name;
    return anyComponent;
}
const Tanned = makeColor('Tanned', '#FD9841');
const Yellow = makeColor('Yellow', '#F8D25C');
const Pale = makeColor('Pale', '#FFDBB4');
const Light = makeColor('Light', '#EDB98A');
const Brown = makeColor('Brown', '#D08B5B');
const DarkBrown = makeColor('DarkBrown', '#AE5D29');
const Black = makeColor('Black', '#614335');
export default class Skin extends React.Component {
    render() {
        return (
            <Selector option={SkinOption} defaultOption={Light}>
                <Tanned maskID={this.props.maskID} />
                <Yellow maskID={this.props.maskID} />
                <Pale maskID={this.props.maskID} />
                <Light maskID={this.props.maskID} />
                <Brown maskID={this.props.maskID} />
                <DarkBrown maskID={this.props.maskID} />
                <Black maskID={this.props.maskID} />
            </Selector>
        );
    }
}
