import * as PropTypes from 'prop-types';
import * as React from 'react';
import Avatar from './avatar';
import { OptionContext, allOptions } from './options';
import { default as PieceComponent } from './avatar/piece';

export { default as Avatar, AvatarStyle } from './avatar';
export { Option, OptionContext, allOptions } from './options';
export default class AvatarComponent extends React.Component {
    constructor() {
        super(...arguments);
        this.optionContext = new OptionContext(allOptions);
    }

    getChildContext() {
        return { optionContext: this.optionContext };
    }

    componentWillMount() {
        this.updateOptionContext(this.props);
    }

    componentWillReceiveProps(nextProps) {
        this.updateOptionContext(nextProps);
    }

    render() {
        const { avatarStyle, style, isWinner, anonymous } = this.props;
        return <Avatar avatarStyle={avatarStyle} style={style} isWinner={isWinner} anonymous={anonymous} />;
    }

    updateOptionContext(props) {
        const data = {};
        for (const option of allOptions) {
            const value = props[option.key];
            if (!value) {
                continue;
            }
            data[option.key] = value;
        }
        this.optionContext.setData(data);
    }
}
AvatarComponent.childContextTypes = {
    optionContext: PropTypes.instanceOf(OptionContext),
};
export class Piece extends React.Component {
    constructor() {
        super(...arguments);
        this.optionContext = new OptionContext(allOptions);
    }

    getChildContext() {
        return { optionContext: this.optionContext };
    }

    componentWillMount() {
        this.updateOptionContext(this.props);
    }

    componentWillReceiveProps(nextProps) {
        this.updateOptionContext(nextProps);
    }

    render() {
        const { avatarStyle, style, pieceType, pieceSize, viewBox } = this.props;
        return (
            <PieceComponent
                avatarStyle={avatarStyle}
                style={style}
                pieceType={pieceType}
                pieceSize={pieceSize}
                viewBox={viewBox}
            />
        );
    }

    updateOptionContext(props) {
        const data = {};
        for (const option of allOptions) {
            const value = props[option.key];
            if (!value) {
                continue;
            }
            data[option.key] = value;
        }
        this.optionContext.setData(data);
    }
}
Piece.childContextTypes = {
    optionContext: PropTypes.instanceOf(OptionContext),
};
