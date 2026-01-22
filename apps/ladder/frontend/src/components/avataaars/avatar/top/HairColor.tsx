// @ts-nocheck
import * as React from 'react';
import { HairColorOption, Selector } from '../../options';

export const colors = {
    Auburn: '#A55728',
    Black: '#2C1B18',
    Blonde: '#B58143',
    BlondeGolden: '#D6B370',
    Brown: '#724133',
    BrownDark: '#4A312C',
    PastelPink: '#F59797',
    Platinum: '#ECDCBF',
    Red: '#C93305',
    SilverGray: '#E8E1E1',
    PastelGreen: '#228B22',
    PastelOrange: '#FFA500',
    Blue01: '#65C9FF',
};

function makeColor(name) {
    class ColorComponent extends React.Component {
        render() {
            return (
                <g id="Skin/👶🏽-03-Brown" mask={`url(#${this.props.maskID})`} fill={colors[name]}>
                    <g transform="translate(0.00, 0.00) " id="Color">
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

const Auburn = makeColor('Auburn');
const Black = makeColor('Black');
const Blonde = makeColor('Blonde');
const BlondeGolden = makeColor('BlondeGolden');
const Brown = makeColor('Brown');
const BrownDark = makeColor('BrownDark');
const PastelPink = makeColor('PastelPink');
const Platinum = makeColor('Platinum');
const Red = makeColor('Red');
const SilverGray = makeColor('SilverGray');
const PastelGreen = makeColor('PastelGreen');
const PastelOrange = makeColor('PastelOrange');
const Blue01 = makeColor('Blue01');

export default class HairColor extends React.Component {
    render() {
        return (
            <Selector option={HairColorOption} defaultOption={BrownDark}>
                <Auburn maskID={this.props.maskID} />
                <Black maskID={this.props.maskID} />
                <Blonde maskID={this.props.maskID} />
                <BlondeGolden maskID={this.props.maskID} />
                <Brown maskID={this.props.maskID} />
                <BrownDark maskID={this.props.maskID} />
                <PastelPink maskID={this.props.maskID} />
                <Platinum maskID={this.props.maskID} />
                <Red maskID={this.props.maskID} />
                <SilverGray maskID={this.props.maskID} />
                <PastelGreen maskID={this.props.maskID} />
                <PastelOrange maskID={this.props.maskID} />
                <Blue01 maskID={this.props.maskID} />
            </Selector>
        );
    }
}
