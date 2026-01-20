import * as React from 'react';
import Eyepatch from './Eyepatch';
import Hat from './Hat';
import Hijab from './Hijab';
import LongHairBigHair from './LongHairBigHair';
import LongHairBob from './LongHairBob';
import LongHairBun from './LongHairBun';
import LongHairCurly from './LongHairCurly';
import LongHairCurvy from './LongHairCurvy';
import LongHairDreads from './LongHairDreads';
import LongHairFrida from './LongHairFrida';
import LongHairFro from './LongHairFro';
import LongHairFroBand from './LongHairFroBand';
import LongHairMiaWallace from './LongHairMiaWallace';
import LongHairNotTooLong from './LongHairNotTooLong';
import LongHairShavedSides from './LongHairShavedSides';
import LongHairStraight from './LongHairStraight';
import LongHairStraight2 from './LongHairStraight2';
import LongHairStraightStrand from './LongHairStraightStrand';
import NoHair from './NoHair';
import ShortHairDreads01 from './ShortHairDreads01';
import ShortHairDreads02 from './ShortHairDreads02';
import ShortHairFrizzle from './ShortHairFrizzle';
import ShortHairShaggyMullet from './ShortHairShaggyMullet';
import ShortHairShortCurly from './ShortHairShortCurly';
import ShortHairShortFlat from './ShortHairShortFlat';
import ShortHairShortRound from './ShortHairShortRound';
import ShortHairShortWaved from './ShortHairShortWaved';
import ShortHairSides from './ShortHairSides';
import ShortHairTheCaesar from './ShortHairTheCaesar';
import ShortHairTheCaesarSidePart from './ShortHairTheCaesarSidePart';
import Turban from './Turban';
import WinterHat1 from './WinterHat1';
import WinterHat2 from './WinterHat2';
import WinterHat3 from './WinterHat3';
import WinterHat4 from './WinterHat4';
import CustomHair1 from './CustomHair1';
import CustomHair2 from './CustomHair2';
import CustomHair3 from './CustomHair3';
import CustomHair4 from './CustomHair4';
import CustomHair5 from './CustomHair5';
import CustomHair6 from './CustomHair6';
import CustomHair7 from './CustomHair7';
import CustomHair8 from './CustomHair8';
import { Selector, TopOption } from '../../options';

export default class Top extends React.Component {
    render() {
        const { children } = this.props;
        return (
            <Selector defaultOption={LongHairStraight} option={TopOption}>
                <NoHair>{children}</NoHair>
                <Eyepatch>{children}</Eyepatch>
                <Hat>{children}</Hat>
                <Hijab>{children}</Hijab>
                <Turban>{children}</Turban>
                <WinterHat1>{children}</WinterHat1>
                <WinterHat2>{children}</WinterHat2>
                <WinterHat3>{children}</WinterHat3>
                <WinterHat4>{children}</WinterHat4>
                <LongHairBigHair>{children}</LongHairBigHair>
                <LongHairBob>{children}</LongHairBob>
                <LongHairBun>{children}</LongHairBun>
                <LongHairCurly>{children}</LongHairCurly>
                <LongHairCurvy>{children}</LongHairCurvy>
                <LongHairDreads>{children}</LongHairDreads>
                <LongHairFrida>{children}</LongHairFrida>
                <LongHairFro>{children}</LongHairFro>
                <LongHairFroBand>{children}</LongHairFroBand>
                <LongHairNotTooLong>{children}</LongHairNotTooLong>
                <LongHairShavedSides>{children}</LongHairShavedSides>
                <LongHairMiaWallace>{children}</LongHairMiaWallace>
                <LongHairStraight>{children}</LongHairStraight>
                <LongHairStraight2>{children}</LongHairStraight2>
                <LongHairStraightStrand>{children}</LongHairStraightStrand>
                <ShortHairDreads01>{children}</ShortHairDreads01>
                <ShortHairDreads02>{children}</ShortHairDreads02>
                <ShortHairFrizzle>{children}</ShortHairFrizzle>

                <ShortHairShaggyMullet>{children}</ShortHairShaggyMullet>
                <ShortHairShortCurly>{children}</ShortHairShortCurly>
                <ShortHairShortFlat>{children}</ShortHairShortFlat>
                <ShortHairShortRound>{children}</ShortHairShortRound>
                <ShortHairShortWaved>{children}</ShortHairShortWaved>
                <ShortHairSides>{children}</ShortHairSides>
                <ShortHairTheCaesar>{children}</ShortHairTheCaesar>
                <ShortHairTheCaesarSidePart>{children}</ShortHairTheCaesarSidePart>

                <CustomHair1>{children}</CustomHair1>
                <CustomHair2>{children}</CustomHair2>
                <CustomHair3>{children}</CustomHair3>
                <CustomHair4>{children}</CustomHair4>
                <CustomHair5>{children}</CustomHair5>
                <CustomHair6>{children}</CustomHair6>
                <CustomHair7>{children}</CustomHair7>
                <CustomHair8>{children}</CustomHair8>
            </Selector>
        );
    }
}
